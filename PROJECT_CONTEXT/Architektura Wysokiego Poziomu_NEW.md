# Architektura Wysokiego Poziomu - Salon Beauty Mario (Aktualny Stan)

```mermaid
graph TB
    subgraph "🖥️ Frontend Next.js Application"
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

    subgraph "📅 System Kalendarza"
        CS1[Calendar Services]
        CS2[Date Indices]
        CS3[Calendar Title]
        CS4[Title Formation]
        
        subgraph "State Management"
            SM1[State Share]
            SM2[Cambrian/UnionCharge]
            SM3[Cambra/Near]
            SM4[Auto Contact]
        end
        
        subgraph "Central Collection"
            CC1[Office Operations]
            CC2[Appointment Service]
            CC3[Real-time Updates]
            CC4[Build Operations]
            CC5[Search]
            CC6[Date Range]
        end
        
        subgraph "Calendar Components"
            CP1[Date Name]
            CP2[Name Only Code]
            CP3[Addressing Code]
            CP4[Type Application]
            CP5[Date Location]
        end
        
        CS1 --> CS2
        CS2 --> CS3
        CS3 --> CS4
        CS1 --> "State Management"
        CS1 --> "Central Collection"
        CS1 --> "Calendar Components"
    end

    subgraph "🔔 System Powiadomień"
        subgraph "Notification Triggers"
            TR1[Appointment Created]
            TR2[Appointment Updated]
            TR3[Appointment Cancelled]
            TR4[Reminder Scheduled]
        end
        
        NS1[Notification Service]
        NS2[Create Notification]
        NS3[Batch Operations]
        NS4[Rash Notifications]
        
        subgraph "Notification Delivery"
            DL1[Real-time Listeners]
            DL2[Badge Counter]
            DL3[Mark as Read]
            DL4[Email Service]
            DL5[Toast Messages]
        end
        
        "Notification Triggers" --> NS1
        NS1 --> NS2
        NS1 --> NS3
        NS1 --> NS4
        NS1 --> "Notification Delivery"
    end

    subgraph "⚙️ System Ustawień"
        SS1[Settings Shell]
        
        subgraph "Kategorie Ustawień"
            SC1[Salon Profile]
            SC2[Calendar Availability]
            SC3[Appointment Scheduling]
            SC4[Notification Delivery]
            SC5[Public Information]
        end
        
        subgraph "Przepływ Ustawień"
            SF1[Validation]
            SF2[Firestore Update]
            SF3[Real-time Sync]
            SF4[UI Update]
        end
        
        SS1 --> "Kategorie Ustawień"
        "Kategorie Ustawień" --> "Przepływ Ustawień"
    end

    subgraph "📅 Google Calendar Integration"
        GC1[OAuth2 Authentication]
        GC2[Token Management]
        GC3[Event Synchronization]
        GC4[Batch Operations]
        
        subgraph "OAuth2 Flow"
            AF1[Get Auth URL]
            AF2[Handle Callback]
            AF3[Store Tokens]
            AF4[Refresh Tokens]
        end
        
        subgraph "Sync Operations"
            SO1[Create Event]
            SO2[Update Event]
            SO3[Delete Event]
            SO4[Batch Sync]
        end
        
        GC1 --> "OAuth2 Flow"
        GC2 --> "OAuth2 Flow"
        GC3 --> "Sync Operations"
        GC4 --> "Sync Operations"
    end

    subgraph "🔥 Firebase Backend"
        subgraph "🗄️ Firestore Database (eur3)"
            FS1[appointments]
            FS2[customers]
            FS3[services]
            FS4[employees]
            FS5[notifications]
            FS6[settings]
            FS7[googleTokens]
            FS8[calendarSync]
        end
        
        subgraph "☁️ Cloud Functions (europe-central2)"
            CF1[Business Logic]
            CF2[Firebase Storage]
            CF3[Google Calendar API]
            CF4[Notifications]
            CF5[OAuth2 Handlers]
        end
        
        subgraph "🔐 Authentication"
            AU1[Email/Password]
            AU2[Verify User Credentials]
            AU3[Auth Token]
            AU4[User Data]
        end
        
        FB1[Firebase Holding]
        FB2[Firebase Auto]
        FB3[Real-time Updates]
    end

    subgraph "🔄 Przepływ Danych"
        subgraph "Proces Logowania"
            LF1[User (Admin/Staff)]
            LF2[Login (Email/Password)]
            LF3[Authenticate User]
            LF4[Login Success]
        end
        
        subgraph "Proces Tworzenia Wizyty"
            AF1[Create Appointment]
            AF2[Validate Appointment Data]
            AF3[Check Time Conflicts]
            AF4[Conflict Status]
            AF5[Save Appointment]
            AF6[Appointment ID]
            AF7[Success Response]
            AF8[Google Calendar Sync]
        end
        
        subgraph "Aktualizacje w Czasie Rzeczywistym"
            RT1[Static Fetch (getAppointments)]
            RT2[Manual Refresh]
            RT3[Calendar View Update]
        end
        
        "Proces Logowania" --> "Proces Tworzenia Wizyty"
        "Proces Tworzenia Wizyty" --> "Aktualizacje w Czasie Rzeczywistym"
    end

    subgraph "📊 Model Danych Firestore"
        subgraph "Appointments Collection"
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
        
        subgraph "Customers Collection"
            CM1[string id]
            CM2[string fullName]
            CM3[string phone]
            CM4[string email]
            CM5[string notes]
            CM6[boolean blacklisted]
        end
        
        subgraph "Services Collection"
            SVM1[string id]
            SVM2[string name]
            SVM3[string category]
            SVM4[number durationMin]
            SVM5[number price]
            SVM6[boolean noParallel]
        end
        
        subgraph "Employees Collection"
            EM1[string id]
            EM2[string name]
            EM3[string role]
            EM4[string email]
            EM5[array services]
            EM6[object personalBuffers]
        end
        
        subgraph "Notifications Collection"
            NM1[string id]
            NM2[string type]
            NM3[string title]
            NM4[string message]
            NM5[timestamp time]
            NM6[boolean read]
        end
        
        subgraph "Settings Collection"
            STM1[string salonName]
            STM2[string salonAddress]
            STM3[object workingHours]
            STM4[array holidays]
            STM5[object notifications]
        end
        
        subgraph "Google Tokens Collection"
            GTM1[string userId]
            GTM2[string accessToken]
            GTM3[string refreshToken]
            GTM4[timestamp expiryDate]
            GTM5[string calendarId]
            GTM6[boolean isActive]
        end
        
        subgraph "Calendar Sync Collection"
            CSM1[string appointmentId]
            CSM2[string googleEventId]
            CSM3[string userId]
            CSM4[timestamp lastSyncAt]
            CSM5[string syncDirection]
            CSM6[string status]
        end
    end

    %% Połączenia między systemami
    "🖥️ Frontend Next.js Application" --> "🔥 Firebase Backend"
    "🖥️ Frontend Next.js Application" --> "🔄 Przepływ Danych"
    
    "📅 System Kalendarza" --> "🔔 System Powiadomień"
    "📅 System Kalendarza" --> "📅 Google Calendar Integration"
    
    "⚙️ System Ustawień" --> "🔥 Firebase Backend"
    
    "🔄 Przepływ Danych" --> "📊 Model Danych Firestore"
    
    "🔥 Firebase Backend" --> "📊 Model Danych Firestore"
    "☁️ Cloud Functions" --> "🗄️ Firestore Database"
    "📅 Google Calendar Integration" --> "🔥 Firebase Backend"
    
    %% Relacje między kolekcjami
    "Appointments Collection" -.->|belongs_to| "Customers Collection"
    "Appointments Collection" -.->|belongs_to| "Services Collection"
    "Appointments Collection" -.->|belongs_to| "Employees Collection"
    "Notifications Collection" -.->|relates_to| "Appointments Collection"
    "Appointments Collection" -.->|syncs_to| "Calendar Sync Collection"
    "Google Tokens Collection" -.->|authenticates| "📅 Google Calendar Integration"

    %% Stylowanie
    classDef frontend fill:#e3f2fd,stroke:#2196f3,stroke-width:2px
    classDef calendar fill:#f3e5f5,stroke:#9c27b0,stroke-width:2px
    classDef notifications fill:#fff3e0,stroke:#ff9800,stroke-width:2px
    classDef settings fill:#e8f5e8,stroke:#4caf50,stroke-width:2px
    classDef firebase fill:#ffebee,stroke:#f44336,stroke-width:2px
    classDef dataflow fill:#fce4ec,stroke:#e91e63,stroke-width:2px
    classDef datamodel fill:#e1f5fe,stroke:#03a9f4,stroke-width:2px
    classDef googlecalendar fill:#f1f8e9,stroke:#689f38,stroke-width:2px
    
    class "🖥️ Frontend Next.js Application" frontend
    class "📅 System Kalendarza" calendar
    class "🔔 System Powiadomień" notifications
    class "⚙️ System Ustawień" settings
    class "🔥 Firebase Backend" firebase
    class "🔄 Przepływ Danych" dataflow
    class "📊 Model Danych Firestore" datamodel
    class "📅 Google Calendar Integration" googlecalendar
```

## Podpis
Architektura Wysokiego Poziomu_NEW - Aktualny stan z integracją Google Calendar (2025-10-17)