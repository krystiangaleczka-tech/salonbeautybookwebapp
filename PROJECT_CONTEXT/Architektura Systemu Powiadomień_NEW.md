# Architektura Systemu Powiadomień - Salon Beauty Mario (Aktualny Stan)

```mermaid
graph TB
    subgraph "🔔 System Powiadomień - Główny Komponent"
        NM[NotificationsModal]
        NM --> NI[NotificationItem]
        NM --> NB[NotificationBadge]
        NM --> NC[NotificationCounter]
    end

    subgraph "📡 Źródła Powiadomień"
        subgraph "📅 Wydarzenia Kalendarza"
            AT[Appointment Created]
            AU[Appointment Updated]
            AD[Appointment Deleted]
            AR[Appointment Reminder]
        end
        
        subgraph "👤 Zdarzenia Użytkowników"
            UL[User Login]
            ULG[User Logout]
            UR[User Role Change]
            UE[Employee Created]
            UE2[Employee Updated]
            UA[Admin Auto-creation]
        end
        
        subgraph "⚙️ Zdarzenia Systemowe"
            SE[System Error]
            SC[System Config Change]
            SB[System Backup]
        end
        
        subgraph "📅 Google Calendar Sync"
            GCS[Google Calendar Synced]
            GCE[Google Calendar Error]
            GCR[Google Calendar Retry]
            GCA[Google Calendar Auth Required]
            GCB[Google Calendar Batch Sync]
        end
    end

    subgraph "🔄 Przepływ Powiadomień"
        subgraph "📥 Tworzenie Powiadomień"
            CT[Create Notification]
            CV[Validate Notification]
            CP[Prepare Notification]
        end
        
        subgraph "📤 Dostarczanie Powiadomień"
            SD[Send Notification]
            SR[Store Notification]
            SU[Update Notification]
        end
        
        subgraph "📖 Odczyt Powiadomień"
            GF[Get Notifications]
            GM[Mark as Read]
            GA[Mark All as Read]
        end
    end

    subgraph "🗄️ Model Danych Powiadomień"
        subgraph "📊 Struktura Powiadomienia"
            ID[id: string]
            TP[type: string]
            TT[title: string]
            MSG[message: string]
            TM[time: Timestamp]
            RD[read: boolean]
            UI[userId: string]
        end
        
        subgraph "🔗 Powiązane Dane"
            CID[customerId: string]
            CNAME[customerName: string]
            AID[appointmentId: string]
            ATIME[appointmentTime: Timestamp]
        end
        
        subgraph "📋 Metadane"
            CRT[createdAt: Timestamp]
            UPT[updatedAt: Timestamp]
            ERR[errorMessage: string]
        end
    end

    subgraph "🔌 Serwis Powiadomień"
        NS[NotificationsService]
        NS --> GN[getNotifications]
        NS --> CN[createNotification]
        NS --> MN[markAsRead]
        NS --> MA[markAllAsRead]
        NS --> SN[subscribeToNotifications]
    end

    subgraph "🔥 Firebase Integration"
        subgraph "📊 Firestore Operations"
            FC[Collection: notifications]
            FR[Real-time Listener]
            FQ[Query: user notifications]
            FW[Where: userId]
        end
        
        subgraph "🔐 Security Rules"
            FSR[Firestore Security Rules]
            FUR[User Read Access]
            FUW[User Write Access]
            FAD[Admin Access]
        end
    end

    subgraph "📱 Komponenty UI Powiadomień"
        subgraph "🎛️ Komponenty Interfejsu"
            NML[NotificationsModal]
            NIL[NotificationsList]
            NIT[NotificationItem]
            NIB[NotificationBadge]
            NBT[NotificationButton]
        end
        
        subgraph "🎨 Style i Animacje"
            NSF[Notification Styles]
            NSA[Notification Animations]
            NST[Notification Transitions]
            NSS[Notification States]
        end
        
        subgraph "♿ Dostępność Powiadomień"
            NKA[Keyboard Access]
            NSA2[Screen Reader]
            NHC[High Contrast]
        end
    end

    subgraph "⚡ Real-time Updates"
        subgraph "🔄 Real-time Listeners"
            RTL[Real-time Listener]
            RTL_U[User Notifications]
            RTL_A[Admin Notifications]
            RTL_S[System Notifications]
        end
        
        subgraph "📡 Subskrypcje Powiadomień"
            SUB[Subscribe to Notifications]
            UNSUB[Unsubscribe from Notifications]
            REF[Refresh Notifications]
        end
        
        subgraph "🔄 Synchronizacja"
            SYNC[Sync Notifications]
            BATCH[Batch Operations]
            OPT[Optimistic Updates]
        end
    end

    subgraph "📊 Typy Powiadomień"
        subgraph "📅 Powiadomienia o Wizytach"
            NA[Appointment Notifications]
            NR[Reminder Notifications]
            NC[Cancelation Notifications]
            NC2[Confirmation Notifications]
        end
        
        subgraph "👤 Powiadomienia Użytkowników"
            NU[User Notifications]
            NL[Login Notifications]
            NR2[Role Notifications]
        end
        
        subgraph "⚙️ Powiadomienia Systemowe"
            NS2[System Notifications]
            NE[Error Notifications]
            NW[Warning Notifications]
            NI[Info Notifications]
        end
        
        subgraph "📅 Google Calendar"
            NGC[Google Calendar Notifications]
            NGS[Sync Notifications]
            NGE[Error Notifications]
        end
    end

    subgraph "🎯 Logika Biznesowa Powiadomień"
        subgraph "⏰ Wyzwalacze Czasowe"
            TR[Time Triggers]
            SCH[Schedule Triggers]
            REM[Reminder Triggers]
            CRON[Cron Jobs]
        end
        
        subgraph "📋 Reguły Powiadomień"
            NRR[Notification Rules]
            NRP[Notification Priorities]
            NRF[Notification Filters]
            NRA[Notification Aggregation]
        end
        
        subgraph "📊 Metryki Powiadomień"
            NM[Notification Metrics]
            NCT[Click Through Rates]
            NRO[Read Rates]
            NRT[Response Times]
        end
    end

    subgraph "🔧 Integracje Zewnętrzne"
        subgraph "📧 Email Notifications"
            ES[Email Service]
            ET[Email Templates]
            ED[Email Delivery]
        end
        
        subgraph "📱 SMS Notifications"
            SS[SMS Service]
            ST[SMS Templates]
            SD[SMS Delivery]
        end
        
        subgraph "📱 Push Notifications"
            PS[Push Service]
            PT[Push Templates]
            PD[Push Delivery]
        end
    end

    %% Połączenia między komponentami
    "🔔 System Powiadomień - Główny Komponent" --> "📡 Źródła Powiadomień"
    "📡 Źródła Powiadomień" --> "🔄 Przepływ Powiadomień"
    "🔄 Przepływ Powiadomień" --> "🗄️ Model Danych Powiadomień"
    "🗄️ Model Danych Powiadomień" --> "🔌 Serwis Powiadomień"
    "🔌 Serwis Powiadomień" --> "🔥 Firebase Integration"
    "🔥 Firebase Integration" --> "📱 Komponenty UI Powiadomień"
    "📱 Komponenty UI Powiadomień" --> "⚡ Real-time Updates"
    "⚡ Real-time Updates" --> "📊 Typy Powiadomień"
    "📊 Typy Powiadomień" --> "🎯 Logika Biznesowa Powiadomień"
    "🎯 Logika Biznesowa Powiadomień" --> "🔧 Integracje Zewnętrzne"

    %% Szczegółowe połączenia
    "📅 Wydarzenia Kalendarza" --> "📥 Tworzenie Powiadomień"
    "👤 Zdarzenia Użytkowników" --> "📥 Tworzenie Powiadomień"
    "⚙️ Zdarzenia Systemowe" --> "📥 Tworzenie Powiadomień"
    "📅 Google Calendar Sync" --> "📥 Tworzenie Powiadomień"
    "📤 Dostarczanie Powiadomień" --> "📖 Odczyt Powiadomień"
    "📊 Struktura Powiadomienia" --> "🔗 Powiązane Dane"
    "🔗 Powiązane Dane" --> "📋 Metadane"
    "📊 Firestore Operations" --> "🔐 Security Rules"
    "🎛️ Komponenty Interfejsu" --> "🎨 Style i Animacje"
    "🎨 Style i Animacje" --> "♿ Dostępność Powiadomień"
    "🔄 Real-time Listeners" --> "📡 Subskrypcje Powiadomień"
    "📡 Subskrypcje Powiadomień" --> "🔄 Synchronizacja"
    "⏰ Wyzwalacze Czasowe" --> "📋 Reguły Powiadomień"
    "📋 Reguły Powiadomień" --> "📊 Metryki Powiadomień"

    %% Stylowanie
    classDef notifications fill:#fff3e0,stroke:#ff9800,stroke-width:2px
    classDef sources fill:#e3f2fd,stroke:#2196f3,stroke-width:2px
    classDef flow fill:#e8f5e8,stroke:#4caf50,stroke-width:2px
    classDef data fill:#f3e5f5,stroke:#9c27b0,stroke-width:2px
    classDef services fill:#e1f5fe,stroke:#03a9f4,stroke-width:2px
    classDef firebase fill:#ffebee,stroke:#f44336,stroke-width:2px
    classDef ui fill:#f1f8e9,stroke:#689f38,stroke-width:2px
    classDef realtime fill:#fce4ec,stroke:#e91e63,stroke-width:2px
    classDef types fill:#e0f2f1,stroke:#009688,stroke-width:2px
    classDef business fill:#fff8e1,stroke:#ffc107,stroke-width:2px
    classDef integrations fill:#f3e5f5,stroke:#9c27b0,stroke-width:2px
    
    class "🔔 System Powiadomień - Główny Komponent" notifications
    class "📡 Źródła Powiadomień" sources
    class "🔄 Przepływ Powiadomień" flow
    class "🗄️ Model Danych Powiadomień" data
    class "🔌 Serwis Powiadomień" services
    class "🔥 Firebase Integration" firebase
    class "📱 Komponenty UI Powiadomień" ui
    class "⚡ Real-time Updates" realtime
    class "📊 Typy Powiadomień" types
    class "🎯 Logika Biznesowa Powiadomień" business
    class "🔧 Integracje Zewnętrzne" integrations
```

## Podpis
Architektura Systemu Powiadomień_NEW - Aktualny stan z Google Calendar i real-time updates (2025-10-17)