# Beauty Salon Web App - Project Context

## Project Overview
Beauty salon management application focused on the admin interface. Poprzedni moduł kliencki został zarchiwizowany.

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
- **`jest.config.js`** - Jest testing configuration
- **`jest.setup.js`** - Jest test setup

### App Structure
- **`src/app/layout.tsx`** - Root layout with providers
- **`src/app/page.tsx`** - Admin dashboard home page
- **`src/app/globals.css`** - Global styles
- **`src/app/(auth)/login/page.tsx`** - Authentication page
- **`src/app/(protected)/layout.tsx`** - Protected routes layout

#### Admin Pages
- **`src/app/(protected)/kalendarz/page.tsx`** - Calendar/scheduling management
- **`src/app/(protected)/klienci/page.tsx`** - Customer management
- **`src/app/(protected)/raporty/page.tsx`** - Reports and analytics
- **`src/app/(protected)/uslugi/page.tsx`** - Services management
- **`src/app/(protected)/ustawienia/`** - Settings pages
  - **`bufory/page.tsx`** - Time buffers management
  - **`godziny-pracy/page.tsx`** - Working hours management
  - **`integracje/page.tsx`** - Integrations settings
  - **`powiadomienia/page.tsx`** - Notifications settings
  - **`profil-salonu/page.tsx`** - Salon profile settings
  - **`prywatnosc/page.tsx`** - Privacy settings
  - **`swieta-wyjatki/page.tsx`** - Holidays settings
  - **`zespol-roles/page.tsx`** - Team roles management

#### Components
- **`src/components/dashboard/dashboard-layout.tsx`** - Main dashboard layout
- **`src/components/dashboard/calendar-card.tsx`** - Calendar component
- **`src/components/reports/analytics-panel.tsx`** - Analytics panel
- **`src/components/auth/AuthGuard.tsx`** - Authentication guard component
- **`src/components/calendar/appointment-filters.tsx`** - Appointment filters component
- **`src/components/notifications/notifications-modal.tsx`** - Notifications modal
- **`src/components/settings/schedule-editor-modal.tsx`** - Schedule editor modal
- **`src/components/settings/settings-shell.tsx`** - Settings shell component
- **`src/components/ui/theme-toggle.tsx`** - Theme toggle component

#### Contexts and Hooks
- **`src/contexts/auth-context.ts`** - Authentication context
- **`src/contexts/AuthProvider.tsx`** - Authentication provider
- **`src/contexts/theme-context.tsx`** - Theme context
- **`src/hooks/useAuth.ts`** - Authentication hook
- **`src/hooks/usePendingTimeChanges.ts`** - Pending time changes hook

#### Services
- **`src/lib/appointments-service.ts`** - Appointments CRUD service
- **`src/lib/customers-service.ts`** - Customers CRUD service
- **`src/lib/employees-service.ts`** - Employees CRUD service
- **`src/lib/services-service.ts`** - Services CRUD service
- **`src/lib/dashboard-service.ts`** - Dashboard data service
- **`src/lib/notifications-service.ts`** - Notifications service
- **`src/lib/filters-service.ts`** - Filters service
- **`src/lib/settings-data.ts`** - Settings data service
- **`src/lib/firebase.ts`** - Firebase configuration
- **`src/lib/dashboard-data.ts`** - Dashboard data and mock data
- **`src/lib/dashboard-theme.ts`** - Theme configuration

## Backend Functions (`booking-functions/`)
### Configuration
- **`package.json`** - Functions dependencies
- **`tsconfig.json`** - TypeScript configuration
- **`.eslintrc.js`** - ESLint rules

### Source
- **`src/index.ts`** - Main functions entry point
- **`lib/`** - Function libraries

## Design Files
- **`.superdesign/design_iterations/`** - HTML design mockups
- **`.superdesign/beauty_salon_theme.css`** - Custom theme styles
- **`.superdesign/default_ui_darkmode.css`** - Dark mode styles

## Archives
- **`archives/admin-frontend-20250928-124521.tar.gz`** - Archived admin frontend
- **`archives/client-frontend-20250928-124723.tar.gz`** - Archived client frontend

## Progress
- **`progress/`** - Development progress logs

## Technology Stack
- **Admin**: Next.js 14, TypeScript, Tailwind CSS
- **Auth**: Firebase Authentication
- **Database**: Firestore
- **Backend**: Firebase Cloud Functions
- **Styling**: Tailwind CSS with custom themes

## Key Features
- Admin panel for salon management
- Calendar and scheduling with time zones
- Customer management with blacklisting
- Service management with buffers
- Employee management with personal buffers
- Reports and analytics
- Real-time notifications
- Settings management (working hours, holidays, buffers, etc.)
- Advanced filtering and search
- Mobile and tablet responsive design

## Recent Changes
- Implemented comprehensive calendar with multiple views
- Added real-time notifications system
- Integrated employee buffers for service scheduling
- Fixed timezone issues in calendar
- Added mobile/tablet UI optimizations
- Implemented dark mode support
- Added appointment filters with presets
- Integrated real data with Firestore
- Implemented pending time changes for appointments

## Development Notes
- Admin uses Next.js App Router with protected routes
- Tailwind CSS for styling with custom themes
- Firebase provides backend services (Auth, Firestore, Functions)
- Real-time updates using Firestore listeners
- Comprehensive error handling and loading states
- Responsive design optimized for tablets and desktop