const BASE_URL = 'http://localhost:5000/api';

const getHeaders = () => {
  const token = localStorage.getItem('transitops_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};

const handleResponse = async (res) => {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Something went wrong');
  }
  return data;
};

export const api = {
  // Authentication
  login: (email, password) => 
    fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }).then(handleResponse),

  register: (userData) =>
    fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    }).then(handleResponse),

  me: () =>
    fetch(`${BASE_URL}/auth/me`, {
      headers: getHeaders(),
    }).then(handleResponse),

  // Vehicles
  getVehicles: (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return fetch(`${BASE_URL}/vehicles?${params}`, {
      headers: getHeaders(),
    }).then(handleResponse);
  },

  createVehicle: (vehicleData) =>
    fetch(`${BASE_URL}/vehicles`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(vehicleData),
    }).then(handleResponse),

  updateVehicle: (id, vehicleData) =>
    fetch(`${BASE_URL}/vehicles/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(vehicleData),
    }).then(handleResponse),

  deleteVehicle: (id) =>
    fetch(`${BASE_URL}/vehicles/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    }).then(handleResponse),

  // Drivers
  getDrivers: (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return fetch(`${BASE_URL}/drivers?${params}`, {
      headers: getHeaders(),
    }).then(handleResponse);
  },

  createDriver: (driverData) =>
    fetch(`${BASE_URL}/drivers`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(driverData),
    }).then(handleResponse),

  updateDriver: (id, driverData) =>
    fetch(`${BASE_URL}/drivers/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(driverData),
    }).then(handleResponse),

  deleteDriver: (id) =>
    fetch(`${BASE_URL}/drivers/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    }).then(handleResponse),

  uploadDriverDoc: (id, docData) =>
    fetch(`${BASE_URL}/drivers/${id}/documents`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(docData),
    }).then(handleResponse),

  // Trips
  getTrips: (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return fetch(`${BASE_URL}/trips?${params}`, {
      headers: getHeaders(),
    }).then(handleResponse);
  },

  createTrip: (tripData) =>
    fetch(`${BASE_URL}/trips`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(tripData),
    }).then(handleResponse),

  dispatchTrip: (id) =>
    fetch(`${BASE_URL}/trips/${id}/dispatch`, {
      method: 'POST',
      headers: getHeaders(),
    }).then(handleResponse),

  completeTrip: (id, completionData) =>
    fetch(`${BASE_URL}/trips/${id}/complete`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(completionData),
    }).then(handleResponse),

  cancelTrip: (id) =>
    fetch(`${BASE_URL}/trips/${id}/cancel`, {
      method: 'POST',
      headers: getHeaders(),
    }).then(handleResponse),

  // Maintenance
  getMaintenanceLogs: () =>
    fetch(`${BASE_URL}/maintenance`, {
      headers: getHeaders(),
    }).then(handleResponse),

  createMaintenance: (maintenanceData) =>
    fetch(`${BASE_URL}/maintenance`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(maintenanceData),
    }).then(handleResponse),

  closeMaintenance: (id) =>
    fetch(`${BASE_URL}/maintenance/${id}/close`, {
      method: 'POST',
      headers: getHeaders(),
    }).then(handleResponse),

  // Expenses & Fuel
  getExpenses: () =>
    fetch(`${BASE_URL}/expenses`, {
      headers: getHeaders(),
    }).then(handleResponse),

  getFuelLogs: () =>
    fetch(`${BASE_URL}/expenses/fuel`, {
      headers: getHeaders(),
    }).then(handleResponse),

  createExpense: (expenseData) =>
    fetch(`${BASE_URL}/expenses`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(expenseData),
    }).then(handleResponse),

  createFuelLog: (fuelData) =>
    fetch(`${BASE_URL}/expenses/fuel`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(fuelData),
    }).then(handleResponse),

  // Reports
  getDashboardData: (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return fetch(`${BASE_URL}/reports/dashboard?${params}`, {
      headers: getHeaders(),
    }).then(handleResponse);
  },

  getFleetReport: () =>
    fetch(`${BASE_URL}/reports/fleet-report`, {
      headers: getHeaders(),
    }).then(handleResponse),
};
