# Lawn Care Web Application

## Overview

This is a comprehensive lawn care web application designed to provide personalized NZLA (New Zealand Lawn Association) product recommendations based on current date and lawn size. The application serves as a professional lawn care assistant that helps users determine the right products, quantities, and application timing for optimal lawn maintenance throughout the year.

The system combines a React-based frontend with an Express backend, featuring a clean, utility-focused design system built with Tailwind CSS and shadcn/ui components. The application emphasizes functionality and usability for lawn care enthusiasts who need quick, accurate product recommendations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript, using Vite as the build tool
- **Routing**: Wouter for lightweight client-side routing (single-page app with conditional rendering)
- **State Management**: TanStack Query (React Query) for server state management
  - **Custom QueryFn Pattern**: User-scoped queries require custom queryFn to prevent URL construction issues
    - React Query's default queryFn joins ALL array elements with "/" to build URLs
    - Cache keys like `["/api/inventory", user?.id]` would incorrectly construct `/api/inventory/123`
    - Solution: Custom queryFn constructs correct URL while maintaining user ID in cache key for scoping
    - Applied in: ProductCard (inventory + applied-weeks), InventoryManager (inventory), PurchaseRecommendations (inventory)
    - Pattern: `queryFn: async () => { const res = await fetch("/api/endpoint", { credentials: "include" }); ... }`
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and utility-first approach
- **Form Handling**: React Hook Form with Zod validation
- **Authentication**: Custom useAuth hook for managing authentication state and conditional feature unlocking

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM for type-safe database operations
- **API Design**: RESTful API with structured error handling and logging middleware
- **Session Management**: PostgreSQL-based session storage using connect-pg-simple

### Data Storage Solutions
- **Primary Database**: PostgreSQL configured for Neon serverless deployment
- **Schema Management**: Drizzle Kit for migrations and schema evolution
- **Database Tables**:
  - Users table for authentication and user management
  - Inventory table for tracking product stocks and quantities with unique constraint per user per product
  - Weekly Schedule table containing all 52 weeks of NZLA application guide data with per-product types
  - Applied Weeks table for tracking completed applications with inventory adjustments (supports undo)
  - Shared schema with Zod validation integration
- **Product Name Standardization**: Canonical product naming system ensures consistency
  - Single source of truth: `shared/canonicalProductNames.ts` defines all 17 official NZLA products
  - Normalization function handles common variations (case-insensitive, "NZLA" prefix handling, "Plus" vs "+")
  - Database migration script (`server/migrateProductNames.ts`) safely updates inventory to canonical names
  - Hybrid storage: complex queryable data in database, simple reference data (package sizes) in files
  - All product names consistent across inventory, weekly applications, and purchase recommendations

### Authentication and Authorization
- **Authentication Method**: Google SSO via Replit Auth (OIDC)
- **Tiered Access Model**: Public features accessible without login; protected features unlock when authenticated
- **Session Storage**: Server-side sessions stored in PostgreSQL
- **Feature Protection**: Conditional rendering shows locked previews for unauthenticated users, unlocks full features after sign-in
- **Data Isolation**: User-scoped inventory and recommendation data
- **Security**: Query guards prevent protected API calls from executing for unauthenticated users
- **Cache Security**: All React Query cache keys include user ID to prevent cross-user data leakage
  - Inventory queries: `["/api/inventory", user?.id]`
  - Applied week queries: `["/api/applied-weeks", weekNumber, user?.id]`

### Design System and Theming
- **Color Palette**: Nature-focused green theme with light/dark mode support
- **Typography**: Inter font family with consistent weight hierarchy
- **Component Variants**: Comprehensive button, card, and form component variations
- **Responsive Design**: Mobile-first approach with touch-friendly interfaces

