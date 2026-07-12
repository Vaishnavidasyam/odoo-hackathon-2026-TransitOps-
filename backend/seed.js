import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

import User from './models/User.js';
import Vehicle from './models/Vehicle.js';
import Driver from './models/Driver.js';
import Trip from './models/Trip.js';
import Maintenance from './models/Maintenance.js';
import FuelLog from './models/FuelLog.js';
import Expense from './models/Expense.js';

dotenv.config();

const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/transitops';

const seedDatabase = async () => {
  try {
    console.log('Connecting to database for seeding...');
    await mongoose.connect(mongoURI);
    console.log('Connected. Clearing existing collections...');

    await User.deleteMany({});
    await Vehicle.deleteMany({});
    await Driver.deleteMany({});
    await Trip.deleteMany({});
    await Maintenance.deleteMany({});
    await FuelLog.deleteMany({});
    await Expense.deleteMany({});

    console.log('Collections cleared. Seeding users...');

    // Hash passwords
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    const users = [
      { name: 'Marcus Sterling', email: 'manager@transitops.com', password: passwordHash, role: 'Fleet Manager', region: 'North' },
      { name: 'Alex Mercer', email: 'driver@transitops.com', password: passwordHash, role: 'Driver', region: 'North' },
      { name: 'Sarah Connor', email: 'safety@transitops.com', password: passwordHash, role: 'Safety Officer', region: 'South' },
      { name: 'David Croft', email: 'finance@transitops.com', password: passwordHash, role: 'Financial Analyst', region: 'East' },
    ];

    const seededUsers = await User.insertMany(users);
    console.log(`Seeded ${seededUsers.length} users.`);

    console.log('Seeding vehicles...');
    const vehicles = [
      { registrationNumber: 'VAN-01', nameModel: 'Ford Transit 350', type: 'Van', maxLoadCapacity: 1200, odometer: 45000, acquisitionCost: 32000, status: 'Available', region: 'North' },
      { registrationNumber: 'VAN-02', nameModel: 'Mercedes-Benz Sprinter', type: 'Van', maxLoadCapacity: 1500, odometer: 68000, acquisitionCost: 45000, status: 'On Trip', region: 'North' },
      { registrationNumber: 'TRK-01', nameModel: 'Volvo FH16 Semi', type: 'Truck', maxLoadCapacity: 25000, odometer: 125000, acquisitionCost: 140000, status: 'Available', region: 'South' },
      { registrationNumber: 'TRK-02', nameModel: 'Freightliner Cascadia', type: 'Truck', maxLoadCapacity: 24000, odometer: 95000, acquisitionCost: 125000, status: 'In Shop', region: 'East' },
      { registrationNumber: 'REF-01', nameModel: 'Thermo King Reefer', type: 'Reefer', maxLoadCapacity: 18000, odometer: 52000, acquisitionCost: 98000, status: 'Available', region: 'West' },
      { registrationNumber: 'FLT-01', nameModel: 'Great Dane Flatbed', type: 'Flatbed', maxLoadCapacity: 22000, odometer: 38000, acquisitionCost: 65000, status: 'Available', region: 'North' },
      { registrationNumber: 'SED-01', nameModel: 'Toyota Prius Dispatch', type: 'Sedan', maxLoadCapacity: 400, odometer: 15000, acquisitionCost: 24000, status: 'Retired', region: 'West' },
    ];

    const seededVehicles = await Vehicle.insertMany(vehicles);
    console.log(`Seeded ${seededVehicles.length} vehicles.`);

    console.log('Seeding drivers...');
    const drivers = [
      { name: 'Alex Mercer', licenseNumber: 'DL-98273641', licenseCategory: 'Class A CDL', licenseExpiryDate: new Date('2028-05-15'), contactNumber: '+1-555-0192', safetyScore: 98, status: 'Available' },
      { name: 'Bob Jenkins', licenseNumber: 'DL-10928374', licenseCategory: 'Class A CDL', licenseExpiryDate: new Date('2027-11-20'), contactNumber: '+1-555-0143', safetyScore: 82, status: 'On Trip' },
      { name: 'Charlie Devins', licenseNumber: 'DL-88273645', licenseCategory: 'Class B CDL', licenseExpiryDate: new Date('2026-07-20'), contactNumber: '+1-555-0187', safetyScore: 90, status: 'Available' }, // License soon expiring
      { name: 'David Miller', licenseNumber: 'DL-44827361', licenseCategory: 'Class A CDL', licenseExpiryDate: new Date('2025-12-01'), contactNumber: '+1-555-0112', safetyScore: 65, status: 'Suspended' }, // Suspended
      { name: 'Ethan Hunt', licenseNumber: 'DL-22938475', licenseCategory: 'Class C Standard', licenseExpiryDate: new Date('2029-02-28'), contactNumber: '+1-555-0155', safetyScore: 95, status: 'Off Duty' },
    ];

    const seededDrivers = await Driver.insertMany(drivers);
    console.log(`Seeded ${seededDrivers.length} drivers.`);

    // Find models for linking
    const van1 = seededVehicles.find(v => v.registrationNumber === 'VAN-01');
    const van2 = seededVehicles.find(v => v.registrationNumber === 'VAN-02');
    const trk1 = seededVehicles.find(v => v.registrationNumber === 'TRK-01');
    const trk2 = seededVehicles.find(v => v.registrationNumber === 'TRK-02');
    const ref1 = seededVehicles.find(v => v.registrationNumber === 'REF-01');

    const alex = seededDrivers.find(d => d.name === 'Alex Mercer');
    const bob = seededDrivers.find(d => d.name === 'Bob Jenkins');
    const charlie = seededDrivers.find(d => d.name === 'Charlie Devins');

    console.log('Seeding trips...');
    const trips = [
      {
        source: 'New York Logistics Hub',
        destination: 'Boston Distribution Center',
        vehicle: van1._id,
        driver: alex._id,
        cargoWeight: 800,
        plannedDistance: 350,
        actualDistance: 355,
        status: 'Completed',
        dispatchedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
      },
      {
        source: 'Chicago Hub',
        destination: 'Detroit Depot',
        vehicle: van2._id,
        driver: bob._id,
        cargoWeight: 950,
        plannedDistance: 450,
        status: 'Dispatched',
        dispatchedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
      },
      {
        source: 'Miami Port',
        destination: 'Atlanta Warehouse',
        vehicle: trk1._id,
        driver: charlie._id,
        cargoWeight: 18000,
        plannedDistance: 1050,
        actualDistance: 1060,
        status: 'Completed',
        dispatchedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000)
      },
      {
        source: 'Los Angeles Hub',
        destination: 'Seattle Depot',
        vehicle: ref1._id,
        driver: alex._id,
        cargoWeight: 14000,
        plannedDistance: 1800,
        status: 'Draft',
        createdAt: new Date()
      }
    ];

    const seededTrips = await Trip.insertMany(trips);
    console.log(`Seeded ${seededTrips.length} trips.`);

    const trip1 = seededTrips.find(t => t.source.includes('New York'));
    const trip3 = seededTrips.find(t => t.source.includes('Miami'));

    console.log('Seeding fuel logs...');
    const fuelLogs = [
      { vehicle: van1._id, trip: trip1._id, liters: 45, cost: 78.50, date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
      { vehicle: trk1._id, trip: trip3._id, liters: 320, cost: 650.00, date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      { vehicle: van2._id, liters: 38, cost: 62.10, date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) }
    ];

    const seededFuel = await FuelLog.insertMany(fuelLogs);
    console.log(`Seeded ${seededFuel.length} fuel logs.`);

    console.log('Seeding maintenance records...');
    const maintenance = [
      { vehicle: trk2._id, description: 'Brake pad replacement and alignment', cost: 1200, status: 'Active', startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
      { vehicle: van1._id, description: 'Engine Oil and Filter Change', cost: 120, status: 'Closed', startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), endDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000) }
    ];

    const seededMaintenance = await Maintenance.insertMany(maintenance);
    console.log(`Seeded ${seededMaintenance.length} maintenance records.`);

    console.log('Seeding other expenses...');
    const expenses = [
      // Feed fuel logs and maintenance as expenses too for reports ledger
      { vehicle: van1._id, trip: trip1._id, type: 'Other', amount: 78.50, description: 'Fuel Logging: 45L', date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
      { vehicle: trk1._id, trip: trip3._id, type: 'Other', amount: 650.00, description: 'Fuel Logging: 320L', date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      { vehicle: van2._id, type: 'Other', amount: 62.10, description: 'Fuel Logging: 38L', date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
      
      { vehicle: trk2._id, type: 'Maintenance', amount: 1200, description: 'Maintenance: Brake pad replacement and alignment', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
      { vehicle: van1._id, type: 'Maintenance', amount: 120, description: 'Maintenance: Engine Oil and Filter Change', date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) },
      
      // Standalone Tolls and Permits
      { vehicle: van1._id, trip: trip1._id, type: 'Tolls', amount: 24.50, description: 'I-95 Highway Tolls', date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
      { vehicle: trk1._id, trip: trip3._id, type: 'Tolls', amount: 120.00, description: 'Florida Turnpike Tolls', date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) },
      { vehicle: ref1._id, type: 'Permits', amount: 250.00, description: 'California State Food Transport Permit', date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) },
    ];

    const seededExpenses = await Expense.insertMany(expenses);
    console.log(`Seeded ${seededExpenses.length} expense ledger entries.`);

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();
