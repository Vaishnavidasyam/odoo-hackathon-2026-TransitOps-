# 🚛 TransitOps - Smart Transport Operations Platform

### *Optimizing Logistics, Securing Compliance, and Empowering Fleets in Real Time.*

---

## 📖 Project Overview

**TransitOps** is an enterprise-grade, full-stack fleet management and transport operations platform designed to solve the chaotic, paper-heavy, and opaque nature of modern logistics. During high-intensity transport operations, dispatchers, managers, and drivers struggle with disjointed systems. 

TransitOps consolidates **real-time vehicle tracking, driver compliance, automated dispatch validation, expense logging, maintenance scheduling, and business intelligence** into a single, cohesive command center.

### 🔴 The Problem
1.  **Compliance Risks:** Unlicensed drivers or uninspected vehicles being dispatched on active routes.
2.  **Information Silos:** Expense logs, maintenance histories, and driver schedules tracked in static sheets.
3.  **Lack of Real-time Oversight:** Inability to visualize active trips, load capacities, and fleet distribution instantly.

### 🟢 The TransitOps Solution
TransitOps bridges the gap with a centralized platform that enforces strict business rules, handles dynamic data validation, and delivers a premium, interactive user experience.

---

## 🌟 Key Features & Hackathon Highlights

### 1. 📊 Command Center (Executive Dashboard)
*   **KPI Metrics at a Glance:** Live count of active trips, available vehicles, driver statuses, and aggregate expenses.
*   **Data-Driven Insights:** Visual charts showing monthly maintenance costs, trip distributions, and fuel efficiency trends.

### 2. 📍 Interactive Fleet Map (Live Tracking)
*   **Geospatial Tracking:** Visual representation of active vehicles, dispatch routes, and terminal hubs.
*   **Status Indicators:** Color-coded markers indicating whether a vehicle is `Available`, `On Trip`, or `Under Maintenance`.

### 3. 📋 Intelligent Trip Dispatch Workflow
*   **Compliance Checks:** Automatically prevents dispatch if a driver's commercial license is expired or if their status is set to `Suspended`.
*   **Inventory Enforcement:** Ensures only `Available` vehicles can be assigned to new trips.
*   **Odometer Safeguards:** Prevents trip completion if the final odometer reading is less than the vehicle's current odometer value.

### 4. 🔧 Preventive Maintenance & Scheduling
*   **Service Logs:** Track repair costs, details, and mechanic schedules.
*   **Downtime Management:** Dynamically updates vehicle status to `Under Maintenance`, removing them from the active dispatch pool.

### 5. 💵 Financial & Document Auditing
*   **Expense Tracker:** Log tolls, permits, fuel stops, and vehicle acquisitions.
*   **Document Association:** Link receipts and invoices directly to specific vehicles and trip logs for auditing.

### 6. 🔍 AI-Powered Smart Search
*   **Natural Language Queries:** Search console that allows managers to query drivers, active routes, and vehicle registrations instantly using smart search fields.

---

## 🛠️ Architecture & Technology Stack

TransitOps is built using a modern, decoupled **MERN (MongoDB, Express, React, Node.js)** architecture:

```
┌─────────────────────────────────────────────────────────┐
│                     React Frontend                      │
│        (Vite + Tailwind CSS v4 + Framer Motion)         │
└────────────────────────────┬────────────────────────────┘
                             │  HTTP / REST API (JSON)
                             ▼
┌─────────────────────────────────────────────────────────┐
│                     Node.js Backend                     │
│               (Express + JWT Auth + CORS)               │
└────────────────────────────┬────────────────────────────┘
                             │  Mongoose ODM
                             ▼
┌─────────────────────────────────────────────────────────┐
│                    MongoDB Database                     │
│           (Drivers, Vehicles, Trips, Expenses)          │
└─────────────────────────────────────────────────────────┘
```

*   **Frontend Framework:** React (v19) configured with Vite for sub-second compile times.
*   **Styling & Motion:** Tailwind CSS (v4) for unified utility styling and Framer Motion for responsive fluid micro-animations.
*   **Database Engine:** MongoDB with Mongoose ODM implementing strict schema validations and relational populations (e.g., populating `vehicle` and `driver` references inside a `Trip` document).
*   **Security:** JSON Web Tokens (JWT) for stateless sessions and Bcrypt for secure password hashing.

---

## 🚀 Setting Up the Project

### Prerequisites
Make sure you have the following installed on your machine:
*   [Node.js](https://nodejs.org/) (v18.x or v20.x recommended)
*   [MongoDB Community Server](https://www.mongodb.com/try/download/community) running locally (port `27017`) or a MongoDB Atlas Connection String.

### 1. Clone & Navigate
```bash
git clone https://github.com/Vaishnavidasyam/odoo-hackathon-2026-TransitOps-.git
cd odoo-hackathon-2026-TransitOps-
```

### 2. Configure Backend Environment
Create a `.env` file in the `/backend` directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/transitops
JWT_SECRET=transitops_super_secret_key_123!@#
```

### 3. Install All Dependencies
Install dependencies for both frontend and backend concurrently:
```bash
npm run install:all
```

### 4. Seed the Database
Populate your database with complete mock datasets (vehicles, compliance logs, users, and drivers):
```bash
npm run seed
```

### 5. Launch the Application
Run both the frontend and backend servers simultaneously:
```bash
npm run dev
```
*   **Frontend Application:** `http://localhost:5173`
*   **Backend Server API:** `http://localhost:5000`

---

## 🔑 Role-Based Access & Demo Credentials

TransitOps supports granular access control, ensuring users only see pages and actions appropriate to their professional role:

| User Role | Email | Password | Allowed Operations |
|---|---|---|---|
| **Fleet Manager** | `manager@transitops.com` | `password123` | Full access: Create/edit vehicles, hire drivers, schedule maintenance, approve expenses. |
| **Dispatcher** | `dispatcher@transitops.com` | `password123` | Manage and schedule trips, assign drivers, view active live fleet map. |
| **Driver** | `driver@transitops.com` | `password123` | View assigned trips, complete active trips, update odometer readings. |

---

## 🔮 Future Roadmap (Odoo Integration)
*   **Odoo Fleet Module Sync:** Real-time synchronizations of vehicle odometers and maintenance schedules directly into Odoo's native Fleet app.
*   **Odoo Expense API:** Automated posting of driver fuel receipts and tolls directly into the Odoo Accounting module.
*   **IoT Telematic Integration:** Fetching OBD-II diagnostic data directly from physical vehicles to predict failures before they happen.
