# Smart Food Production Optimizer

> A waste-aware, adaptive production decision-support system for food manufacturers.

Food manufacturers must constantly balance dynamic customer demand, finished-goods shelf life, raw-material availability and batch expiry, production line capacity, and strict delivery deadlines. Manual spreadsheet planning leads to overproduction, stock shortages, expired raw ingredients, and delayed order fulfillment.

The **Smart Food Production Optimizer** analyzes demand history, live inventory, confirmed orders, raw-material batches with expiry dates (FEFO), and plant capacity to recommend **WHAT to produce, HOW MUCH, and WHEN**. Every recommendation is fully explainable, with automatic re-planning when conditions shift.

---

## Tech Stack

- **Frontend**: React 18, Vite, React Router 6, TanStack Query, Tailwind CSS, Framer Motion, Recharts, Lucide Icons, react-hot-toast, cmdk, date-fns.
- **Backend**: Node.js, Express (ES Modules), Mongoose, JWT + bcrypt, Zod validation, Helmet, CORS, express-rate-limit, node-cron, Socket.io.
- **AI Layer**: Anthropic Claude SDK (`@anthropic-ai/sdk`) for contextual plan explanations and interactive tool-assisted planning assistant.
- **Testing**: Jest for pure deterministic planning engine algorithms.

---

## System Architecture

```
smart-food-production-optimizer/
├── package.json               # Root scripts (concurrently dev, server, client, seed, test)
├── .env.example               # Root environment template
├── server/
│   ├── src/
│   │   ├── config/            # Database connection, env validation, system constants
│   │   ├── models/            # Mongoose schemas (Products, Batches, Orders, Plans, etc.)
│   │   ├── routes/            # REST API route declarations
│   │   ├── controllers/       # HTTP request/response handlers
│   │   ├── services/          # Business logic & planning engine pure functions
│   │   ├── middleware/        # JWT auth, role authorization, validation, error handler
│   │   ├── seed/              # Realistic Indian food manufacturing demo seed
│   │   ├── app.js             # Express app setup
│   │   └── server.js          # HTTP + Socket.io listener
│   └── tests/                 # Planning engine unit tests
└── client/
    └── src/
        ├── components/        # Reusable UI, layout (Sidebar, TopBar), charts
        ├── pages/             # Dashboard, Planning, Demand, Inventory, Production, Orders, Simulator, Analytics
        ├── context/           # AuthContext, ThemeContext, SocketContext
        ├── hooks/             # Data and state hooks
        ├── services/          # Axios API modules
        └── styles/            # Design tokens & Tailwind CSS
```

---

## Quick Start

### 1. Prerequisites
- **Node.js**: v18+ (tested on v24)
- **MongoDB**: v6.0+ (running on `mongodb://127.0.0.1:27017/food_optimizer`)

### 2. Installation
Install dependencies for root, server, and client:
```bash
npm run install:all
```

### 3. Environment Variables
Copy `.env.example` in `server/`:
```bash
cp server/.env.example server/.env
```
Ensure `MONGO_URI` points to your MongoDB instance, and configure `ANTHROPIC_API_KEY` if using Claude AI features.

### 4. Seed Demo Data
Populate realistic Indian food manufacturing data (products, recipes, raw material batches with expiry dates, sales history, orders, festivals):
```bash
npm run seed
```

### 5. Run the Application
Run both server (port 5000) and client (port 5173) concurrently:
```bash
npm run dev
```

- Web Client: [http://localhost:5173](http://localhost:5173)
- REST API: [http://localhost:5000/api](http://localhost:5000/api)

---

## Demo Credentials

| Role | Email | Password | Access Scope |
|------|-------|----------|--------------|
| **Admin** | `admin@smartfood.com` | `Admin@123` | Full access to all modules, settings, users, and audit logs |
| **Manager** | `manager@smartfood.com` | `Manager@123` | Planning, demand, inventory, simulator, analytics |
| **Production Staff** | `staff@smartfood.com` | `Staff@123` | Production schedule, task execution, delay reporting |

---

## Core Planning Engine Modules

- **FEFO Allocation**: First-Expired, First-Out batch consumption avoiding raw material spoilage.
- **Dual Forecasting**: Evaluates Exponential Smoothing (SES) vs. 7-Day Moving Average, automatically selecting the lower MAPE model per product with festival multipliers.
- **Shelf-Life Aware Net Requirements**: Prevents overproduction beyond finished-goods shelf life.
- **Capacity Scheduling**: Splits multi-day batches across production lines prioritized by delivery deadline and order priority.
- **Risk Scoring**: Composite risk metric evaluating shortage (40%), delivery (30%), capacity (20%), and expiry (10%).
- **What-If Sandbox**: Real-time simulation of supply delays, demand surges, and capacity shifts without touching live production plans.
