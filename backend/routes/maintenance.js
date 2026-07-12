import express from 'express';
import Maintenance from '../models/Maintenance.js';
import Vehicle from '../models/Vehicle.js';
import Expense from '../models/Expense.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get all maintenance records
router.get('/', authenticateToken, async (req, res) => {
  try {
    const logs = await Maintenance.find().populate('vehicle').sort({ createdAt: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving maintenance logs', error: error.message });
  }
});

// Create active maintenance log
router.post('/', authenticateToken, requireRole(['Fleet Manager']), async (req, res) => {
  try {
    const { vehicleId, description, cost, startDate } = req.body;

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    if (vehicle.status === 'On Trip') {
      return res.status(400).json({ message: 'Cannot place vehicle in maintenance while it is on a trip.' });
    }

    const log = new Maintenance({
      vehicle: vehicleId,
      description,
      cost,
      status: 'Active',
      startDate: startDate || new Date()
    });

    await log.save();

    // Business Rule: Creating an active maintenance record automatically changes vehicle status to In Shop
    vehicle.status = 'In Shop';
    await vehicle.save();

    // Log the maintenance cost under Expenses as well
    const expense = new Expense({
      vehicle: vehicleId,
      type: 'Maintenance',
      amount: cost,
      description: `Maintenance: ${description}`,
      date: startDate || new Date()
    });
    await expense.save();

    res.status(201).json(log);
  } catch (error) {
    res.status(400).json({ message: 'Error creating maintenance log', error: error.message });
  }
});

// Close maintenance log
router.post('/:id/close', authenticateToken, requireRole(['Fleet Manager']), async (req, res) => {
  try {
    const log = await Maintenance.findById(req.params.id);
    if (!log) {
      return res.status(404).json({ message: 'Maintenance record not found' });
    }

    if (log.status === 'Closed') {
      return res.status(400).json({ message: 'Maintenance record is already closed.' });
    }

    log.status = 'Closed';
    log.endDate = new Date();
    await log.save();

    // Restore vehicle to Available (unless retired)
    const vehicle = await Vehicle.findById(log.vehicle);
    if (vehicle) {
      // Business Rule: Closing maintenance restores the vehicle to Available (unless retired).
      if (vehicle.status !== 'Retired') {
        vehicle.status = 'Available';
        await vehicle.save();
      }
    }

    res.json({ message: 'Maintenance record closed successfully', log });
  } catch (error) {
    res.status(500).json({ message: 'Error closing maintenance log', error: error.message });
  }
});

export default router;