### Application Structure
- **Single-Page Application (/)**: All features on one page, features unlock when authenticated
  - **Always Visible**:
    - Lawn Size Calculator
    - Current Week Display showing this week's application
    - Week Selector dropdown to view any of the 52 weeks
    - Product Application recommendations with quantity calculations
  - **Unlocked When Authenticated**:
    - Lawn Size persistence (saves to database with real-time indicators)
    - Product Inventory Management with unit conversions (kg↔g, L↔ml)
    - Purchase Recommendations based on inventory and upcoming applications
  - **Before Sign-In**:
    - Lawn Size Calculator uses local state only (not saved)
    - Locked preview cards for Inventory & Purchase Recommendations with sign-in CTAs
  
### Core Application Features
- **Weekly Application Scheduler**: Database-driven scheduler containing all 52 weeks from NZLA application guide
  - Automatically determines current week (1-52) based on ISO week number
  - Fetches weekly product applications from PostgreSQL database
  - Supports per-product types (liquid/granular/insecticide) for accurate mixed-type weeks
  - Week Selector: Dropdown allowing users to view any week (1-52) with current week highlighted
  - Auto-seeding: Schedule data automatically seeded in background after server starts (optimized for deployment health checks)
  - Idempotent seeding with upsert operations ensures safe restarts without data duplication
  - Comprehensive error handling with loading states and defensive type guards
- **Lawn Size Calculator**: Precise quantity scaling based on user's lawn area
  - Unauthenticated: Local state only (not saved)
  - Authenticated: Persistent storage with real-time save indicators and database synchronization
- **Product Recommendation Engine**: Database-backed NZLA product suggestions with detailed application instructions
  - All 52 weeks pre-seeded from official NZLA application guide
  - Each product includes type field for accurate display and calculations
  - Upsert-based seeding allows schedule updates without data loss
- **Inventory Management** (Protected): User tracking of product stocks and quantities with unit conversion support
  - One inventory entry per product per user (database constraint)
  - Unit conversions between kg↔g and L↔ml
- **Purchase Recommendations** (Protected): Intelligent suggestions based on upcoming applications and current inventory
- **Application Timeline**: Visual weekly schedule with progress indicators and current week highlighting
- **Mark as Applied** (Protected): Track completed lawn care applications with automatic inventory adjustment
  - Allows users to mark the current week's applications as completed
  - Automatically deducts product quantities from inventory based on lawn size
  - Shows preview dialog with before/after inventory changes
  - Handles insufficient inventory with explicit user confirmation (sets inventory to 0)
  - Supports undo functionality to restore inventory with correct unit conversions
  - Stores application history with adjustments in database (applied_weeks table)
  - User-scoped cache keys prevent cross-user data leakage
  - Product name normalization ensures accurate inventory matching

### User Experience Enhancements
- **Loading States**: Skeleton screens provide visual feedback during data fetching
- **Toast Notifications**: Success and error messages for user actions (save confirmations, error alerts)
- **Visual Feedback**: Loading spinners and success indicators (checkmarks) for save operations
- **Dark Mode**: Smooth theme toggle with persistent user preference
- **Mobile Optimization**: Touch-friendly interface with minimum 44px touch targets for all interactive elements
- **Smooth Animations**: Subtle transitions on buttons, cards, and theme switching for polished user experience
- **Error Handling**: Comprehensive error messages displayed to users when operations fail

### External Dependencies
- **Neon Database**: Serverless PostgreSQL hosting for production data storage
- **Google Fonts**: Inter font family loading via CDN
- **Radix UI**: Headless component primitives for accessibility and behavior
- **Lucide React**: Icon library for consistent iconography
- **Date-fns**: Date manipulation and formatting utilities
- **TanStack Query**: Server state synchronization and caching

### Deployment Configuration
- **Build Process**: Vite builds frontend, esbuild bundles backend into `dist/index.js`
- **Production Runtime**: Node.js runs compiled JavaScript in production environment
- **Initialization**: Background seeding runs asynchronously after server starts to avoid blocking health checks
- **Health Monitoring**: `/api/health` endpoint reports initialization status and database connection
- **Critical Fix**: Seed module includes environment check (`NODE_ENV !== 'production'`) to prevent standalone execution code from calling `process.exit()` in bundled production builds

