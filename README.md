# TST Hotels & Lodges — Full Platform

Complete hotel management platform with public booking website and admin dashboard.

## 📁 Project Structure

```
tst-hotels/
├── backend/          Node.js + Express REST API
├── website/          Next.js 14 public booking website
└── admin/            React + Vite admin dashboard
```

## 🚀 Quick Start (Manual)

```bash
# 1. Configure the backend env
cp backend/.env.example backend/.env
# then set MONGODB_URI in backend/.env to your Atlas connection string

# 2. Start the backend
cd backend
npm install
npm run db:migrate
npm run db:seed
npm run dev

# 3. Start the websites in separate terminals
cd ../website && npm install && npm run dev
cd ../admin && npm install && npm run dev
```

**URLs:**
| Service | URL |
|---------|-----|
| Hotel Website | http://localhost:3000 |
| Admin Dashboard | http://localhost:3002 |
| API | http://localhost:3001/v1 |

## 🔑 Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@tsthotels.com | TST@Admin2026 |
| Staff | staff@tsthotels.com | Staff@2026 |

> **Change these immediately in production!**

## 💻 Local Development (without Docker)

### Prerequisites
- Node.js 20+
- MongoDB Atlas or another MongoDB 7+ instance
- Redis 7+

### Backend
```bash
cd backend
npm install
cp .env.example .env   # configure your values
npm run db:migrate
npm run db:seed
npm run dev            # → http://localhost:3001
```

### Website
```bash
cd website
npm install
npm run dev            # → http://localhost:3000
```

### Admin Dashboard
```bash
cd admin
npm install
npm run dev            # → http://localhost:3002
```

## 🌐 System 1 — Public Website (http://localhost:3000)

| Page | Route | Description |
|------|-------|-------------|
| Homepage | `/` | Landing page with search, rooms, amenities |
| Room Listing | `/rooms` | Available rooms with filters |
| Booking | `/book` | Multi-step checkout with payment |

## 🛠️ System 2 — Admin Dashboard (http://localhost:3002)

| Module | Route | Description |
|--------|-------|-------------|
| Dashboard | `/` | KPIs, revenue charts, recent bookings |
| Rooms | `/rooms` | Floor grid, status management |
| Bookings | `/bookings` | Check-in/out workflow |
| Customers | `/customers` | Guest directory, profiles, VIP tiers |
| Billing | `/billing` | Invoices, payments, refunds |

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend (Website) | Next.js 14, Tailwind CSS |
| Frontend (Admin) | React 18, Vite, Recharts |
| Backend | Node.js 20, Express 4, JWT |
| Database | MongoDB 7 |
| Cache | Redis 7 |
| Payment | Stripe + M-Pesa Daraja API |
| Deployment | Manual locally, Docker on Render |

## 🔌 API Endpoints

Base URL: `http://localhost:3001/v1`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /auth/login | Public | Login |
| GET | /rooms | Public | List rooms |
| GET | /rooms/available | Public | Check availability |
| POST | /bookings | Public | Create booking |
| GET | /bookings | Staff | List bookings |
| PUT | /bookings/:id/confirm | Staff | Confirm booking |
| PUT | /bookings/:id/checkin | Staff | Check in guest |
| PUT | /bookings/:id/checkout | Staff | Check out guest |
| GET | /customers | Staff | List customers |
| POST | /invoices/generate | Staff | Generate invoice |
| POST | /payments/stripe | Public | Stripe payment |
| POST | /payments/mpesa | Public | M-Pesa STK push |
| GET | /dashboard/stats | Staff | KPI stats |

## 💳 Payment Integration

- **Stripe**: Configure `STRIPE_SECRET_KEY` in `.env` for live card payments
- **M-Pesa**: Configure Daraja API credentials for mobile money
- **Cash**: Built-in cash recording for walk-in payments

## 🔒 Security

- JWT authentication (1hr access + 7d refresh tokens)
- Role-based access (admin > manager > staff)
- bcrypt password hashing (12 rounds)
- Rate limiting on auth endpoints
- Zod schema validation on all inputs
- HTTPS enforced in production

## 🚀 Production Deployment (Render)

- Use the Dockerfiles in `backend/`, `website/`, and `admin/` for Render services.
- Point the backend service at the production `MONGODB_URI` and other secrets in Render environment variables.
- Keep local development manual with the `npm run dev` commands above.

## 📞 Support

- **Lead Dev**: dev@tsthotels.com
- **Docs**: https://docs.tsthotels.com
- **Issues**: https://github.com/tst-hotels/platform/issues
