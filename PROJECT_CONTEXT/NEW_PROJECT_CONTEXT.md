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
  - **`integracje/page.tsx`** - Integrations settings (Google Calendar)
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
- **`src/contexts/employee-context.tsx`** - Employee management context with roles (owner/employee/tester)
- **`src/contexts/theme-context.tsx`** - Theme context
- **`src/hooks/useAuth.ts`** - Authentication hook
- **`src/hooks/usePendingTimeChanges.ts`** - Pending time changes hook
- **`src/hooks/useEmployee.ts`** - Employee management hook
- **`src/hooks/useOptimisticUpdates.ts`** - Optimistic updates hook

#### Services
- **`src/lib/appointments-service.ts`** - Appointments CRUD service with Google Calendar sync
- **`src/lib/customers-service.ts`** - Customers CRUD service
- **`src/lib/employees-service.ts`** - Employees CRUD service with auto-creation of admin
- **`src/lib/services-service.ts`** - Services CRUD service
- **`src/lib/dashboard-service.ts`** - Dashboard data service
- **`src/lib/notifications-service.ts`** - Notifications service
- **`src/lib/filters-service.ts`** - Filters service
- **`src/lib/settings-data.ts`** - Settings data service
- **`src/lib/firebase.ts`** - Firebase configuration
- **`src/lib/dashboard-data.ts`** - Dashboard data and mock data
- **`src/lib/dashboard-theme.ts`** - Theme configuration
- **`src/lib/google-calendar-service.ts`** - Advanced Google Calendar service with batch operations
- **`src/lib/optimistic-updates.ts`** - Optimistic updates for better UX
- **`src/lib/init-employees.ts`** - Employee initialization service
- **`src/lib/test-firebase.ts`** - Firebase testing utilities

## Backend Functions (`booking-functions/`)
### Configuration
- **`package.json`** - Functions dependencies
- **`tsconfig.json`** - TypeScript configuration
- **`.eslintrc.js`** - ESLint rules

### Source
- **`src/index.ts`** - Main functions entry point
- **`src/firestore-triggers.ts`** - Firestore triggers for automatic synchronization
- **`src/google-calendar/`** - Google Calendar integration
  - **`auth.ts`** - Google OAuth authentication
  - **`config.ts`** - Google Calendar configuration
  - **`sync.ts`** - Google Calendar synchronization
  - **`types.ts`** - Google Calendar types

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
- **Backend**: Firebase Cloud Functions (europe-central2)
- **Styling**: Tailwind CSS with custom themes
- **Integrations**: Google Calendar API

## Key Features
- Admin panel for salon management
- Calendar and scheduling with time zones
- Customer management with blacklisting
- Service management with buffers
- **NEW**: Multi-employee system with roles (owner/employee/tester)
- Employee management with personal buffers
- Reports and analytics
- Real-time notifications
- Settings management (working hours, holidays, buffers, etc.)
- Advanced filtering and search with presets
- Mobile and tablet responsive design
- **NEW**: Google Calendar two-way synchronization
- **NEW**: OAuth2 authentication for Google Calendar
- **NEW**: Optimistic updates for better UX
- **NEW**: Firestore triggers for automatic synchronization
- **NEW**: Static fetch instead of realtime listeners for stability

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
- **NEW**: Google Calendar integration with OAuth2 authentication
- **NEW**: Fixed Firestore CORS and infinite loop issues
- **NEW**: Implemented frontend refresh after CRUD operations
- **NEW**: Added Google Calendar event ID protection in appointments
- **NEW**: Multi-employee system implementation (2025-10-20)
- **NEW**: Employee roles system (owner/employee/tester)
- **NEW**: Automatic admin employee creation
- **NEW**: Google Calendar multi-employee sync
- **NEW**: Firestore triggers for background synchronization
- **NEW**: Optimistic updates implementation
- **NEW**: Advanced testing structure for usePendingTimeChanges

