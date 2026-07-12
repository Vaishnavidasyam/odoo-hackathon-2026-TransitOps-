import mongoose from 'mongoose';

const maintenanceSchema = new mongoose.Schema({
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  cost: {
    type: Number,
    required: true,
    min: [0, 'Cost must be positive'],
  },
  status: {
    type: String,
    required: true,
    enum: ['Active', 'Closed'],
    default: 'Active',
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  endDate: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Maintenance = mongoose.model('Maintenance', maintenanceSchema);
export default Maintenance;
