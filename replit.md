# Lawn Care Web Application

## Overview

This is a comprehensive lawn care web application providing personalized NZLA (New Zealand Lawn Association) product recommendations based on the current date and lawn size. It acts as a professional assistant, guiding users on the right products, quantities, and application timings for optimal lawn maintenance. The application aims to offer quick, accurate product recommendations to lawn care enthusiasts.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript and Vite.
- **Routing**: Wouter for lightweight client-side routing.
- **State Management**: TanStack Query for server state management with a custom `queryFn` pattern for user-scoped data.
- **UI Components**: shadcn/ui built on Radix UI primitives.
- **Styling**: Tailwind CSS with a utility-first approach.
- **Form Handling**: React Hook Form with Zod validation.
- **Authentication**: Custom `useAuth` hook for managing authentication state.

### Backend
- **Framework**: Express.js with TypeScript.
- **Database ORM**: Drizzle ORM for type-safe operations.
- **API Design**: RESTful API with structured error handling.
- **Session Management**: PostgreSQL-based session storage using `connect-pg-simple`.

### Data Storage
- **Primary Database**: PostgreSQL (Neon serverless deployment).
- **Schema Management**: Drizzle Kit for migrations.
- **Database Tables**: Users, Inventory, Weekly Schedule (NZLA application guide), and Applied Weeks.
- **Product Name Standardization**: Canonical product naming system ensures consistency across the application, utilizing `shared/canonicalProductNames.ts` for a single source of truth.

### Authentication and Authorization
- **Method**: Google SSO via Replit Auth (OIDC).
- **Access Model**: Tiered access with public features and authenticated-only protected features.
- **Session Storage**: Server-side sessions in PostgreSQL.
- **Security**: User-scoped data isolation and React Query cache keys include user ID to prevent cross-user data leakage.

### Design System
- **Theme**: Nature-focused green theme with light/dark mode support.
- **Typography**: Inter font family.
- **Responsiveness**: Mobile-first design.

### Core Application Features
- **Weekly Application Scheduler**: Database-driven, pre-seeded with 52 weeks of NZLA data, automatically determines current week and allows viewing other weeks.
- **Lawn Size Calculator**: Scales product quantities based on user input, persistent for authenticated users.
- **Product Recommendation Engine**: Provides database-backed NZLA product suggestions.
- **Inventory Management (Protected)**: Tracks user product stocks with unit conversion (kg↔g, L↔ml).
- **Purchase Recommendations (Protected)**: Intelligent suggestions based on inventory and upcoming applications.
- **Mark as Applied (Protected)**: Tracks completed applications, adjusts inventory, and supports undo functionality.

### User Experience
- **Feedback**: Loading states, toast notifications, visual feedback for save operations.
- **Accessibility**: Dark mode, mobile optimization, smooth animations.
- **Error Handling**: Comprehensive user-facing error messages.

### Observability
- **Structured Logging**: JSON-formatted logs for API requests.
- **Health Check Endpoint**: `/api/health` reports status, uptime, and database connection.
- **Metrics Endpoint**: `/api/metrics` (authenticated) provides user, inventory, and application statistics.
- **Persistent Metrics Tracking**: `system_metrics` table for operational counters.
- **Retry Logic**: React Query automatic retry with exponential backoff for server errors.

### Testing

**Test Suite**: Comprehensive testing with Vitest (74 tests total)
- **Backend Tests** (`server/__tests__/`): Integration tests using Supertest - 56 tests
- **Frontend Tests** (`client/src/__tests__/`): Component tests using React Testing Library - 18 tests

**Run Commands**:
- Backend only: `npx vitest run`
- Frontend only: `npx vitest run --config vitest.client.config.ts`
- Full suite: `bash scripts/run-tests.sh`
- Pre-deploy validation: `bash scripts/pre-deploy.sh`

**Configuration**:
- `vitest.config.ts` - Backend tests (Node environment)
- `vitest.client.config.ts` - Frontend tests (JSDOM environment)

**CI Integration Scripts** (`scripts/`):
- `run-tests.sh` - Runs both backend and frontend tests sequentially
- `pre-deploy.sh` - Full validation: TypeScript check, test suite, health check, schedule verification

**Test Coverage**:
- Inventory CRUD, upsert behavior, unit handling
- Applied weeks mark/undo, Store Zero logic, duplicate rejection (409)
- Schedule API, auth guards, health/metrics endpoints
- LawnSizeCalculator form handling, Header auth states

## Coding Conventions

### API Design
- **Error Responses**: Use `{ error: "message", details?: any }` format for all errors
- **HTTP Status Codes**: 400 (validation), 404 (not found), 409 (conflict), 500 (server error), 503 (service unavailable)
- **Naming**: All API payloads use camelCase

### Data Types
- **Decimal Precision**: Store quantities as strings in DB, convert with `parseFloat()` for calculations
- **Canonical Products**: Use `shared/canonicalProductNames.ts` as the single source of truth for product names

### Frontend Patterns
- **Custom queryFn**: User-scoped queries must use custom queryFn constructing URLs from first array element only
- **Cache Keys**: Include user ID in query keys to prevent cross-user data leakage

### Testing
- **Backend**: Integration tests with Supertest, mock auth via header bypass
- **Frontend**: Component tests with React Testing Library
- **E2E**: Playwright for user flow testing

### File Organization
- `shared/`: Types, schemas, constants shared between frontend and backend
- `server/`: Express routes, storage layer, database access
- `client/src/`: React components, pages, hooks
- `scripts/`: Utility scripts for migrations and testing

## External Dependencies

- **Neon Database**: Serverless PostgreSQL hosting.
- **Google Fonts**: Inter font family.
- **Radix UI**: Headless component primitives.
- **Lucide React**: Icon library.
- **Date-fns**: Date manipulation utilities.
- **TanStack Query**: Server state synchronization and caching.