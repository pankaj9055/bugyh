# EV Investment Platform

## Overview

This is a full-stack investment platform application built with React, Express.js, and PostgreSQL. The platform allows users to invest in electric vehicle (EV) projects, earn daily returns, participate in referral programs, and manage their portfolios. It features a comprehensive admin panel for managing users, transactions, and platform operations.

## User Preferences

Preferred communication style: Simple, everyday language (Hindi/Hinglish mixed).
Investment system preferences: Doubling investment plans (3k→6k→12k→24k→48k→96k), tier-based unlocking, reinvestment capabilities.
UI preferences: Mobile-first design with no white space gaps at top of pages.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Components**: Shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with a custom gold-themed color palette
- **State Management**: TanStack React Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation schemas
- **Authentication**: JWT-based authentication with local storage persistence

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: JWT tokens with bcrypt for password hashing
- **File Uploads**: Multer middleware for handling profile photo uploads
- **API Design**: RESTful API with standardized error handling and response formats
- **Session Management**: Connect-pg-simple for PostgreSQL-backed sessions

### Database Design
- **Primary Database**: PostgreSQL with Neon serverless hosting
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Core Tables**:
  - Users (authentication, profiles, balances, referral system)
  - Investment Plans (predefined investment packages)
  - User Investments (active user investments with tracking)
  - Transactions (deposits, withdrawals, referral bonuses, daily returns)
  - Referrals (referral relationship tracking)
  - Daily Returns (automated return calculations)

### Authentication & Authorization
- **JWT Strategy**: Stateless authentication with refresh capabilities
- **Role-Based Access**: User and admin roles with protected routes
- **Password Security**: Bcrypt hashing with salt rounds
- **Protected Routes**: Client-side route protection with automatic redirects

### Business Logic
- **Investment System**: Doubling tier-based investment plans (₹3k to ₹96k) with 20-day cycles and 10% daily returns
- **Tier System**: User progression through investment tiers, unlocking higher plans upon completion
- **Reinvestment**: Ability to reinvest completed plans using earned profits for tier advancement
- **Referral Program**: Multi-level referral system with bonus tracking
- **Transaction Processing**: Automated daily return processing and manual transaction approval
- **Admin Controls**: Comprehensive admin panel for platform management

## External Dependencies

### Core Framework Dependencies
- **@neondatabase/serverless**: Neon PostgreSQL serverless database connection
- **drizzle-orm**: Type-safe ORM for database operations
- **@tanstack/react-query**: Server state management and caching
- **express**: Node.js web framework for API server
- **react**: Frontend UI library with hooks

### UI and Styling
- **@radix-ui/react-***: Comprehensive set of accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Type-safe variant API for component styling
- **lucide-react**: Icon library for consistent iconography

### Authentication and Security
- **jsonwebtoken**: JWT token generation and verification
- **bcryptjs**: Password hashing and verification
- **multer**: File upload middleware for profile photos

### Development and Build Tools
- **vite**: Fast development server and build tool
- **typescript**: Type safety across the entire application
- **zod**: Runtime type validation and schema definition
- **react-hook-form**: Performant form handling with validation

### Database and Migrations
- **drizzle-kit**: Database migrations and schema management
- **connect-pg-simple**: PostgreSQL session store for Express

### Additional Utilities
- **date-fns**: Date manipulation and formatting
- **wouter**: Lightweight React router
- **@hookform/resolvers**: Integration between React Hook Form and Zod