### Observability and Monitoring (Phase 1)
- **Structured Logging**: JSON-formatted logs for all API requests
  - Captures: timestamp, method, path, status code, duration, userId
  - Dual format: JSON for parsing + human-readable for development
  - Example: `{"timestamp":"2025-11-09T00:25:48.639Z","method":"GET","path":"/api/auth/user","status":401,"duration":2,"userId":null}`
- **Health Check Endpoint**: Enhanced `/api/health` endpoint (public)
  - Reports: status, uptime, initialization state, database connection
  - Memory usage: RSS, heap total, heap used, external (in MB)
  - Schedule loading status with week count
- **Metrics Endpoint**: `/api/metrics` endpoint (authenticated)
  - Total users count
  - Total inventory items across all users
  - Total applications marked (completed weeks)
  - Total undo operations (tracked in system_metrics table)
  - Average lawn size across users
  - All metrics use efficient COUNT queries for scalability
- **Persistent Metrics Tracking**: system_metrics table
  - Key-value store for operational counters
  - Atomic increment operations for concurrent safety
  - Currently tracks: total_undo_operations
  - Designed for future Phase 2/3 metric expansion
- **Retry Logic**: React Query automatic retry with exponential backoff
  - 4 retry attempts (1s, 2s, 4s, 8s) = ~15 second window
  - Smart retry: only retries server errors (503), skips client errors (401, 404)
  - Self-healing: automatically refetches on window focus for error states
  - Manual retry button for user-initiated recovery

### Testing Infrastructure

**Test Suite**: Backend integration tests using Vitest + Supertest
- **Location**: `server/__tests__/`
- **Configuration**: `vitest.config.ts`
- **Run Command**: `npx vitest run` (all tests) or `npx vitest` (watch mode)

**Test Coverage** (56 tests total):
- **Inventory API** (`inventory.test.ts`): CRUD operations, upsert behavior, unit handling, auth guards
- **Applied Weeks API** (`applied-weeks.test.ts`): Mark/undo applications, Store Zero logic, unit conversions
- **Schedule API** (`schedule.test.ts`): 52-week schedule retrieval, public access verification
- **Auth Guards**: Validates protected routes (401 for unauthenticated), public routes accessibility
- **Health/Metrics**: Endpoint response structure, memory reporting, metric values

**Test Architecture**:
- **Mock Auth**: Header-based (`x-test-user-id`) authentication bypass for testing
- **Test Helpers** (`helpers.ts`): User creation/cleanup, inventory setup, auth headers
- **Database Isolation**: Tests use unique user IDs prefixed with `test-user-` for cleanup
- **Real Database**: Tests run against development database for integration accuracy

**Key Test Cases**:
1. Inventory upsert prevents duplicate products per user
2. Store Zero logic prevents negative inventory (sets to 0 instead)
3. Unit conversion accuracy (g↔kg, ml↔L) during mark/undo
4. Undo restores exact previous inventory values
5. 52-week schedule completeness and structure validation
6. Auth guard enforcement on all protected endpoints

### Future Enhancements

**NZLA Shopping Cart Integration (Planned)**
- **Documentation**: Comprehensive Phase 1 implementation plan available in `phase-1-implementation-plan.md`
- **Goal**: Enable users to add purchase recommendations directly to NZLA shop cart with one click
- **Approach**: URL-based cart integration (Phase 1) → AJAX integration (Phase 2) → API partnership (Phase 3)
- **Status**: Planning complete, awaiting product ID discovery and platform detection
- **Timeline**: Phase 1 estimated at 2 weeks (~12 hours effort)
- **Key Features**:
  - Direct "Add to Cart" buttons on purchase recommendations
  - Automatic package quantity calculation
  - Seamless integration with https://www.newzealandlawnaddicts.com/shop/
  - Graceful fallback for unmapped products
  - Opens shop in new tab to preserve app state

The application architecture prioritizes performance, accessibility, and maintainability while providing a comprehensive solution for lawn care management and product recommendations.