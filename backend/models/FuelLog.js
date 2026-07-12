import mongoose from 'mongoose';

const fuelLogSchema = new mongoose.Schema({
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true,
  },
  trip: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
  },
  liters: {
    type: Number,
    required: true,
    min: [0, 'Liters must be positive'],
  },
  cost: {
    type: Number,
    required: true,
    min: [0, 'Cost must be positive'],
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const FuelLog = mongoose.model('FuelLog', fuelLogSchema);
export default FuelLog;
