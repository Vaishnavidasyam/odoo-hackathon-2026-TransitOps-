import express from 'express';
import Expense from '../models/Expense.js';
import FuelLog from '../models/FuelLog.js';
import Vehicle from '../models/Vehicle.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get all expenses
router.get('/', authenticateToken, async (req, res) => {
  try {
    const expenses = await Expense.find().populate('vehicle').sort({ date: -1 });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving expenses', error: error.message });
  }
});

// Get all fuel logs
router.get('/fuel', authenticateToken, async (req, res) => {
  try {
    const fuel = await FuelLog.find().populate('vehicle').sort({ date: -1 });
    res.json(fuel);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving fuel logs', error: error.message });
  }
});

// Post a new fuel log
router.post('/fuel', authenticateToken, requireRole(['Fleet Manager', 'Financial Analyst', 'Driver']), async (req, res) => {
  try {
    const { vehicleId, tripId, liters, cost, date } = req.body;

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    const log = new FuelLog({
      vehicle: vehicleId,
      trip: tripId || undefined,
      liters: Number(liters),
      cost: Number(cost),
      date: date || new Date()
    });

    await log.save();

    // Create an Expense record for the fuel transaction so it aggregates in general ledger
    const expense = new Expense({
      vehicle: vehicleId,
      trip: tripId || undefined,
      type: 'Other',
      amount: Number(cost),
      description: `Fuel Logging: ${liters}L`,
      date: date || new Date()
    });
    await expense.save();

    res.status(201).json(log);
  } catch (error) {
    res.status(400).json({ message: 'Error logging fuel', error: error.message });
  }
});

// Post a new general expense
router.post('/', authenticateToken, requireRole(['Fleet Manager', 'Financial Analyst']), async (req, res) => {
  try {
    const { vehicleId, tripId, type, amount, description, date } = req.body;

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    const expense = new Expense({
      vehicle: vehicleId,
      trip: tripId || undefined,
      type,
      amount: Number(amount),
      description,
      date: date || new Date()
    });

    await expense.save();
    res.status(201).json(expense);
  } catch (error) {
    res.status(400).json({ message: 'Error creating expense', error: error.message });
  }
});

export default router;
