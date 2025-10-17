# Architektura Komponentów Kalendarza - Salon Beauty Mario (Aktualny Stan)

```mermaid
graph TB
    subgraph "📅 Kalendarz - Główna Strona"
        CP[CalendarPage]
        CP --> CS[Calendar Services]
        CP --> CT[Calendar Title]
        CP --> CD[Calendar Date]
    end

    subgraph "🎛️ Komponenty Interfejsu Kalendarza"
        subgraph "📊 Widoki Kalendarza"
            WB[WeekBoard]
            DB[DayBoard]
            MB[MonthBoard]
            DA[DayAgenda]
        end
        
        subgraph "🔧 Narzędzia Kalendarza"
            VS[ViewSwitcher]
            TB[CalendarToolbar]
            AF[AppointmentFilters]
        end
        
        subgraph "📝 Komponenty Edycji"
            QC[QuickEdit]
            TA[TimeAdjustment]
            EC[EditModal]
            AC[AppointmentModal]
        end
    end

    subgraph "⚙️ Zarządzanie Stanem"
        subgraph "🔄 Hooki Stanu"
            UC[useCalendar]
            UF[useFilters]
            UP[usePendingTimeChanges]
            UE[useEvents]
        end
        
        subgraph "📦 Konteksty"
            ACX[AuthContext]
            TCX[ThemeContext]
            NCX[NotificationsContext]
        end
    end

    subgraph "🔌 Serwisy Kalendarza"
        AS[AppointmentService]
        CS[CustomerService]
        ES[EmployeeService]
        SS[ServiceService]
        FS[FilterService]
        GS[GoogleCalendarService]
    end

    subgraph "🔥 Firebase Integration"
        subgraph "📊 Firestore Operations"
            GA[getAppointments]
            SA[subscribeToAppointments]
            CA[createAppointment]
            UA[updateAppointment]
            DA[deleteAppointment]
        end
        
        subgraph "📅 Google Calendar Sync"
            GCS[syncAppointmentToGoogle]
            GCU[updateGoogleCalendarEvent]
            GCD[deleteGoogleCalendarEvent]
            GCB[batchSyncAppointments]
        end
    end

    subgraph "🔄 Przepływ Danych Kalendarza"
        subgraph "📥 Wczytywanie Danych"
            LD[loadAppointments]
            LE[loadEmployees]
            LC[loadCustomers]
            LS[loadServices]
        end
        
        subgraph "📤 Aktualizacje Danych"
            UC[commitTimeChange]
            US[handleSaveEdit]
            UD[handleDelete]
            UA[handleAddAppointment]
        end
        
        subgraph "🔄 Odświeżanie UI"
            RU[refreshCalendar]
            RF[refreshFilters]
            RN[refreshNotifications]
        end
    end

    subgraph "🎨 Renderowanie Kalendarza"
        subgraph "📅 Obliczenia Dat"
            SW[startOfWeek]
            AD[addDays]
            AM[addMonths]
            RD[rangeDates]
        end
        
        subgraph "📊 Pozycjonowanie Wydarzeń"
            BE[buildEventsForRange]
            HP[horizontalPositions]
            VP[verticalPositions]
            PO[positionedEvents]
        end
        
        subgraph "⏰ Godziny Pracy"
            WH[workingHours]
            WW[workingWindows]
            WT[workingTimeSlots]
        end
    end

    subgraph "🎯 Walidacja i Logika Biznesowa"
        subgraph "✅ Sprawdzanie Konfliktów"
            CC[checkConflicts]
            VC[validateConflicts]
            FC[findConflictingAppointments]
        end
        
        subgraph "⏱️ Bufory Czasowe"
            CB[calculateBuffers]
            EB[effectiveBufferTime]
            PB[personalBuffers]
        end
        
        subgraph "📋 Statusy Wizyt"
            AS[appointmentStatuses]
            SC[statusChange]
            UC[updateStatus]
        end
    end

    subgraph "📱 Responsywność i Interakcje"
        subgraph "🖱️ Interakcje Użytkownika"
            DD[dragAndDrop]
            RC[resizeEvents]
            SC[scrollCalendar]
            ZC[zoomCalendar]
        end
        
        subgraph "📱 Adaptacja UI"
            MR[mobileResponsive]
            TR[tabletResponsive]
            DR[desktopResponsive]
        end
        
        subgraph "♿ Dostępność"
            KB[keyboardNavigation]
            SR[screenReader]
            TC[highContrast]
        end
    end

    %% Połączenia między komponentami
    "📅 Kalendarz - Główna Strona" --> "🎛️ Komponenty Interfejsu Kalendarza"
    "🎛️ Komponenty Interfejsu Kalendarza" --> "⚙️ Zarządzanie Stanem"
    "⚙️ Zarządzanie Stanem" --> "🔌 Serwisy Kalendarza"
    "🔌 Serwisy Kalendarza" --> "🔥 Firebase Integration"
    "🔥 Firebase Integration" --> "🔄 Przepływ Danych Kalendarza"
    "🔄 Przepływ Danych Kalendarza" --> "🎨 Renderowanie Kalendarza"
    "🎨 Renderowanie Kalendarza" --> "🎯 Walidacja i Logika Biznesowa"
    "🎯 Walidacja i Logika Biznesowa" --> "📱 Responsywność i Interakcje"

    %% Szczegółowe połączenia
    "📊 Widoki Kalendarza" --> "📨 Komponenty Edycji"
    "🔧 Narzędzia Kalendarza" --> "📊 Widoki Kalendarza"
    "🔄 Hooki Stanu" --> "📦 Konteksty"
    "📊 Firestore Operations" --> "📅 Google Calendar Sync"
    "📥 Wczytywanie Danych" --> "📤 Aktualizacje Danych"
    "📤 Aktualizacje Danych" --> "🔄 Odświeżanie UI"
    "📅 Obliczenia Dat" --> "📊 Pozycjonowanie Wydarzeń"
    "📊 Pozycjonowanie Wydarzeń" --> "⏰ Godziny Pracy"
    "✅ Sprawdzanie Konfliktów" --> "⏱️ Bufory Czasowe"
    "⏱️ Bufory Czasowe" --> "📋 Statusy Wizyt"
    "🖱️ Interakcje Użytkownika" --> "📱 Adaptacja UI"
    "📱 Adaptacja UI" --> "♿ Dostępność"

    %% Stylowanie
    classDef calendar fill:#f3e5f5,stroke:#9c27b0,stroke-width:2px
    classDef ui fill:#e3f2fd,stroke:#2196f3,stroke-width:2px
    classDef state fill:#e8f5e8,stroke:#4caf50,stroke-width:2px
    classDef services fill:#fff3e0,stroke:#ff9800,stroke-width:2px
    classDef firebase fill:#ffebee,stroke:#f44336,stroke-width:2px
    classDef dataflow fill:#fce4ec,stroke:#e91e63,stroke-width:2px
    classDef rendering fill:#e1f5fe,stroke:#03a9f4,stroke-width:2px
    classDef validation fill:#f1f8e9,stroke:#689f38,stroke-width:2px
    classDef responsive fill:#e0f2f1,stroke:#009688,stroke-width:2px
    
    class "📅 Kalendarz - Główna Strona" calendar
    class "🎛️ Komponenty Interfejsu Kalendarza" ui
    class "⚙️ Zarządzanie Stanem" state
    class "🔌 Serwisy Kalendarza" services
    class "🔥 Firebase Integration" firebase
    class "🔄 Przepływ Danych Kalendarza" dataflow
    class "🎨 Renderowanie Kalendarza" rendering
    class "🎯 Walidacja i Logika Biznesowa" validation
    class "📱 Responsywność i Interakcje" responsive
```

## Podpis
Architektura Komponentów Kalendarza_NEW - Aktualny stan z Google Calendar i poprawkami stabilności (2025-10-17)