## Development Notes
- Admin uses Next.js App Router with protected routes
- Tailwind CSS for styling with custom themes
- Firebase provides backend services (Auth, Firestore, Functions)
- **NEW**: Static fetch instead of realtime listeners for stability
- Comprehensive error handling and loading states
- Responsive design optimized for tablets and desktop
- **NEW**: Google Calendar integration uses OAuth2 flow with refresh tokens
- **NEW**: Firestore region set to eur3 for stability
- **NEW**: Functions region set to europe-central2
- **NEW**: Employee context provides role-based access control
- **NEW**: Optimistic updates improve user experience
- **NEW**: Firestore triggers handle background synchronization
- **NEW**: Comprehensive test coverage for critical hooks

## Complete graph up-to-date 21.10.2025-12:38
graph TB
    %% ========== FRONTEND NEXT.JS ==========
    subgraph Frontend["🖥️ Frontend Next.js Application"]
        A[src/app] --> B(layout.tsx)
        A --> C(globals.css)
        A --> D[(auth) Protected Routes]
        A --> E[(protected) Authenticated Routes]
        
        E --> F(page.tsx - Dashboard)
        E --> G[kalendarz/ - Calendar]
        E --> H[klienci/ - Customers]
        E --> I[raporty/ - Reports]
        E --> J[uslugi/ - Services]
        E --> K[ustawienia/ - Settings]
        
        K --> L[bufory/ - Buffers]
        K --> M[godziny-pracy/ - Working Hours]
        K --> N[integracje/ - Integrations]
        K --> O[powiadomienia/ - Notifications]
        K --> P[profil-salonu/ - Salon Profile]
        K --> Q[prywatnosc/ - Privacy]
        K --> R[swieta-wyjatki/ - Holidays]
        K --> S[zespol-roles/ - Team Roles]
        
        T[src/components] --> U[dashboard/]
        T --> V[calendar/]
        T --> W[auth/]
        T --> X[notifications/]
        T --> Y[settings/]
        T --> Z[ui/]
        
        AA[src/lib] --> BB(appointments-service.ts)
        AA --> CC(customers-service.ts)
        AA --> DD(employees-service.ts)
        AA --> EE(services-service.ts)
        AA --> FF(notifications-service.ts)
        AA --> GG(dashboard-service.ts)
        AA --> HH(filters-service.ts)
        AA --> II(settings-data.ts)
        AA --> JJ(firebase.ts)
        
        KK[src/hooks] --> LL(useAuth.ts)
        KK --> MM(usePendingTimeChanges.ts)
        
        NN[src/contexts] --> OO(auth-context.ts)
        NN --> PP(theme-context.tsx)
    end

    %% ========== KALENDARZ ==========
    subgraph CalendarSystem["📅 System Kalendarza"]
        CS1[Calendar Services]
        CS2[Date Indices]
        CS3[Calendar Title]
        CS4[Title Formation]
        
        subgraph StateManagement["State Management"]
            SM1[State Share]
            SM2[Cambrian/UnionCharge]
            SM3[Cambra/Near]
            SM4[Auto Contact]
        end
        
        subgraph CentralCollection["Central Collection"]
            CC1[Office Operations]
            CC2[Appointment Service]
            CC3[Real-time Updates]
            CC4[Build Operations]
            CC5[Search]
            CC6[Date Range]
        end
        
        subgraph CalendarComponents["Calendar Components"]
            CP1[Date Name]
            CP2[Name Only Code]
            CP3[Addressing Code]
            CP4[Type Application]
            CP5[Date Location]
        end
        
        CS1 --> CS2
        CS2 --> CS3
        CS3 --> CS4
        CS1 --> StateManagement
        CS1 --> CentralCollection
        CS1 --> CalendarComponents
    end

    %% ========== POWIADOMIENIA ==========
    subgraph NotificationSystem["🔔 System Powiadomień"]
        subgraph Triggers["Notification Triggers"]
            TR1[Appointment Created]
            TR2[Appointment Updated]
            TR3[Appointment Cancelled]
            TR4[Reminder Scheduled]
        end
        
        NS1[Notification Service]
        NS2[Create Notification]
        NS3[Batch Operations]
        NS4[Rash Notifications]
        
        subgraph Delivery["Notification Delivery"]
            DL1[Real-time Listeners]
            DL2[Badge Counter]
            DL3[Mark as Read]
            DL4[Email Service]
            DL5[Toast Messages]
        end
        
        Triggers --> NS1
        NS1 --> NS2
        NS1 --> NS3
        NS1 --> NS4
        NS1 --> Delivery
    end

    %% ========== USTAWIENIA ==========
    subgraph SettingsSystem["⚙️ System Ustawień"]
        SS1[Settings Shell]
        
        subgraph SettingsCategories["Kategorie Ustawień"]
            SC1[Salon Profile]
            SC2[Calendar Availability]
            SC3[Appointment Scheduling]
            SC4[Notification Delivery]
            SC5[Public Information]
        end
        
        subgraph SettingsFlow["Przepływ Ustawień"]
            SF1[Validation]
            SF2[Firestore Update]
            SF3[Real-time Sync]
            SF4[UI Update]
        end
        
        SS1 --> SettingsCategories
        SettingsCategories --> SettingsFlow
    end

    %% ========== GOOGLE CALENDAR INTEGRATION ==========
    subgraph GoogleCalendarSystem["📅 Google Calendar Integration"]
        GC1[OAuth2 Authentication]
        GC2[Token Management]
        GC3[Event Synchronization]
        GC4[Batch Operations]
        
        subgraph AuthFlow["OAuth2 Flow"]
            AF1[Get Auth URL]
            AF2[Handle Callback]
            AF3[Store Tokens]
            AF4[Refresh Tokens]
        end
        
        subgraph SyncOperations["Sync Operations"]
            SO1[Create Event]
            SO2[Update Event]
            SO3[Delete Event]
            SO4[Batch Sync]
        end
        
        GC1 --> AuthFlow
        GC2 --> AuthFlow
        GC3 --> SyncOperations
        GC4 --> SyncOperations
    end

    %% ========== FIREBASE BACKEND ==========
    subgraph FirebaseBackend["🔥 Firebase Backend"]
        subgraph FirestoreDB["🗄️ Firestore Database (eur3)"]
            FS1[appointments]
            FS2[customers]
            FS3[services]
            FS4[employees]
            FS5[notifications]
            FS6[settings]
            FS7[googleTokens]
            FS8[calendarSync]
        end
        
        subgraph CloudFunctions["☁️ Cloud Functions (europe-central2)"]
            CF1[Business Logic]
            CF2[Firebase Storage]
            CF3[Google Calendar API]
            CF4[Notifications]
            CF5[OAuth2 Handlers]
        end
        
        subgraph Auth["🔐 Authentication"]
            AU1[Email/Password]
            AU2[Verify User Credentials]
            AU3[Auth Token]
            AU4[User Data]
        end
        
        FB1[Firebase Holding]
        FB2[Firebase Auto]
        FB3[Real-time Updates]
    end

    %% ========== PRZEPŁYW DANYCH ==========
    subgraph DataFlow["🔄 Przepływ Danych"]
        subgraph LoginFlow["Proces Logowania"]
            LF1[User (Admin/Staff)]
            LF2[Login (Email/Password)]
            LF3[Authenticate User]
            LF4[Login Success]
        end
        
        subgraph AppointmentFlow["Proces Tworzenia Wizyty"]
            AF1[Create Appointment]
            AF2[Validate Appointment Data]
            AF3[Check Time Conflicts]
            AF4[Conflict Status]
            AF5[Save Appointment]
            AF6[Appointment ID]
            AF7[Success Response]
            AF8[Google Calendar Sync]
        end
        
        subgraph RealTimeFlow["Aktualizacje w Czasie Rzeczywistym"]
            RT1[Static Fetch (getAppointments)]
            RT2[Manual Refresh]
            RT3[Calendar View Update]
        end
        
        LoginFlow --> AppointmentFlow
        AppointmentFlow --> RealTimeFlow
    end

    %% ========== MODEL DANYCH ==========
    subgraph DataModel["📊 Model Danych Firestore"]
        subgraph AppointmentsModel["Appointments Collection"]
            AM1[string id]
            AM2[string serviceId]
            AM3[string clientId]
            AM4[string staffName]
            AM5[timestamp start]
            AM6[timestamp end]
            AM7[string status]
            AM8[string notes]
            AM9[number price]
            AM10[string googleCalendarEventId]
        end
        
        subgraph CustomersModel["Customers Collection"]
            CM1[string id]
            CM2[string fullName]
            CM3[string phone]
            CM4[string email]
            CM5[string notes]
            CM6[boolean blacklisted]
        end
        
        subgraph ServicesModel["Services Collection"]
            SVM1[string id]
            SVM2[string name]
            SVM3[string category]
            SVM4[number durationMin]
            SVM5[number price]
            SVM6[boolean noParallel]
        end
        
        subgraph EmployeesModel["Employees Collection"]
            EM1[string id]
            EM2[string name]
            EM3[string role]
            EM4[string email]
            EM5[array services]
            EM6[object personalBuffers]
        end
        
        subgraph NotificationsModel["Notifications Collection"]
            NM1[string id]
            NM2[string type]
            NM3[string title]
            NM4[string message]
            NM5[timestamp time]
            NM6[boolean read]
        end
        
        subgraph SettingsModel["Settings Collection"]
            STM1[string salonName]
            STM2[string salonAddress]
            STM3[object workingHours]
            STM4[array holidays]
            STM5[object notifications]
        end
        
        subclass GoogleTokensModel["Google Tokens Collection"]
            GTM1[string userId]
            GTM2[string accessToken]
            GTM3[string refreshToken]
            GTM4[timestamp expiryDate]
            GTM5[string calendarId]
            GTM6[boolean isActive]
        end
        
        subclass CalendarSyncModel["Calendar Sync Collection"]
            CSM1[string appointmentId]
            CSM2[string googleEventId]
            CSM3[string userId]
            CSM4[timestamp lastSyncAt]
            CSM5[string syncDirection]
            CSM6[string status]
        end
    end

    %% ========== POŁĄCZENIA MIĘDZY SYSTEMAMI ==========
    %% Frontend -> Backend
    Frontend --> FirebaseBackend
    Frontend --> DataFlow
    
    %% Kalendarz -> Powiadomienia
    CalendarSystem --> NotificationSystem
    
    %% Kalendarz -> Google Calendar
    CalendarSystem --> GoogleCalendarSystem
    
    %% Ustawienia -> Firebase
    SettingsSystem --> FirebaseBackend
    
    %% Przepływ danych -> Baza danych
    DataFlow --> DataModel
    
    %% Firebase Functions -> Collections
    CloudFunctions --> FirestoreDB
    
    %% Google Calendar -> Firestore
    GoogleCalendarSystem --> FirestoreDB
    
    %% Relacje między kolekcjami
    AppointmentsModel -.->|belongs_to| CustomersModel
    AppointmentsModel -.->|belongs_to| ServicesModel
    AppointmentsModel -.->|belongs_to| EmployeesModel
    NotificationsModel -.->|relates_to| AppointmentsModel
    AppointmentsModel -.->|syncs_to| CalendarSyncModel
    GoogleTokensModel -.->|authenticates| GoogleCalendarSystem

    %% Stylowanie
    classDef frontend fill:#e3f2fd,stroke:#2196f3,stroke-width:2px
    classDef calendar fill:#f3e5f5,stroke:#9c27b0,stroke-width:2px
    classDef notifications fill:#fff3e0,stroke:#ff9800,stroke-width:2px
    classDef settings fill:#e8f5e8,stroke:#4caf50,stroke-width:2px
    classDef firebase fill:#ffebee,stroke:#f44336,stroke-width:2px
    classDef dataflow fill:#fce4ec,stroke:#e91e63,stroke-width:2px
    classDef datamodel fill:#e1f5fe,stroke:#03a9f4,stroke-width:2px
    classDef googlecalendar fill:#f1f8e9,stroke:#689f38,stroke-width:2px