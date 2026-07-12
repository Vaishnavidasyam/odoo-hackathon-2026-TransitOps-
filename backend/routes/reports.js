import express from 'express';
import Vehicle from '../models/Vehicle.js';
import Driver from '../models/Driver.js';
import Trip from '../models/Trip.js';
import Maintenance from '../models/Maintenance.js';
import FuelLog from '../models/FuelLog.js';
import Expense from '../models/Expense.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get Dashboard KPIs and statistics
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const { type, status, region } = req.query;

    // Filter vehicles
    let vehicleFilter = {};
    if (type) vehicleFilter.type = type;
    if (status) vehicleFilter.status = status;
    if (region) vehicleFilter.region = region;

    const vehicles = await Vehicle.find(vehicleFilter);
    const drivers = await Driver.find();
    const trips = await Trip.find();

    // Counts
    const totalVehicles = vehicles.filter(v => v.status !== 'Retired').length;
    const activeVehicles = vehicles.filter(v => v.status === 'On Trip').length;
    const availableVehicles = vehicles.filter(v => v.status === 'Available').length;
    const maintenanceVehicles = vehicles.filter(v => v.status === 'In Shop').length;

    const activeTrips = trips.filter(t => t.status === 'Dispatched').length;
    const pendingTrips = trips.filter(t => t.status === 'Draft').length;
    const completedTripsCount = trips.filter(t => t.status === 'Completed').length;

    const driversOnDuty = drivers.filter(d => d.status === 'Available' || d.status === 'On Trip').length;
    const driversOffDuty = drivers.filter(d => d.status === 'Off Duty').length;
    const driversSuspended = drivers.filter(d => d.status === 'Suspended').length;

    const fleetUtilization = totalVehicles > 0 ? Math.round((activeVehicles / totalVehicles) * 100) : 0;

    // Calculate aggregated fuel & operational expenses
    const fuelLogs = await FuelLog.find();
    const expenses = await Expense.find();

    const totalFuelCost = fuelLogs.reduce((acc, log) => acc + log.cost, 0);
    const totalMaintenanceCost = expenses.filter(e => e.type === 'Maintenance').reduce((acc, exp) => acc + exp.amount, 0);
    const totalTollsCost = expenses.filter(e => e.type === 'Tolls').reduce((acc, exp) => acc + exp.amount, 0);

    const totalOperationalCost = totalFuelCost + totalMaintenanceCost + totalTollsCost;

    res.json({
      kpis: {
        activeVehicles,
        availableVehicles,
        maintenanceVehicles,
        activeTrips,
        pendingTrips,
        driversOnDuty,
        fleetUtilization
      },
      stats: {
        vehicles: {
          total: vehicles.length,
          available: availableVehicles,
          onTrip: activeVehicles,
          inShop: maintenanceVehicles,
          retired: vehicles.filter(v => v.status === 'Retired').length
        },
        drivers: {
          total: drivers.length,
          available: drivers.filter(d => d.status === 'Available').length,
          onTrip: drivers.filter(d => d.status === 'On Trip').length,
          offDuty: driversOffDuty,
          suspended: driversSuspended
        },
        trips: {
          total: trips.length,
          draft: pendingTrips,
          dispatched: activeTrips,
          completed: completedTripsCount,
          cancelled: trips.filter(t => t.status === 'Cancelled').length
        },
        financials: {
          totalFuelCost,
          totalMaintenanceCost,
          totalTollsCost,
          totalOperationalCost
        }
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error compiling dashboard statistics', error: error.message });
  }
});

// Get Fleet Reports (Efficiency, ROI, Costs per vehicle)
router.get('/fleet-report', authenticateToken, async (req, res) => {
  try {
    const vehicles = await Vehicle.find();
    const fuelLogs = await FuelLog.find();
    const expenses = await Expense.find();
    const trips = await Trip.find({ status: 'Completed' });

    const report = vehicles.map(vehicle => {
      // Filter logs for this vehicle
      const vFuel = fuelLogs.filter(f => f.vehicle.toString() === vehicle._id.toString());
      const vExpenses = expenses.filter(e => e.vehicle.toString() === vehicle._id.toString());
      const vTrips = trips.filter(t => t.vehicle.toString() === vehicle._id.toString());

      const fuelLiters = vFuel.reduce((acc, f) => acc + f.liters, 0);
      const fuelCost = vFuel.reduce((acc, f) => acc + f.cost, 0);
      const maintenanceCost = vExpenses.filter(e => e.type === 'Maintenance').reduce((acc, e) => acc + e.amount, 0);
      const otherCosts = vExpenses.filter(e => e.type !== 'Maintenance').reduce((acc, e) => acc + e.amount, 0);

      const totalOperationalCost = fuelCost + maintenanceCost + otherCosts;
      const totalDistance = vTrips.reduce((acc, t) => acc + (t.actualDistance || t.plannedDistance), 0);

      // Fuel Efficiency: Distance / Fuel
      const fuelEfficiency = fuelLiters > 0 ? Number((totalDistance / fuelLiters).toFixed(2)) : 0;

      // Revenue: Assume flat logistics rate of $2.5 per km + $100 base booking fee per completed trip
      const revenue = vTrips.reduce((acc, t) => acc + ((t.actualDistance || t.plannedDistance) * 2.5 + 100), 0);

      // Vehicle ROI: [Revenue - (Maintenance + Fuel)] / Acquisition Cost
      const roiNumerator = revenue - (maintenanceCost + fuelCost);
      const vehicleROI = vehicle.acquisitionCost > 0 
        ? Number(((roiNumerator / vehicle.acquisitionCost) * 100).toFixed(2)) 
        : 0;

      return {
        id: vehicle._id,
        registrationNumber: vehicle.registrationNumber,
        nameModel: vehicle.nameModel,
        type: vehicle.type,
        odometer: vehicle.odometer,
        acquisitionCost: vehicle.acquisitionCost,
        status: vehicle.status,
        fuelLiters,
        fuelCost,
        maintenanceCost,
        totalOperationalCost,
        totalDistance,
        fuelEfficiency,
        revenue,
        vehicleROI
      };
    });

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: 'Error generating fleet report', error: error.message });
  }
});

export default router;
