import express from 'express';
import Driver from '../models/Driver.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get all drivers with optional filters
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = {};

    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { licenseNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const drivers = await Driver.find(query).sort({ createdAt: -1 });
    res.json(drivers);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving drivers', error: error.message });
  }
});

// Create a driver
router.post('/', authenticateToken, requireRole(['Fleet Manager', 'Safety Officer']), async (req, res) => {
  try {
    const { name, licenseNumber, licenseCategory, licenseExpiryDate, contactNumber, safetyScore, status, documents } = req.body;

    // Check unique license number
    const exists = await Driver.findOne({ licenseNumber: licenseNumber.toUpperCase() });
    if (exists) {
      return res.status(400).json({ message: `Driver with license number ${licenseNumber} already exists` });
    }

    const driver = new Driver({
      name,
      licenseNumber: licenseNumber.toUpperCase(),
      licenseCategory,
      licenseExpiryDate,
      contactNumber,
      safetyScore: safetyScore ?? 100,
      status: status || 'Available',
      documents: documents || []
    });

    await driver.save();
    res.status(201).json(driver);
  } catch (error) {
    res.status(400).json({ message: 'Error creating driver', error: error.message });
  }
});

// Update driver
router.put('/:id', authenticateToken, requireRole(['Fleet Manager', 'Safety Officer']), async (req, res) => {
  try {
    const { licenseNumber } = req.body;

    if (licenseNumber) {
      const exists = await Driver.findOne({
        licenseNumber: licenseNumber.toUpperCase(),
        _id: { $ne: req.params.id }
      });
      if (exists) {
        return res.status(400).json({ message: `Driver with license number ${licenseNumber} already exists` });
      }
    }

    const updatedDriver = await Driver.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!updatedDriver) {
      return res.status(404).json({ message: 'Driver not found' });
    }
    res.json(updatedDriver);
  } catch (error) {
    res.status(400).json({ message: 'Error updating driver', error: error.message });
  }
});

// Delete driver
router.delete('/:id', authenticateToken, requireRole(['Fleet Manager']), async (req, res) => {
  try {
    const deleted = await Driver.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Driver not found' });
    }
    res.json({ message: 'Driver deleted successfully', driver: deleted });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting driver', error: error.message });
  }
});

// Document Upload simulation endpoint
router.post('/:id/documents', authenticateToken, requireRole(['Fleet Manager', 'Safety Officer']), async (req, res) => {
  try {
    const { name, url } = req.body;
    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }
    driver.documents.push({ name, url });
    await driver.save();
    res.status(201).json(driver);
  } catch (error) {
    res.status(400).json({ message: 'Error uploading document metadata', error: error.message });
  }
});

export default router;
