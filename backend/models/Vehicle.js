import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema({
  registrationNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
  },
  nameModel: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['Van', 'Truck', 'Sedan', 'Reefer', 'Flatbed'],
  },
  maxLoadCapacity: {
    type: Number,
    required: true,
    min: [0, 'Capacity must be positive'],
  },
  odometer: {
    type: Number,
    required: true,
    min: [0, 'Odometer must be positive'],
    default: 0,
  },
  acquisitionCost: {
    type: Number,
    required: true,
    min: [0, 'Acquisition cost must be positive'],
  },
  status: {
    type: String,
    required: true,
    enum: ['Available', 'On Trip', 'In Shop', 'Retired'],
    default: 'Available',
  },
  region: {
    type: String,
    default: 'North',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Vehicle = mongoose.model('Vehicle', vehicleSchema);
export default Vehicle;
