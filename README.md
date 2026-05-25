# Lawn Care Assistant

A personalised lawn care web app based on the official **New Zealand Lawn Addicts (NZLA) 52-week application guide**. It tells you exactly what products to apply, how much to use based on your lawn size, and keeps track of your inventory.

## Features

- **Weekly schedule** — Browse all 52 weeks of the NZLA guide. The app automatically opens on the current week.
- **Lawn size calculator** — Enter your lawn size (m²) and all product quantities scale accordingly.
- **Inventory tracking** — Log what products you have in stock. Supports unit conversions (kg ↔ g, L ↔ ml).
- **Purchase recommendations** — See what you need to buy based on your inventory and upcoming applications.
- **Mark as applied** — Record completed applications; inventory adjusts automatically. Undo if you make a mistake.
- **Google login** — Sign in with your Google account via Replit Auth.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| Routing | Wouter |
| UI | shadcn/ui, Radix UI, Tailwind CSS |
| Forms | React Hook Form + Zod |
| Server state | TanStack Query v5 |
| Backend | Express.js, TypeScript |
| Database | PostgreSQL (Neon serverless) |
| ORM | Drizzle ORM |
| Auth | Replit Auth (Google SSO via OIDC) |

## Getting Started

### Prerequisites

- Node.js 20+
- A PostgreSQL database (the app is configured for [Neon](https://neon.tech))

### Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `SESSION_SECRET` | Secret for signing session cookies |
| `REPL_ID` | Replit environment ID (auto-set on Replit) |
| `REPLIT_DOMAINS` | Allowed domains for auth (auto-set on Replit) |

### Install & Run

```bash
npm install
npm run db:push   # push schema to database
npm run dev       # start dev server
```

The app runs on `http://localhost:5000` with the frontend and backend served from the same port.

### Run Tests

```bash
bash scripts/run-tests.sh        # full suite (76 tests)
npx vitest run                   # backend only (58 tests)
npx vitest run --config vitest.client.config.ts  # frontend only (18 tests)
```

## Project Structure

```
├── client/src/          # React frontend
│   ├── components/      # UI components
│   ├── pages/           # Page-level components
│   └── hooks/           # Custom hooks (useAuth, etc.)
├── server/              # Express backend
│   ├── routes.ts        # API endpoints
│   ├── storage.ts       # Database access layer
│   └── __tests__/       # Backend integration tests
├── shared/              # Shared types and constants
│   ├── schema.ts        # Drizzle schema + Zod types
│   ├── canonicalProductNames.ts  # Single source of truth for product names
│   └── products.ts      # NZLA product list
└── scripts/             # Utility scripts
```

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/schedule` | All 52 weeks |
| GET | `/api/schedule/current` | Current week |
| GET | `/api/schedule/:week` | Specific week |
| GET | `/api/inventory` | User's inventory |
| POST | `/api/inventory` | Add/update item |
| DELETE | `/api/inventory/:id` | Remove item |
| GET | `/api/applied-weeks` | Application history |
| POST | `/api/applied-weeks` | Mark week as applied |
| DELETE | `/api/applied-weeks/:id` | Undo application |
| GET | `/api/health` | Health check |
