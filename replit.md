# replit.md

## Overview

This is a comprehensive full-stack training management SaaS application built with Express.js backend and React frontend. The system helps companies manage employee training records, track certification expiry dates, and send automated email alerts. It features dual authentication (Google + Replit), mobile-first responsive design, and is ready for mobile app deployment with Capacitor. The system includes subscription management with optional Stripe integration.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Custom JWT + Google OAuth 2.0 (NO Replit Auth)
- **Session Management**: JWT tokens with 7-day expiration
- **API Structure**: RESTful API endpoints under `/api` prefix
- **Payment Processing**: Stripe integration with webhooks

### Frontend Architecture
- **Framework**: React with TypeScript
- **Build Tool**: Vite
- **UI Library**: shadcn/ui components with Radix UI primitives
- **Styling**: TailwindCSS with CSS variables for theming
- **State Management**: TanStack Query for server state
- **Routing**: Wouter for client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Database Design
- **Users**: Stores company/user information with subscription details
- **Employees**: Company employees with basic contact information
- **Trainings**: Training records linked to employees with completion dates and validity periods
- **Alerts**: Email alert tracking system
- **Sessions**: Authentication session storage

## Key Components

### Authentication System
- **Traditional Auth**: Email/password registration and login with bcrypt
- **Google OAuth 2.0**: Social login integration 
- **JWT Tokens**: 7-day expiration with secure signing
- **Access Keys**: Unique access key generated for each user
- **No Replit Auth**: Completely removed, using custom system

### Subscription Management
- Stripe integration for payment processing
- Trial period management (7 days free)
- Subscription status tracking (trial, active, canceled, expired)
- Automatic access control based on subscription status

### Training Management
- Employee CRUD operations with validation
- Training record management with expiry tracking
- Dashboard with key metrics and statistics
- Search and filtering capabilities

### Email Alert System
- Automated cron jobs for checking training expiry
- SendGrid integration for email delivery
- 5-day warning and expiry day notifications
- Alert tracking to prevent duplicate emails

### UI Components
- Mobile-first responsive design
- Dark/light theme support with CSS variables
- Comprehensive component library with shadcn/ui
- Form validation with visual feedback
- Loading states and error handling

## Data Flow

1. **User Authentication**: Users authenticate via Replit Auth, sessions stored in PostgreSQL
2. **Data Operations**: Frontend makes API calls to Express backend
3. **Database Operations**: Backend uses Drizzle ORM to interact with PostgreSQL
4. **Background Jobs**: Cron jobs run daily to check training expiry and send emails
5. **Payment Processing**: Stripe handles subscription payments and webhooks
6. **Email Delivery**: SendGrid sends automated training alerts

## External Dependencies

### Required Services
- **PostgreSQL Database**: Primary data storage (configured via DATABASE_URL)
- **Stripe**: Payment processing (requires STRIPE_SECRET_KEY, VITE_STRIPE_PUBLIC_KEY)
- **SendGrid**: Email delivery (requires SENDGRID_API_KEY)
- **Replit Auth**: User authentication (requires REPLIT_DOMAINS, SESSION_SECRET)

### Key Dependencies
- **@neondatabase/serverless**: PostgreSQL connection pooling
- **drizzle-orm**: Database ORM and query builder
- **@stripe/stripe-js & @stripe/react-stripe-js**: Payment integration (optional)
- **@sendgrid/mail**: Email service integration (optional)
- **@tanstack/react-query**: Server state management
- **@radix-ui/**: Accessible UI component primitives
- **firebase**: Google Authentication integration
- **@capacitor/core & @capacitor/cli**: Mobile app deployment
- **react-icons**: Icon library including Google icons

## Deployment Strategy

### Development Setup
- Vite dev server for frontend with HMR
- tsx for TypeScript execution of backend
- Database migrations via Drizzle Kit
- Environment variable configuration for services

### Production Build
- Frontend: Vite build to static assets
- Backend: esbuild bundle for Node.js deployment
- Database: PostgreSQL with connection pooling
- Sessions: Stored in database for persistence across deployments

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `STRIPE_SECRET_KEY`: Stripe API key (optional - system works without)
- `VITE_STRIPE_PUBLIC_KEY`: Stripe publishable key (optional)
- `SENDGRID_API_KEY`: SendGrid API key for emails (optional)
- `SESSION_SECRET`: Session encryption key
- `REPLIT_DOMAINS`: Allowed domains for authentication
- `ISSUER_URL`: OpenID Connect issuer URL
- `VITE_FIREBASE_API_KEY`: Firebase API key for Google Auth (optional)
- `VITE_FIREBASE_PROJECT_ID`: Firebase project ID (optional)
- `VITE_FIREBASE_APP_ID`: Firebase app ID (optional)

### Recent Changes (Jan 31, 2025)
- ✅ **Complete System Rebuild**: Migrated from Replit Agent to full custom solution
- ✅ **Custom Authentication**: Implemented JWT + Google OAuth 2.0, removed Replit Auth completely
- ✅ **Stripe Integration**: Full payment system with checkout, webhooks, and subscription management
- ✅ **Organized Backend**: Created controllers and middleware for proper architecture
- ✅ **New Database Schema**: Updated users table for custom auth with access keys
- ✅ **Beautiful Auth Page**: Modern login/register with Google OAuth option
- ✅ **Complete Documentation**: Comprehensive setup guide with all required environment variables
- ✅ **Security Improvements**: BCrypt password hashing, JWT tokens with 7-day expiration

### Mobile App Preparation
- **Capacitor**: Configured for Android/iOS deployment
- **PWA Ready**: Service worker and manifest configured
- **Touch Optimizations**: 44px minimum tap targets, touch-action optimizations
- **Responsive Design**: Mobile-first approach with proper breakpoints
- **Native Features**: Splash screen, status bar, keyboard handling configured

### Scaling Considerations
- Database connection pooling for concurrent requests
- Session storage in database for horizontal scaling
- Stateless API design for load balancing
- Background job scheduling for email processing
- Mobile app distribution via app stores
- Optional service integrations (Stripe, SendGrid, Firebase)