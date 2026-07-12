import express from 'express';
import Vehicle from '../models/Vehicle.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get all vehicles with optional filters
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, type, region, search } = req.query;
    let query = {};

    if (status) query.status = status;
    if (type) query.type = type;
    if (region) query.region = region;
    if (search) {
      query.$or = [
        { registrationNumber: { $regex: search, $options: 'i' } },
        { nameModel: { $regex: search, $options: 'i' } }
      ];
    }

    const vehicles = await Vehicle.find(query).sort({ createdAt: -1 });
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving vehicles', error: error.message });
  }
});

// Create a vehicle
router.post('/', authenticateToken, requireRole(['Fleet Manager']), async (req, res) => {
  try {
    const { registrationNumber, nameModel, type, maxLoadCapacity, odometer, acquisitionCost, status, region } = req.body;

    // Check uniqueness
    const exists = await Vehicle.findOne({ registrationNumber: registrationNumber.toUpperCase() });
    if (exists) {
      return res.status(400).json({ message: `Vehicle with registration number ${registrationNumber} already exists` });
    }

    const vehicle = new Vehicle({
      registrationNumber,
      nameModel,
      type,
      maxLoadCapacity,
      odometer,
      acquisitionCost,
      status: status || 'Available',
      region: region || 'North'
    });

    await vehicle.save();
    res.status(201).json(vehicle);
  } catch (error) {
    res.status(400).json({ message: 'Error creating vehicle', error: error.message });
  }
});

// Update vehicle
router.put('/:id', authenticateToken, requireRole(['Fleet Manager']), async (req, res) => {
  try {
    const { registrationNumber } = req.body;

    // Check unique on registrationNumber if modified
    if (registrationNumber) {
      const exists = await Vehicle.findOne({
        registrationNumber: registrationNumber.toUpperCase(),
        _id: { $ne: req.params.id }
      });
      if (exists) {
        return res.status(400).json({ message: `Vehicle with registration number ${registrationNumber} already exists` });
      }
    }

    const updatedVehicle = await Vehicle.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!updatedVehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    res.json(updatedVehicle);
  } catch (error) {
    res.status(400).json({ message: 'Error updating vehicle', error: error.message });
  }
});

// Delete vehicle
router.delete('/:id', authenticateToken, requireRole(['Fleet Manager']), async (req, res) => {
  try {
    const deleted = await Vehicle.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    res.json({ message: 'Vehicle deleted successfully', vehicle: deleted });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting vehicle', error: error.message });
  }
});

export default router;
