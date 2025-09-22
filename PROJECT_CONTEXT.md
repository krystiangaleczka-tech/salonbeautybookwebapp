# Beauty Salon Web App - Project Context

## Project Overview
Full-stack beauty salon management application with separate admin and client interfaces.

## Root Configuration Files
- **`.gitignore`** - Git ignore rules (node_modules, .next, .DS_Store)
- **`.firebaserc`** - Firebase project configuration
- **`firebase.json`** - Firebase hosting and functions configuration
- **`firestore.rules`** - Firestore security rules
- **`firestore.indexes.json`** - Firestore database indexes
- **`package.json`** - Root dependencies and scripts
- **`PRD.md`** - Product Requirements Document
- **`RULES.md`** - Project development rules
- **`TASK.md`** - Task management
- **`ARCHITECTURE.md`** - System architecture documentation

## Admin Frontend (`admin-frontend/`)
### Configuration
- **`package.json`** - Admin panel dependencies (Next.js, Tailwind, etc.)
- **`next.config.js`** - Next.js configuration
- **`tailwind.config.ts`** - Tailwind CSS configuration
- **`tsconfig.json`** - TypeScript configuration
- **`postcss.config.js`** - PostCSS configuration
- **`.eslintrc.json`** - ESLint rules

### App Structure
- **`src/app/layout.tsx`** - Root layout with providers
- **`src/app/page.tsx`** - Admin dashboard home page
- **`src/app/globals.css`** - Global styles

#### Admin Pages
- **`src/app/kalendarz/page.tsx`** - Calendar/scheduling management
- **`src/app/klienci/page.tsx`** - Customer management
- **`src/app/raporty/page.tsx`** - Reports and analytics
- **`src/app/uslugi/page.tsx`** - Services management

#### Components
- **`src/components/dashboard/dashboard-layout.tsx`** - Main dashboard layout
- **`src/components/dashboard/calendar-card.tsx`** - Calendar component
- **`src/components/reports/analytics-panel.tsx`** - Analytics panel

#### Utilities
- **`src/lib/dashboard-data.ts`** - Dashboard data and mock data
- **`src/lib/dashboard-theme.ts`** - Theme configuration

## Client Frontend (`client-frontend/`)
### Configuration
- **`package.json`** - Client app dependencies (Vite, React, Redux)
- **`vite.config.ts`** - Vite build configuration
- **`tailwind.config.js`** - Tailwind CSS configuration
- **`tsconfig.json`** - TypeScript configuration
- **`index.html`** - Main HTML entry point

### App Structure
- **`src/main.tsx`** - Application entry point
- **`src/App.tsx`** - Root App component with routing
- **`src/App.css`** - Global app styles

#### Pages
- **`src/pages/Login.tsx`** - User authentication
- **`src/pages/Dashboard.tsx`** - Client dashboard
- **`src/pages/Booking.tsx`** - Service booking interface
- **`src/pages/Calendar.tsx`** - Calendar view
- **`src/pages/Customers.tsx`** - Customer management

#### Components
- **`src/components/Header.tsx`** - Application header
- **`src/components/Layout.tsx`** - Main layout wrapper
- **`src/components/Sidebar.tsx`** - Navigation sidebar
- **`src/components/ui/button.tsx`** - Reusable button component

#### State Management
- **`src/store/index.ts`** - Redux store configuration
- **`src/store/authSlice.ts`** - Authentication state slice
- **`src/contexts/AuthContext.tsx`** - Authentication context

#### Utilities
- **`src/lib/firebase.ts`** - Firebase configuration
- **`src/lib/utils.ts`** - General utility functions

## Design Files
- **`.superdesign/design_iterations/`** - HTML design mockups
- **`.superdesign/beauty_salon_theme.css`** - Custom theme styles
- **`.superdesign/default_ui_darkmode.css`** - Dark mode styles

## Specifications
- **`specs/001-beauty-salon-booking/spec.md`** - Booking feature specification

## Technology Stack
- **Admin**: Next.js 14, TypeScript, Tailwind CSS
- **Client**: Vite, React, TypeScript, Tailwind CSS
- **State**: Redux Toolkit
- **Auth**: Firebase Authentication
- **Database**: Firestore
- **Styling**: Tailwind CSS with custom themes

## Key Features
- Admin panel for salon management
- Client booking interface
- Calendar and scheduling
- Customer management
- Service management
- Reports and analytics

## Recent Changes
- Updated .gitignore to exclude .next build files
- Committed build artifacts and cache files
- Repository ready for push to remote

## Development Notes
- Admin uses Next.js App Router
- Client uses Vite for faster development
- Both use Tailwind CSS for styling
- Firebase provides backend services
- Redux manages client-side state