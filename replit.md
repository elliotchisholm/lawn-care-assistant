# Lawn Care Web Application

## Overview

This is a comprehensive lawn care web application designed to provide personalized NZLA (New Zealand Lawn Association) product recommendations based on current date and lawn size. The application serves as a professional lawn care assistant that helps users determine the right products, quantities, and application timing for optimal lawn maintenance throughout the year.

The system combines a React-based frontend with an Express backend, featuring a clean, utility-focused design system built with Tailwind CSS and shadcn/ui components. The application emphasizes functionality and usability for lawn care enthusiasts who need quick, accurate product recommendations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript, using Vite as the build tool
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and utility-first approach
- **Form Handling**: React Hook Form with Zod validation

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
  - Inventory table for tracking product stocks and quantities
  - Shared schema with Zod validation integration

### Authentication and Authorization
- **User Management**: Username/password authentication system
- **Session Storage**: Server-side sessions stored in PostgreSQL
- **Data Isolation**: User-scoped inventory and recommendation data

### Design System and Theming
- **Color Palette**: Nature-focused green theme with light/dark mode support
- **Typography**: Inter font family with consistent weight hierarchy
- **Component Variants**: Comprehensive button, card, and form component variations
- **Responsive Design**: Mobile-first approach with touch-friendly interfaces

### Core Application Features
- **Weekly Application Scheduler**: Automatically determines current week and appropriate product applications
- **Lawn Size Calculator**: Precise quantity scaling based on user's lawn area with real-time save indicators
- **Product Recommendation Engine**: Date-based NZLA product suggestions with detailed application instructions
- **Inventory Management**: User tracking of product stocks and quantities
- **Application Timeline**: Visual weekly schedule with progress indicators

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

The application architecture prioritizes performance, accessibility, and maintainability while providing a comprehensive solution for lawn care management and product recommendations.