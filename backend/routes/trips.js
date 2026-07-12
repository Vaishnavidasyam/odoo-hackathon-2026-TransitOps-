import express from 'express';
import Trip from '../models/Trip.js';
import Vehicle from '../models/Vehicle.js';
import Driver from '../models/Driver.js';
import FuelLog from '../models/FuelLog.js';
import Expense from '../models/Expense.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get all trips
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};
    if (status) query.status = status;

    const trips = await Trip.find(query)
      .populate('vehicle')
      .populate('driver')
      .sort({ createdAt: -1 });

    res.json(trips);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving trips', error: error.message });
  }
});

// Create trip (Draft state)
router.post('/', authenticateToken, requireRole(['Fleet Manager', 'Driver']), async (req, res) => {
  try {
    const { source, destination, vehicleId, driverId, cargoWeight, plannedDistance } = req.body;

    // Retrieve vehicle
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    // Business Rule: Cargo weight must not exceed max load capacity
    if (cargoWeight > vehicle.maxLoadCapacity) {
      return res.status(400).json({
        message: `Cargo weight (${cargoWeight} kg) exceeds vehicle's maximum load capacity (${vehicle.maxLoadCapacity} kg).`
      });
    }

    // Retrieve driver
    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    const trip = new Trip({
      source,
      destination,
      vehicle: vehicleId,
      driver: driverId,
      cargoWeight,
      plannedDistance,
      status: 'Draft'
    });

    await trip.save();
    res.status(201).json(trip);
  } catch (error) {
    res.status(400).json({ message: 'Error creating trip', error: error.message });
  }
});

// Dispatch a trip
router.post('/:id/dispatch', authenticateToken, requireRole(['Fleet Manager', 'Driver']), async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id)
      .populate('vehicle')
      .populate('driver');

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    if (trip.status !== 'Draft') {
      return res.status(400).json({ message: `Cannot dispatch a trip in '${trip.status}' status.` });
    }

    const vehicle = trip.vehicle;
    const driver = trip.driver;

    // Business Rule: Retired or In Shop vehicles must never appear in the dispatch selection / cannot be dispatched.
    if (vehicle.status === 'Retired' || vehicle.status === 'In Shop') {
      return res.status(400).json({ message: `Selected vehicle is currently in maintenance or retired.` });
    }

    // Business Rule: A driver or vehicle already marked On Trip cannot be assigned to another trip.
    if (vehicle.status === 'On Trip') {
      return res.status(400).json({ message: `Vehicle ${vehicle.registrationNumber} is already on an active trip.` });
    }
    if (driver.status === 'On Trip') {
      return res.status(400).json({ message: `Driver ${driver.name} is already on an active trip.` });
    }

    // Business Rule: Drivers with expired licenses or Suspended status cannot be assigned to trips.
    if (driver.status === 'Suspended') {
      return res.status(400).json({ message: `Driver ${driver.name} is suspended.` });
    }
    if (new Date(driver.licenseExpiryDate) < new Date()) {
      return res.status(400).json({ message: `Driver ${driver.name}'s license has expired.` });
    }

    // Validations passed -> Dispatch
    trip.status = 'Dispatched';
    trip.dispatchedAt = new Date();
    await trip.save();

    // Update statuses to 'On Trip'
    vehicle.status = 'On Trip';
    await vehicle.save();

    driver.status = 'On Trip';
    await driver.save();

    res.json({ message: 'Trip successfully dispatched', trip });
  } catch (error) {
    res.status(500).json({ message: 'Error dispatching trip', error: error.message });
  }
});

// Complete a trip
router.post('/:id/complete', authenticateToken, requireRole(['Fleet Manager', 'Driver']), async (req, res) => {
  try {
    const { finalOdometer, fuelConsumedLiters, fuelCost, extraExpenses } = req.body;

    const trip = await Trip.findById(req.params.id)
      .populate('vehicle')
      .populate('driver');

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    if (trip.status !== 'Dispatched') {
      return res.status(400).json({ message: `Only dispatched trips can be marked as completed.` });
    }

    const vehicle = trip.vehicle;
    const driver = trip.driver;

    // Validate odometer progression
    if (finalOdometer < vehicle.odometer) {
      return res.status(400).json({
        message: `Final odometer (${finalOdometer} km) cannot be less than vehicle's current odometer (${vehicle.odometer} km).`
      });
    }

    const tripDistance = finalOdometer - vehicle.odometer;

    // Update trip details
    trip.status = 'Completed';
    trip.completedAt = new Date();
    trip.actualDistance = tripDistance > 0 ? tripDistance : trip.plannedDistance;
    await trip.save();

    // Update vehicle odometer and status
    vehicle.odometer = finalOdometer;
    vehicle.status = 'Available';
    await vehicle.save();

    // Update driver status
    driver.status = 'Available';
    await driver.save();

    // Optional Fuel Logging
    if (fuelConsumedLiters && fuelCost) {
      const fuelLog = new FuelLog({
        vehicle: vehicle._id,
        trip: trip._id,
        liters: Number(fuelConsumedLiters),
        cost: Number(fuelCost),
        date: new Date()
      });
      await fuelLog.save();
    }

    // Optional Tolls or other expenses
    if (extraExpenses && extraExpenses.length > 0) {
      for (const exp of extraExpenses) {
        const expense = new Expense({
          vehicle: vehicle._id,
          trip: trip._id,
          type: exp.type || 'Tolls',
          amount: Number(exp.amount),
          description: exp.description || 'Trip expense',
          date: new Date()
        });
        await expense.save();
      }
    }

    res.json({ message: 'Trip successfully completed', trip });
  } catch (error) {
    res.status(500).json({ message: 'Error completing trip', error: error.message });
  }
});

// Cancel a trip
router.post('/:id/cancel', authenticateToken, requireRole(['Fleet Manager', 'Driver']), async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id)
      .populate('vehicle')
      .populate('driver');

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    const previousStatus = trip.status;
    trip.status = 'Cancelled';
    trip.cancelledAt = new Date();
    await trip.save();

    // Business Rule: Cancelling a dispatched trip restores the vehicle and driver to Available.
    if (previousStatus === 'Dispatched') {
      const vehicle = trip.vehicle;
      const driver = trip.driver;

      if (vehicle.status === 'On Trip') {
        vehicle.status = 'Available';
        await vehicle.save();
      }
      if (driver.status === 'On Trip') {
        driver.status = 'Available';
        await driver.save();
      }
    }

    res.json({ message: 'Trip cancelled', trip });
  } catch (error) {
    res.status(500).json({ message: 'Error cancelling trip', error: error.message });
  }
});

export default router;
