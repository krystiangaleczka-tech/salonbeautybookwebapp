# Przepływ Danych w Systemie - Salon Beauty Mario (Aktualny Stan)

```mermaid
graph TB
    subgraph "🔄 Proces Logowania"
        LF1[User (Admin/Staff)]
        LF2[Login (Email/Password)]
        LF3[Authenticate User]
        LF4[Login Success]
        LF5[Login Failure]
        
        LF1 --> LF2
        LF2 --> LF3
        LF3 --> LF4
        LF3 --> LF5
    end

    subgraph "📅 Proces Tworzenia Wizyty"
        AF1[Create Appointment]
        AF2[Validate Appointment Data]
        AF3[Check Time Conflicts]
        AF4[Conflict Status]
        AF5[Save Appointment]
        AF6[Appointment ID]
        AF7[Success Response]
        AF8[Google Calendar Sync]
        AF9[Frontend Refresh]
        
        AF1 --> AF2
        AF2 --> AF3
        AF3 --> AF4
        AF4 --> AF5
        AF5 --> AF6
        AF6 --> AF7
        AF6 --> AF8
        AF8 --> AF9
    end

    subgraph "🔄 Proces Edycji Wizyty"
        EF1[Edit Appointment]
        EF2[Load Appointment Data]
        EF3[Update Appointment Data]
        EF4[Validate Changes]
        EF5[Check Time Conflicts]
        EF6[Save Changes]
        EF7[Update Google Calendar]
        EF8[Frontend Refresh]
        
        EF1 --> EF2
        EF2 --> EF3
        EF3 --> EF4
        EF4 --> EF5
        EF5 --> EF6
        EF6 --> EF7
        EF7 --> EF8
    end

    subgraph "🗑️ Proces Usuwania Wizyty"
        DF1[Delete Appointment]
        DF2[Confirm Deletion]
        DF3[Delete from Firestore]
        DF4[Delete from Google Calendar]
        DF5[Frontend Refresh]
        
        DF1 --> DF2
        DF2 --> DF3
        DF3 --> DF4
        DF4 --> DF5
    end

    subgraph "🔄 Aktualizacje w Czasie Rzeczywistym"
        RT1[Static Fetch (getAppointments)]
        RT2[Manual Refresh]
        RT3[Calendar View Update]
        RT4[UI State Update]
        RT5[Notification Display]
        
        RT1 --> RT2
        RT2 --> RT3
        RT3 --> RT4
        RT4 --> RT5
    end

    subgraph "📅 Google Calendar Sync Flow"
        subgraph "🔐 OAuth2 Authentication"
            GCA1[Get Auth URL]
            GCA2[User Authorization]
            GCA3[Handle Callback]
            GCA4[Store Tokens]
            GCA5[Token Refresh]
        end
        
        subgraph "🔄 Synchronization Operations"
            GCS1[Create Google Event]
            GCS2[Update Google Event]
            GCS3[Delete Google Event]
            GCS4[Batch Sync]
            GCS5[Error Handling]
        end
        
        subgraph "📊 Sync Status"
            GSS1[Sync Success]
            GSS2[Sync Error]
            GSS3[Sync Retry]
            GSS4[Sync Status Display]
        end
        
        GCA1 --> GCA2
        GCA2 --> GCA3
        GCA3 --> GCA4
        GCA4 --> GCA5
        
        GCS1 --> GSS1
        GCS2 --> GSS1
        GCS3 --> GSS1
        GCS4 --> GSS1
        GCS1 --> GSS2
        GCS2 --> GSS2
        GCS3 --> GSS2
        GCS4 --> GSS2
        GSS2 --> GCS5
        GCS5 --> GCS3
        GSS1 --> GSS4
        GSS2 --> GSS4
        GSS3 --> GSS4
    end

    subgraph "🔥 Firestore Data Flow"
        subgraph "📥 Read Operations"
            FR1[Get Appointments]
            FR2[Get Customers]
            FR3[Get Services]
            FR4[Get Employees]
            FR5[Get Settings]
        end
        
        subgraph "📤 Write Operations"
            FW1[Create Document]
            FW2[Update Document]
            FW3[Delete Document]
            FW4[Batch Operations]
        end
        
        subgraph "🔄 Real-time Updates"
            FRL[Real-time Listener]
            FRU[Update UI]
            FRN[Notification]
        end
        
        FR1 --> FRL
        FR2 --> FRL
        FR3 --> FRL
        FR4 --> FRL
        FR5 --> FRL
        FRL --> FRU
        FRU --> FRN
        
        FW1 --> FRU
        FW2 --> FRU
        FW3 --> FRU
        FW4 --> FRU
    end

    subgraph "📱 Frontend State Management"
        subgraph "🔄 State Updates"
            FSU[useState Updates]
            FCU[useContext Updates]
            FHR[Hook Results]
            FRU2[Re-render Trigger]
        end
        
        subgraph "📊 Data Flow"
            FDF[Data Fetch]
            FDT[Data Transform]
            FDV[Data Validation]
            FDS[Data Store]
        end
        
        subgraph "🎨 UI Updates"
            FUR[UI Re-render]
            FUP[UI Props]
            FUS[UI State]
            FUE[UI Effects]
        end
        
        FSU --> FCU
        FCU --> FHR
        FHR --> FRU2
        FRU2 --> FUR
        
        FDF --> FDT
        FDT --> FDV
        FDV --> FDS
        FDS --> FUP
        FUP --> FUS
        FUS --> FUE
        FUE --> FUR
    end

    subgraph "🔄 Error Handling Flow"
        subgraph "🚨 Error Detection"
            EDD[Error Detection]
            EDC[Error Classification]
            EDL[Error Logging]
            EDR[Error Reporting]
        end
        
        subgraph "🔄 Error Recovery"
            ERR[Error Recovery]
            ERA[Automatic Retry]
            ERF[Manual Retry]
            ERU[User Notification]
        end
        
        subgraph "📊 Error Metrics"
            EMS[Error Metrics]
            EMC[Error Count]
            EMF[Error Frequency]
            EMR[Error Resolution]
        end
        
        EDD --> EDC
        EDC --> EDL
        EDL --> EDR
        
        EDR --> ERR
        ERR --> ERA
        ERA --> ERF
        ERF --> ERU
        
        ERU --> EMS
        EMS --> EMC
        EMC --> EMF
        EMF --> EMR
    end

    subgraph "🔐 Authentication Flow"
        subgraph "🔑 Login Process"
            AL1[Email/Password Input]
            AL2[Form Validation]
            AL3[Firebase Auth]
            AL4[Token Generation]
            AL5[Session Storage]
        end
        
        subgraph "🔄 Session Management"
            ASM[Session Monitoring]
            ASR[Token Refresh]
            ASE[Session Expiration]
            ASL[Logout Process]
        end
        
        subgraph "🎭 Role Management"
            ARM[Role Assignment]
            ARV[Role Verification]
            ARP[Permission Check]
            ARU[User Access]
        end
        
        AL1 --> AL2
        AL2 --> AL3
        AL3 --> AL4
        AL4 --> AL5
        
        AL5 --> ASM
        ASM --> ASR
        ASR --> ASE
        ASE --> ASL
        
        ASL --> ARM
        ARM --> ARV
        ARV --> ARP
        ARP --> ARU
    end

    subgraph "📊 Performance Optimization Flow"
        subgraph "⚡ Data Optimization"
            PO1[Query Optimization]
            PO2[Index Usage]
            PO3[Batch Operations]
            PO4[Caching Strategy]
        end
        
        subgraph "🎨 UI Optimization"
            PO5[Lazy Loading]
            PO6[Code Splitting]
            PO7[Image Optimization]
            PO8[Animation Optimization]
        end
        
        subgraph "📊 Performance Metrics"
            PO9[Load Time]
            PO10[Render Time]
            PO11[Interaction Time]
            PO12[Error Rate]
        end
        
        PO1 --> PO2
        PO2 --> PO3
        PO3 --> PO4
        
        PO5 --> PO6
        PO6 --> PO7
        PO7 --> PO8
        
        PO4 --> PO9
        PO8 --> PO10
        PO10 --> PO11
        PO11 --> PO12
    end

    %% Połączenia między procesami
    "🔄 Proces Logowania" --> "📅 Proces Tworzenia Wizyty"
    "📅 Proces Tworzenia Wizyty" --> "🔄 Proces Edycji Wizyty"
    "🔄 Proces Edycji Wizyty" --> "🗑️ Proces Usuwania Wizyty"
    "🗑️ Proces Usuwania Wizyty" --> "🔄 Aktualizacje w Czasie Rzeczywistym"
    "🔄 Aktualizacje w Czasie Rzeczywistym" --> "📅 Google Calendar Sync Flow"
    "📅 Google Calendar Sync Flow" --> "🔥 Firestore Data Flow"
    "🔥 Firestore Data Flow" --> "📱 Frontend State Management"
    "📱 Frontend State Management" --> "🔄 Error Handling Flow"
    "🔄 Error Handling Flow" --> "🔐 Authentication Flow"
    "🔐 Authentication Flow" --> "📊 Performance Optimization Flow"

    %% Szczegółowe połączenia
    "🔄 Proces Logowania" --> "🔐 Authentication Flow"
    "📅 Proces Tworzenia Wizyty" --> "📅 Google Calendar Sync Flow"
    "🔄 Proces Edycji Wizyty" --> "📅 Google Calendar Sync Flow"
    "🗑️ Proces Usuwania Wizyty" --> "📅 Google Calendar Sync Flow"
    "🔄 Aktualizacje w Czasie Rzeczywistym" --> "🔥 Firestore Data Flow"
    "📅 Google Calendar Sync Flow" --> "🔄 Error Handling Flow"
    "🔥 Firestore Data Flow" --> "🔄 Error Handling Flow"
    "📱 Frontend State Management" --> "📊 Performance Optimization Flow"

    %% Stylowanie
    classDef login fill:#e3f2fd,stroke:#2196f3,stroke-width:2px
    classDef appointment fill:#f3e5f5,stroke:#9c27b0,stroke-width:2px
    classDef edit fill:#e8f5e8,stroke:#4caf50,stroke-width:2px
    classDef delete fill:#ffebee,stroke:#f44336,stroke-width:2px
    classDef realtime fill:#fff3e0,stroke:#ff9800,stroke-width:2px
    classDef google fill:#e1f5fe,stroke:#03a9f4,stroke-width:2px
    classDef firestore fill:#fce4ec,stroke:#e91e63,stroke-width:2px
    classDef frontend fill:#f1f8e9,stroke:#689f38,stroke-width:2px
    classDef error fill:#fff8e1,stroke:#ffc107,stroke-width:2px
    classDef auth fill:#e0f2f1,stroke:#009688,stroke-width:2px
    classDef performance fill:#f3e5f5,stroke:#9c27b0,stroke-width:2px
    
    class "🔄 Proces Logowania" login
    class "📅 Proces Tworzenia Wizyty" appointment
    class "🔄 Proces Edycji Wizyty" edit
    class "🗑️ Proces Usuwania Wizyty" delete
    class "🔄 Aktualizacje w Czasie Rzeczywistym" realtime
    class "📅 Google Calendar Sync Flow" google
    class "🔥 Firestore Data Flow" firestore
    class "📱 Frontend State Management" frontend
    class "🔄 Error Handling Flow" error
    class "🔐 Authentication Flow" auth
    class "📊 Performance Optimization Flow" performance
```

## Podpis
Przepływ Danych w Systemie_NEW - Aktualny stan z Google Calendar i poprawkami stabilności (2025-10-17)