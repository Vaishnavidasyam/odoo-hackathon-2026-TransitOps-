import mongoose from 'mongoose';

const tripSchema = new mongoose.Schema({
  source: {
    type: String,
    required: true,
    trim: true,
  },
  destination: {
    type: String,
    required: true,
    trim: true,
  },
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true,
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    required: true,
  },
  cargoWeight: {
    type: Number,
    required: true,
    min: [0, 'Cargo weight must be positive'],
  },
  plannedDistance: {
    type: Number,
    required: true,
    min: [0, 'Distance must be positive'],
  },
  actualDistance: {
    type: Number,
    default: 0,
    min: [0, 'Actual distance must be positive'],
  },
  status: {
    type: String,
    required: true,
    enum: ['Draft', 'Dispatched', 'Completed', 'Cancelled'],
    default: 'Draft',
  },
  dispatchedAt: Date,
  completedAt: Date,
  cancelledAt: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Trip = mongoose.model('Trip', tripSchema);
export default Trip;
