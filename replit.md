# Lawn Care Web Application

## Overview

This is a comprehensive lawn care web application designed to provide personalized NZLA (New Zealand Lawn Association) product recommendations based on current date and lawn size. The application serves as a professional lawn care assistant that helps users determine the right products, quantities, and application timing for optimal lawn maintenance throughout the year.

The system combines a React-based frontend with an Express backend, featuring a clean, utility-focused design system built with Tailwind CSS and shadcn/ui components. The application emphasizes functionality and usability for lawn care enthusiasts who need quick, accurate product recommendations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript, using Vite as the build tool
- **Routing**: Wouter for lightweight client-side routing with ProtectedRoute wrapper for authenticated pages
- **State Management**: TanStack Query (React Query) for server state management
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and utility-first approach
- **Form Handling**: React Hook Form with Zod validation
- **Authentication**: Custom useAuth hook for managing authentication state across components

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
  - Shared schema with Zod validation integration

### Authentication and Authorization
- **Authentication Method**: Google SSO via Replit Auth (OIDC)
- **Tiered Access Model**: Public features accessible without login; protected features require authentication
- **Session Storage**: Server-side sessions stored in PostgreSQL
- **Route Protection**: ProtectedRoute component guards authenticated pages, preventing unauthorized access
- **Data Isolation**: User-scoped inventory and recommendation data
- **Security**: Client-side route guards prevent protected queries from executing for unauthenticated users

### Design System and Theming
- **Color Palette**: Nature-focused green theme with light/dark mode support
- **Typography**: Inter font family with consistent weight hierarchy
- **Component Variants**: Comprehensive button, card, and form component variations
- **Responsive Design**: Mobile-first approach with touch-friendly interfaces

### Application Structure
- **Public Home Page (/)**: Accessible without authentication
  - Lawn Size Calculator (local state, no save)
  - Current Week Display showing this week's application
  - Product Application recommendations with quantity calculations
  - Locked feature previews (Inventory & Purchase Recommendations) with sign-in CTAs
- **Protected Dashboard (/dashboard)**: Requires authentication
  - Full Lawn Size Calculator with persistent storage
  - Current Week Display
  - Product Application recommendations
  - Product Inventory Management with unit conversions (kg↔g, L↔ml)
  - Purchase Recommendations based on inventory and application needs
  
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
  - Public version: Local state (not saved)
  - Dashboard version: Persistent storage with real-time save indicators
- **Product Recommendation Engine**: Database-backed NZLA product suggestions with detailed application instructions
  - All 52 weeks pre-seeded from official NZLA application guide
  - Each product includes type field for accurate display and calculations
  - Upsert-based seeding allows schedule updates without data loss
- **Inventory Management** (Protected): User tracking of product stocks and quantities with unit conversion support
  - One inventory entry per product per user (database constraint)
  - Unit conversions between kg↔g and L↔ml
- **Purchase Recommendations** (Protected): Intelligent suggestions based on upcoming applications and current inventory
- **Application Timeline**: Visual weekly schedule with progress indicators and current week highlighting

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

The application architecture prioritizes performance, accessibility, and maintainability while providing a comprehensive solution for lawn care management and product recommendations.