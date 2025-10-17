# Model Danych Firestore - Salon Beauty Mario (Aktualny Stan)

```mermaid
erDiagram
    subgraph "📅 Appointments Collection"
        APPOINTMENTS {
            string id PK
            string serviceId FK
            string clientId FK
            string staffName
            timestamp start
            timestamp end
            string status
            string notes
            number price
            timestamp createdAt
            timestamp updatedAt
            string googleCalendarEventId
        }
    end

    subgraph "👥 Customers Collection"
        CUSTOMERS {
            string id PK
            string fullName
            string phone
            string email
            string notes
            boolean blacklisted
            timestamp lastVisit
            timestamp createdAt
            timestamp updatedAt
        }
    end

    subgraph "💅 Services Collection"
        SERVICES {
            string id PK
            string name
            string category
            number durationMin
            number price
            boolean noParallel
            number bufferAfterMin
            string tone
            string description
            number weeklyBookings
            number quarterlyBookings
            timestamp createdAt
            timestamp updatedAt
        }
    end

    subgraph "👤 Employees Collection"
        EMPLOYEES {
            string id PK
            string name
            string role
            string email
            string phone
            boolean isActive
            array services
            object personalBuffers
            number defaultBuffer
            timestamp createdAt
            timestamp updatedAt
        }
    end

    subgraph "🔔 Notifications Collection"
        NOTIFICATIONS {
            string id PK
            string type
            string title
            string message
            timestamp time
            boolean read
            string customerId FK
            string customerName
            string appointmentId FK
            timestamp appointmentTime
            timestamp createdAt
            timestamp updatedAt
        }
    end

    subgraph "⚙️ Settings Collection"
        SETTINGS {
            string settingKey PK
            string salonName
            string salonAddress
            string salonPhone
            string salonEmail
            object workingHours
            array holidays
            object notifications
            object integrations
            timestamp updatedAt
        }
    end

    subgraph "🔐 Google Tokens Collection"
        GOOGLE_TOKENS {
            string userId PK
            string accessToken
            string refreshToken
            timestamp expiryDate
            string calendarId
            boolean isActive
            timestamp createdAt
            timestamp updatedAt
        }
    end

    subgraph "🔄 Calendar Sync Collection"
        CALENDAR_SYNC {
            string appointmentId PK
            string googleEventId
            string userId FK
            timestamp lastSyncAt
            string syncDirection
            string status
            string errorMessage
        }
    end

    subgraph "📋 Filter Presets Collection"
        FILTER_PRESETS {
            string id PK
            string name
            string userId FK
            object filters
            timestamp createdAt
            timestamp updatedAt
        }
    end

    subgraph "📊 Reports Collection"
        REPORTS {
            string id PK
            string type
            string period
            object data
            timestamp generatedAt
            string generatedBy FK
        }
    end

    %% Relacje między kolekcjami
    APPOINTMENTS ||--o{ CUSTOMERS : "belongsTo"
    APPOINTMENTS ||--o{ SERVICES : "belongsTo"
    APPOINTMENTS ||--o{ EMPLOYEES : "assignedTo"
    APPOINTMENTS ||--o{ NOTIFICATIONS : "triggers"
    APPOINTMENTS ||--|| CALENDAR_SYNC : "syncsWith"
    
    CUSTOMERS ||--o{ NOTIFICATIONS : "relatedTo"
    EMPLOYEES ||--o{ GOOGLE_TOKENS : "hasToken"
    GOOGLE_TOKENS ||--o{ CALENDAR_SYNC : "syncsFor"
    
    SETTINGS ||--o{ REPORTS : "configures"
    CUSTOMERS ||--o{ FILTER_PRESETS : "creates"
    EMPLOYEES ||--o{ FILTER_PRESETS : "creates"
    
    %% Struktura obiektów
    subgraph "Object Structures"
        WORKING_HOURS {
            string day
            string open
            string close
            boolean closed
        }
        
        HOLIDAY {
            string date
            string name
            boolean closed
        }
        
        NOTIFICATION_CONFIG {
            boolean email
            boolean sms
            boolean push
        }
        
        INTEGRATIONS {
            boolean googleCalendar
            string smsProvider
            string emailProvider
        }
        
        PERSONAL_BUFFERS {
            string serviceId
            number bufferMinutes
        }
        
        FILTERS {
            array staffIds
            array serviceIds
            array statusIds
            timestamp dateFrom
            timestamp dateTo
        }
        
        REPORT_DATA {
            number totalAppointments
            number totalRevenue
            array serviceStats
            array staffStats
        }
    end

    %% Indeksy Firestore
    subgraph "Firestore Indexes"
        INDEX_APPOINTMENTS {
            compositeIndex: [start, end]
            compositeIndex: [staffName, start]
            compositeIndex: [clientId, start]
            compositeIndex: [status, start]
            compositeIndex: [googleCalendarEventId]
        }
        
        INDEX_CUSTOMERS {
            compositeIndex: [phone]
            compositeIndex: [email]
            compositeIndex: [blacklisted]
            compositeIndex: [lastVisit]
        }
        
        INDEX_SERVICES {
            compositeIndex: [category]
            compositeIndex: [price]
            compositeIndex: [durationMin]
        }
        
        INDEX_EMPLOYEES {
            compositeIndex: [role]
            compositeIndex: [isActive]
            compositeIndex: [services]
        }
        
        INDEX_NOTIFICATIONS {
            compositeIndex: [userId, read]
            compositeIndex: [type, time]
            compositeIndex: [appointmentId]
        }
        
        INDEX_CALENDAR_SYNC {
            compositeIndex: [userId, status]
            compositeIndex: [lastSyncAt]
            compositeIndex: [googleEventId]
        }
        
        INDEX_FILTER_PRESETS {
            compositeIndex: [userId, name]
            compositeIndex: [createdAt]
        }
        
        INDEX_REPORTS {
            compositeIndex: [type, period]
            compositeIndex: [generatedAt]
            compositeIndex: [generatedBy]
        }
    end

    %% Security Rules
    subgraph "Security Rules"
        SECURITY_APPOINTMENTS {
            read: "authenticated users"
            write: "staff, admin"
            create: "staff, admin"
            update: "staff, admin"
            delete: "staff, admin"
        }
        
        SECURITY_CUSTOMERS {
            read: "authenticated users"
            write: "staff, admin"
            create: "staff, admin"
            update: "staff, admin"
            delete: "admin only"
        }
        
        SECURITY_SERVICES {
            read: "authenticated users"
            write: "admin only"
            create: "admin only"
            update: "admin only"
            delete: "admin only"
        }
        
        SECURITY_EMPLOYEES {
            read: "authenticated users"
            write: "admin only"
            create: "admin only"
            update: "admin only"
            delete: "admin only"
        }
        
        SECURITY_NOTIFICATIONS {
            read: "owner only"
            write: "system, staff, admin"
            create: "system, staff, admin"
            update: "owner only"
            delete: "owner only"
        }
        
        SECURITY_SETTINGS {
            read: "authenticated users"
            write: "admin only"
            create: "admin only"
            update: "admin only"
            delete: "admin only"
        }
        
        SECURITY_GOOGLE_TOKENS {
            read: "owner only"
            write: "owner only"
            create: "owner only"
            update: "owner only"
            delete: "owner only"
        }
        
        SECURITY_CALENDAR_SYNC {
            read: "authenticated users"
            write: "system, staff, admin"
            create: "system, staff, admin"
            update: "system, staff, admin"
            delete: "system, staff, admin"
        }
        
        SECURITY_FILTER_PRESETS {
            read: "owner only"
            write: "owner only"
            create: "owner only"
            update: "owner only"
            delete: "owner only"
        }
        
        SECURITY_REPORTS {
            read: "admin only"
            write: "admin only"
            create: "admin only"
            update: "admin only"
            delete: "admin only"
        }
    end

    %% Region Configuration
    subgraph "Region Settings"
        REGION_CONFIG {
            firestore: "eur3 (europe-west3)"
            functions: "europe-central2"
            storage: "eur3"
            hosting: "eur3"
        }
    end

    %% Data Validation Rules
    subgraph "Validation Rules"
        VALIDATION_APPOINTMENTS {
            start: "must be before end"
            end: "must be after start"
            status: "must be valid status"
            price: "must be non-negative"
            googleCalendarEventId: "optional"
        }
        
        VALIDATION_CUSTOMERS {
            fullName: "required, min 2 chars"
            phone: "required, valid format"
            email: "optional, valid format if provided"
            blacklisted: "boolean"
        }
        
        VALIDATION_SERVICES {
            name: "required, min 2 chars"
            durationMin: "required, positive"
            price: "required, non-negative"
            category: "required"
        }
        
        VALIDATION_EMPLOYEES {
            name: "required, min 2 chars"
            role: "required"
            email: "optional, valid format if provided"
            isActive: "boolean"
        }
        
        VALIDATION_NOTIFICATIONS {
            type: "required"
            title: "required, min 2 chars"
            message: "required, min 2 chars"
            read: "boolean"
        }
    end
```

## Podpis
Model Danych Firestore_NEW - Aktualny stan z Google Calendar i nowymi kolekcjami (2025-10-17)