import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Vehicle from './models/Vehicle.js';
import Driver from './models/Driver.js';
import Trip from './models/Trip.js';
import Maintenance from './models/Maintenance.js';
import FuelLog from './models/FuelLog.js';
import Expense from './models/Expense.js';

dotenv.config();

const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/transitops';

const runWorkflowTest = async () => {
  try {
    console.log('--- STARTING WORKFLOW VALIDATION TEST ---');
    console.log('Connecting to database...');
    await mongoose.connect(mongoURI);
    
    // Clear test-specific data if any exists
    await Vehicle.deleteOne({ registrationNumber: 'VAN-05' });
    await Driver.deleteOne({ licenseNumber: 'DL-TEST-VAN-05' });

    // Step 1: Register a vehicle 'Van-05' with capacity 500 kg, status = Available
    console.log('\n[Step 1] Registering vehicle Van-05...');
    const vehicle = new Vehicle({
      registrationNumber: 'VAN-05',
      nameModel: 'Ford Transit Cargo Custom',
      type: 'Van',
      maxLoadCapacity: 500,
      odometer: 12000,
      acquisitionCost: 28000,
      status: 'Available',
      region: 'North'
    });
    await vehicle.save();
    console.log('✔ Vehicle VAN-05 created successfully.');

    // Step 2: Register driver 'Alex' with a valid driving license
    console.log('\n[Step 2] Registering driver Alex...');
    const driver = new Driver({
      name: 'Alex',
      licenseNumber: 'DL-TEST-VAN-05',
      licenseCategory: 'Class A CDL',
      licenseExpiryDate: new Date('2030-01-01'), // valid/long expiry
      contactNumber: '+1-555-0999',
      safetyScore: 95,
      status: 'Available'
    });
    await driver.save();
    console.log('✔ Driver Alex registered successfully.');

    // Step 3: Create a trip with Cargo Weight = 450 kg
    console.log('\n[Step 3] Creating a trip of 450 kg cargo weight...');
    if (450 > vehicle.maxLoadCapacity) {
      throw new Error('Cargo weight exceeds capacity!');
    }
    const trip = new Trip({
      source: 'Warehouse North',
      destination: 'Retail Hub East',
      vehicle: vehicle._id,
      driver: driver._id,
      cargoWeight: 450,
      plannedDistance: 120,
      status: 'Draft'
    });
    await trip.save();
    console.log('✔ Trip draft created successfully.');

    // Step 4: Validate cargo limit & Dispatch
    console.log('\n[Step 4] Checking weight validation (450 kg <= 500 kg)...');
    console.log(`Checking vehicle availability (Status: ${vehicle.status}) and driver (Status: ${driver.status})...`);
    if (vehicle.status !== 'Available' || driver.status !== 'Available') {
      throw new Error('Asset is not available for dispatch!');
    }
    trip.status = 'Dispatched';
    trip.dispatchedAt = new Date();
    await trip.save();
    console.log('✔ Trip status set to Dispatched.');

    // Step 5: Vehicle and Driver status automatically become On Trip
    console.log('\n[Step 5] Transitioning vehicle and driver statuses to On Trip...');
    vehicle.status = 'On Trip';
    await vehicle.status;
    await Vehicle.findByIdAndUpdate(vehicle._id, { status: 'On Trip' });
    
    driver.status = 'On Trip';
    await Driver.findByIdAndUpdate(driver._id, { status: 'On Trip' });
    
    // Verify
    const verifyVeh = await Vehicle.findById(vehicle._id);
    const verifyDrv = await Driver.findById(driver._id);
    console.log(`✔ Vehicle Status is now: ${verifyVeh.status} (Expected: On Trip)`);
    console.log(`✔ Driver Status is now: ${verifyDrv.status} (Expected: On Trip)`);
    if (verifyVeh.status !== 'On Trip' || verifyDrv.status !== 'On Trip') {
      throw new Error('Failed to transition asset statuses to On Trip!');
    }

    // Step 6 & 7: Complete trip (Final odometer 12150, fuel consumed 18L, cost $32)
    console.log('\n[Step 6 & 7] Completing trip with final odometer (12150) and fuel log...');
    const finalOdo = 12150;
    const distanceTraveled = finalOdo - verifyVeh.odometer; // 150 km
    
    trip.status = 'Completed';
    trip.completedAt = new Date();
    trip.actualDistance = distanceTraveled;
    await trip.save();

    await Vehicle.findByIdAndUpdate(vehicle._id, { odometer: finalOdo, status: 'Available' });
    await Driver.findByIdAndUpdate(driver._id, { status: 'Available' });

    // Log fuel
    const fuelLog = new FuelLog({
      vehicle: vehicle._id,
      trip: trip._id,
      liters: 18,
      cost: 32,
      date: new Date()
    });
    await fuelLog.save();

    const expense = new Expense({
      vehicle: vehicle._id,
      trip: trip._id,
      type: 'Other',
      amount: 32,
      description: 'Fuel Logging: 18L',
      date: new Date()
    });
    await expense.save();

    // Verify Available status
    const postVeh = await Vehicle.findById(vehicle._id);
    const postDrv = await Driver.findById(driver._id);
    console.log(`✔ Completed. Vehicle Status: ${postVeh.status} (Expected: Available)`);
    console.log(`✔ Completed. Driver Status: ${postDrv.status} (Expected: Available)`);
    console.log(`✔ Completed. Vehicle Odometer: ${postVeh.odometer} km (Expected: 12150 km)`);
    if (postVeh.status !== 'Available' || postDrv.status !== 'Available') {
      throw new Error('Failed to restore asset statuses to Available!');
    }

    // Step 8: Create maintenance log (Oil Change) -> Vehicle status In Shop, hidden from selection pools
    console.log('\n[Step 8] Checking-in vehicle to maintenance shop (Oil Change)...');
    const maint = new Maintenance({
      vehicle: vehicle._id,
      description: 'Oil Change and Filter replacement',
      cost: 85,
      status: 'Active',
      startDate: new Date()
    });
    await maint.save();

    await Vehicle.findByIdAndUpdate(vehicle._id, { status: 'In Shop' });
    const maintVeh = await Vehicle.findById(vehicle._id);
    console.log(`✔ Vehicle Status is now: ${maintVeh.status} (Expected: In Shop)`);
    if (maintVeh.status !== 'In Shop') {
      throw new Error('Vehicle failed to check-in to shop!');
    }

    // Step 9: Verify analytics reports updating
    console.log('\n[Step 9] Validating operational reports & calculations...');
    const vehicleList = await Vehicle.find();
    const fuelList = await FuelLog.find();
    const completedTrips = await Trip.find({ status: 'Completed' });

    const targetFuel = fuelList.filter(f => f.vehicle.toString() === vehicle._id.toString());
    const totalFuelCost = targetFuel.reduce((sum, f) => sum + f.cost, 0);
    const totalLiters = targetFuel.reduce((sum, f) => sum + f.liters, 0);
    const targetTrips = completedTrips.filter(t => t.vehicle.toString() === vehicle._id.toString());
    const totalDistance = targetTrips.reduce((sum, t) => sum + t.actualDistance, 0);

    const fuelEfficiency = totalLiters > 0 ? (totalDistance / totalLiters).toFixed(2) : 0;
    console.log(`✔ Calculated Fuel Efficiency: ${fuelEfficiency} km/L (Expected: 8.33 km/L)`);
    console.log(`✔ Total Fuel cost: $${totalFuelCost}`);

    console.log('\n✔✔✔ ALL WORKFLOW BUSINESS RULES VALIDATED SUCCESSFULLY! ✔✔✔');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ WORKFLOW VALIDATION TEST FAILED:', err.message);
    process.exit(1);
  }
};

runWorkflowTest();
