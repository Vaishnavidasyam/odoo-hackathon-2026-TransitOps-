# 🚛 TransitOps - Smart Transport Operations Platform

TransitOps is a modern, full-stack fleet management and transport operations platform designed for high-intensity logistics. Built to optimize operations, automate workflows, and provide live oversight, it serves as the ultimate command center for fleet managers, dispatchers, and drivers.

---

## 🚀 Key Features

*   **📊 Dynamic Command Dashboard:** Real-time visualization of fleet utilization, active dispatch statistics, maintenance alerts, and cost metrics.
*   **📍 Live Fleet Map:** Interactive map view for tracking active trips, driver locations, and route progressions.
*   **📋 Intelligent Trip Dispatch & Lifecycle:** Step-by-step dispatch workflow validating driver licenses, vehicle availability, and logging odometer updates on trip completion.
*   **🔧 Preventive Maintenance Scheduler:** Automated tracking of service logs, service intervals, and scheduling mechanics.
*   **💵 Fleet Expense Tracking & Documents:** Logging expenses, tolls, permit invoices, and verifying scanned document attachments.
*   **🔍 AI-Powered Smart Search:** Natural language search console to easily query drivers, vehicles, and status updates across the fleet.
*   **📈 Financial & Compliance Reports:** Dynamic generation and PDF export of fleet utility, driver performance, and financial reports.

---

## 🛠️ Technology Stack

### Frontend
*   **React (v19) & Vite:** Ultra-fast hot module reloading and build speeds.
*   **Tailwind CSS (v4) & PostCSS:** Utility-first, modern responsive design.
*   **Framer Motion:** Fluid transitions and premium animations.
*   **Lucide React:** Sleek, modern vector icon set.

### Backend
*   **Node.js & Express:** Lightweight, asynchronous REST API architecture.
*   **MongoDB & Mongoose:** Flexible document schema database mapping drivers, vehicles, trips, and expenses.
*   **JSON Web Tokens (JWT) & Bcrypt:** Secure authentication and role-based permissions (Fleet Manager, Dispatcher, Driver).

---

## 📁 Repository Structure

```
├── backend/                   # Express REST API
│   ├── middleware/            # Auth & role checking middleware
│   ├── models/                # MongoDB (Mongoose) schemas
│   ├── routes/                # Route handlers (auth, vehicles, trips, etc.)
│   ├── seed.js                # Database seeder script
│   └── server.js              # Server entry point
├── frontend/                  # React & Vite client
│   ├── public/                # Static assets
│   ├── src/                   # React source files
│   │   ├── components/        # Reusable UI widgets
│   │   ├── pages/             # Layouts (Dashboard, Maps, Trips, etc.)
│   │   └── App.jsx            # Main app router and shell
│   ├── tailwind.config.js     # Tailwind setup
│   └── vite.config.js         # Vite bundler config
├── sample_documents/          # PDFs of receipts & compliance files
├── start.js                   # Root orchestration launcher
├── package.json               # Root scripts
└── README.md                  # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites
*   [Node.js](https://nodejs.org/) (v18 or higher)
*   [MongoDB](https://www.mongodb.com/) (running locally or a MongoDB Atlas URI)

### 1. Clone the Repository
```bash
git clone https://github.com/Vaishnavidasyam/odoo-hackathon-2026-TransitOps-.git
cd odoo-hackathon-2026-TransitOps-
```

### 2. Configure Environment Variables
Create a `.env` file inside the `backend` folder:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/transitops
JWT_SECRET=transitops_super_secret_key_123!@#
```

### 3. Install All Dependencies
Install both backend and frontend dependencies concurrently using the root helper script:
```bash
npm run install:all
```

### 4. Seed the Database
Populate your database with mock vehicles, drivers, expenses, and system users:
```bash
npm run seed
```

### 5. Launch the Platform
Start the frontend dev server and backend Express server concurrently:
```bash
npm run dev
```
*   **Frontend Dev Server:** Running at `http://localhost:5173`
*   **Backend REST API:** Running at `http://localhost:5000`

---

## 🔑 Demo Credentials
To explore the role-based functionality, you can log in using the seeded accounts:

| Role | Email | Password |
|---|---|---|
| **Fleet Manager** | `manager@transitops.com` | `password123` |
| **Dispatcher** | `dispatcher@transitops.com` | `password123` |
| **Driver** | `driver@transitops.com` | `password123` |
