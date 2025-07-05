# HR Management System

## Overview

This is a comprehensive Human Resources management web application built with React and Express.js, designed to streamline employee onboarding and management processes. The application features a multi-tenant architecture allowing companies to manage their employee data securely and efficiently.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **UI Library**: Radix UI components with shadcn/ui styling
- **Styling**: Tailwind CSS with custom design system
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for client-side routing
- **Forms**: React Hook Form with Zod validation
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Session Management**: Connect-pg-simple for PostgreSQL session storage
- **Document Generation**: docx library for employment contract generation
- **API Design**: RESTful API with JSON responses

## Key Components

### Database Schema
The application uses a multi-tenant PostgreSQL schema with three main entities:
- **Companies**: Stores company information and serves as the tenant identifier
- **Employees**: Contains personal information linked to specific companies
- **Employments**: Manages employment details and job-related information

All tables use UUIDs for primary keys and include proper foreign key relationships for data integrity.

### Frontend Components
- **Sidebar Navigation**: Company selector and main navigation
- **Dashboard**: Overview with statistics and quick actions
- **Employee Management**: Full CRUD operations with search and filtering
- **Onboarding Form**: Multi-step form for new employee registration
- **Contract Generation**: Automated employment contract creation

### Multi-Tenancy Implementation
- Database-level isolation using company_id foreign keys
- All queries filtered by company context
- Session-based company selection
- Secure data access patterns

## Data Flow

1. **Company Selection**: Users select a company from the sidebar
2. **Data Filtering**: All API requests include company context
3. **Employee Onboarding**: Multi-step form collects and validates employee data
4. **Database Storage**: Validated data is stored with proper company associations
5. **Contract Generation**: System queries employee data and generates downloadable contracts

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connectivity
- **drizzle-orm**: Type-safe database queries and migrations
- **@tanstack/react-query**: Server state management and caching
- **react-hook-form**: Form state management and validation
- **zod**: Schema validation and type safety
- **docx**: Document generation for employment contracts

### UI Dependencies
- **@radix-ui/***: Accessible component primitives
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library
- **date-fns**: Date manipulation utilities

## Deployment Strategy

### Development
- Vite development server with HMR
- TypeScript compilation with strict mode
- Real-time error overlay for debugging
- Database migrations with Drizzle Kit

### Production
- Vite build process for optimized frontend bundle
- ESBuild for server-side bundling
- Static file serving through Express
- Environment-based configuration

### Database Management
- Schema defined in TypeScript with Drizzle ORM
- Migration files generated automatically
- Database provisioning through environment variables
- Connection pooling with Neon serverless

## User Preferences

Preferred communication style: Simple, everyday language.

## Changelog

Changelog:
- July 05, 2025. Initial setup
- July 05, 2025. Enhanced UI with sophisticated date picker components, unified page headers, fixed sidebar positioning, and improved navigation flow
- July 05, 2025. Updated application for UK market: changed currency to pounds sterling, updated locations to UK cities, added comprehensive contract information fields (payment method, marital status, tax code, visa category) to onboarding process with predefined select options