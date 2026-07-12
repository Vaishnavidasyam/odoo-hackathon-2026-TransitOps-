import mongoose from 'mongoose';

const driverSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  licenseNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
  },
  licenseCategory: {
    type: String,
    required: true,
    trim: true,
  },
  licenseExpiryDate: {
    type: Date,
    required: true,
  },
  contactNumber: {
    type: String,
    required: true,
    trim: true,
  },
  safetyScore: {
    type: Number,
    min: [0, 'Safety score cannot be below 0'],
    max: [100, 'Safety score cannot exceed 100'],
    default: 100,
  },
  status: {
    type: String,
    required: true,
    enum: ['Available', 'On Trip', 'Off Duty', 'Suspended'],
    default: 'Available',
  },
  documents: [{
    name: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Driver = mongoose.model('Driver', driverSchema);
export default Driver;
