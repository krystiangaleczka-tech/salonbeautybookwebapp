# Architektura Systemu Ustawień - Salon Beauty Mario (Aktualny Stan)

```mermaid
graph TB
    subgraph "⚙️ System Ustawień - Główny Komponent"
        SS[Settings Shell]
        SS --> SC[Settings Categories]
        SS --> SF[Settings Forms]
        SS --> SV[Settings Validation]
    end

    subgraph "📂 Kategorie Ustawień"
        subgraph "🏪 Profil Salonu"
            SP[Salon Profile]
            SI[Salon Information]
            SL[Salon Logo]
            SC2[Salon Contact]
        end
        
        subgraph "📅 Kalendarz i Dostępność"
            WH[Working Hours]
            HD[Holidays & Exceptions]
            TB[Time Buffers]
            AV[Availability Settings]
        end
        
        subgraph "👥 Zespół i Role"
            TM[Team Management]
            RL[Role Management]
            EM[Employee Settings]
            PB[Personal Buffers]
        end
        
        subgraph "🔔 Powiadomienia"
            NS[Notification Settings]
            ES[Email Settings]
            SS2[SMS Settings]
            PS[Push Settings]
        end
        
        subgraph "🔐 Bezpieczeństwo i Prywatność"
            AU[Authentication Settings]
            PM[Privacy Settings]
            DL[Data Logs]
            BM[Backup Settings]
        end
        
        subgraph "📊 Integracje Zewnętrzne"
            GC[Google Calendar]
            GP[Payment Providers]
            SM[SMS Providers]
            EM2[Email Providers]
        end
    end

    subgraph "🔄 Przepływ Ustawień"
        subgraph "📥 Wczytywanie Ustawień"
            GL[Get Settings]
            GF[Get from Firestore]
            GV[Get Validation Rules]
            GD[Get Default Values]
        end
        
        subgraph "✅ Walidacja Ustawień"
            VS[Validate Settings]
            VSC[Schema Validation]
            VBC[Business Validation]
            VRC[Rules Validation]
        end
        
        subgraph "💾 Zapisywanie Ustawień"
            US[Update Settings]
            UF[Update in Firestore]
            UT[Update Timestamp]
            UR[Update Related]
        end
        
        subgraph "🔄 Synchronizacja Ustawień"
            SY[Sync Settings]
            SB[Sync to Backend]
            SF[Sync to Frontend]
            SR[Sync to Integrations]
        end
    end

    subgraph "🗄️ Model Danych Ustawień"
        subgraph "📊 Struktura Ustawień"
            SID[settingId: string]
            SVR[settingValue: any]
            SCT[settingCategory: string]
            STP[settingType: string]
        end
        
        subgraph "📋 Metadane Ustawień"
            SLM[settingsLabel: string]
            SDC[settingsDescription: string]
            SDE[settingsDefault: any]
            SRE[settingsRequired: boolean]
        end
        
        subgraph "🔗 Powiązane Ustawienia"
            SDEP[settingsDependencies: array]
            SVAL[settingsValidation: object]
            SOPT[settingsOptions: array]
        end
        
        subgraph "📊 Timestamps"
            SCR[createdAt: Timestamp]
            SUP[updatedAt: Timestamp]
            SLU[lastUpdatedBy: string]
        end
    end

    subgraph "🔌 Serwis Ustawień"
        SS2[SettingsService]
        SS2 --> GS[getSettings]
        SS2 --> US2[updateSettings]
        SS2 --> VS2[validateSettings]
        SS2 --> RS[resetSettings]
        SS2 --> DS[deleteSettings]
    end

    subgraph "🔥 Firebase Integration"
        subgraph "📊 Firestore Operations"
            FC[Collection: settings]
            FR[Real-time Settings Listener]
            FQ[Query: category settings]
            FW[Where: settingCategory]
        end
        
        subgraph "🔐 Security Rules"
            FSR[Firestore Security Rules]
            FUR[User Read Access]
            FUW[Admin Write Access]
            FAD[Admin Delete Access]
        end
    end

    subgraph "📱 Komponenty UI Ustawień"
        subgraph "🎛️ Komponenty Interfejsu"
            SSL[Settings Shell Layout]
            SSC[Settings Sidebar]
            SSC2[Settings Content]
            SST[Settings Tabs]
        end
        
        subgraph "📝 Formularze Ustawień"
            SPF[Settings Profile Form]
            SSW[Settings Working Hours Form]
            SSN[Settings Notifications Form]
            SSI[Settings Integrations Form]
        end
        
        subgraph "🎨 Style i Animacje"
            SSF[Settings Styles]
            SSA[Settings Animations]
            SST2[Settings Transitions]
            SSS[Settings States]
        end
    end

    subgraph "📅 Google Calendar Integration Settings"
        subgraph "🔐 OAuth2 Settings"
            GCA[Google Auth URL]
            GCC[Google Callback Handler]
            GCT[Google Token Storage]
            GCR[Google Token Refresh]
        end
        
        subgraph "🔄 Sync Settings"
            GSS[Sync Settings]
            GSA[Auto Sync]
            GSI[Sync Interval]
            GSR[Sync Retries]
        end
        
        subgraph "📊 Calendar Settings"
            GCC2[Calendar ID]
            GCT2[Calendar Timezone]
            GCD[Calendar Default Duration]
            GCB[Calendar Buffers]
        end
    end

    subgraph "⏰ Bufory Czasowe Ustawień"
        subgraph "🔧 Globalne Bufory"
            GBD[Global Default Buffer]
            GBS[Global Service Buffers]
            GBE[Global Employee Buffers]
        end
        
        subgraph "👤 Personalizowane Bufory"
            EPB[Employee Personal Buffers]
            ESB[Employee Service Buffers]
            ECB[Employee Category Buffers]
        end
        
        subgraph "📊 Logika Buforów"
            BCL[Calculate Buffer Logic]
            BVA[Validate Buffer Logic]
            BAP[Apply Buffer Logic]
        end
    end

    subgraph "📊 Godziny Pracy Ustawień"
        subgraph "📅 Tygodniowy Harmonogram"
            WHM[Monday Hours]
            WHT[Tuesday Hours]
            WHW[Wednesday Hours]
            WHTH[Thursday Hours]
            WHF[Friday Hours]
            WHS[Saturday Hours]
            WHU[Sunday Hours]
        end
        
        subgraph "🎄 Wyjątki i Święta"
            HDL[Holiday List]
            HDE[Holiday Exceptions]
            HDS[Special Days]
            HDC[Custom Closures]
        end
        
        subgraph "⏰ Strefy Czasowe"
            TZ[Timezone Settings]
            TZO[Timezone Offset]
            TZA[Timezone Adjustments]
        end
    end

    subgraph "🎯 Logika Biznesowa Ustawień"
        subgraph "📋 Reguły Ustawień"
            SR[Settings Rules]
            SV[Settings Validation]
            SC3[Settings Constraints]
            SD[Settings Dependencies]
        end
        
        subgraph "🔄 Przepływ Zatwierdzania"
            AP[Approval Process]
            AR[Approval Required]
            AA[Auto Apply]
            AC[Confirmation]
        end
        
        subgraph "📊 Metryki Ustawień"
            SM[Settings Metrics]
            SU[Settings Usage]
            SE[Settings Errors]
            SL[Settings Logs]
        end
    end

    subgraph "🔧 Edytory Ustawień"
        subgraph "📅 Edytor Harmonogramu"
            SE[Schedule Editor]
            SME[Schedule Modal Editor]
            SWT[Schedule Time Editor]
            SWE[Schedule Exception Editor]
        end
        
        subgraph "⏰ Edytor Buforów"
            BE[Buffer Editor]
            BME[Buffer Modal Editor]
            BSE[Buffer Service Editor]
            BEE[Buffer Employee Editor]
        end
        
        subgraph "👥 Edytor Zespołu"
            TE[Team Editor]
            TME[Team Modal Editor]
            TRE[Team Role Editor]
            TEE[Team Employee Editor]
        end
    end

    %% Połączenia między komponentami
    "⚙️ System Ustawień - Główny Komponent" --> "📂 Kategorie Ustawień"
    "📂 Kategorie Ustawień" --> "🔄 Przepływ Ustawień"
    "🔄 Przepływ Ustawień" --> "🗄️ Model Danych Ustawień"
    "🗄️ Model Danych Ustawień" --> "🔌 Serwis Ustawień"
    "🔌 Serwis Ustawień" --> "🔥 Firebase Integration"
    "🔥 Firebase Integration" --> "📱 Komponenty UI Ustawień"
    "📱 Komponenty UI Ustawień" --> "📅 Google Calendar Integration Settings"
    "📅 Google Calendar Integration Settings" --> "⏰ Bufory Czasowe Ustawień"
    "⏰ Bufory Czasowe Ustawień" --> "📊 Godziny Pracy Ustawień"
    "📊 Godziny Pracy Ustawień" --> "🎯 Logika Biznesowa Ustawień"
    "🎯 Logika Biznesowa Ustawień" --> "🔧 Edytory Ustawień"

    %% Szczegółowe połączenia
    "🏪 Profil Salonu" --> "📥 Wczytywanie Ustawień"
    "📅 Kalendarz i Dostępność" --> "📥 Wczytywanie Ustawień"
    "👥 Zespół i Role" --> "📥 Wczytywanie Ustawień"
    "🔔 Powiadomienia" --> "📥 Wczytywanie Ustawień"
    "🔐 Bezpieczeństwo i Prywatność" --> "📥 Wczytywanie Ustawień"
    "📊 Integracje Zewnętrzne" --> "📥 Wczytywanie Ustawień"
    "📥 Wczytywanie Ustawień" --> "✅ Walidacja Ustawień"
    "✅ Walidacja Ustawień" --> "💾 Zapisywanie Ustawień"
    "💾 Zapisywanie Ustawień" --> "🔄 Synchronizacja Ustawień"
    "📊 Struktura Ustawień" --> "📋 Metadane Ustawień"
    "📋 Metadane Ustawień" --> "🔗 Powiązane Ustawienia"
    "🔗 Powiązane Ustawienia" --> "📊 Timestamps"
    "📊 Firestore Operations" --> "🔐 Security Rules"
    "🎛️ Komponenty Interfejsu" --> "📝 Formularze Ustawień"
    "📝 Formularze Ustawień" --> "🎨 Style i Animacje"
    "🔐 OAuth2 Settings" --> "🔄 Sync Settings"
    "🔄 Sync Settings" --> "📊 Calendar Settings"
    "🔧 Globalne Bufory" --> "👤 Personalizowane Bufory"
    "👤 Personalizowane Bufory" --> "📊 Logika Buforów"
    "📅 Tygodniowy Harmonogram" --> "🎄 Wyjątki i Święta"
    "🎄 Wyjątki i Święta" --> "⏰ Strefy Czasowe"
    "📋 Reguły Ustawień" --> "🔄 Przepływ Zatwierdzania"
    "🔄 Przepływ Zatwierdzania" --> "📊 Metryki Ustawień"
    "📅 Edytor Harmonogramu" --> "⏰ Edytor Buforów"
    "⏰ Edytor Buforów" --> "👥 Edytor Zespołu"

    %% Stylowanie
    classDef settings fill:#e8f5e8,stroke:#4caf50,stroke-width:2px
    classDef categories fill:#e3f2fd,stroke:#2196f3,stroke-width:2px
    classDef flow fill:#f3e5f5,stroke:#9c27b0,stroke-width:2px
    classDef data fill:#e1f5fe,stroke:#03a9f4,stroke-width:2px
    classDef services fill:#fff3e0,stroke:#ff9800,stroke-width:2px
    classDef firebase fill:#ffebee,stroke:#f44336,stroke-width:2px
    classDef ui fill:#f1f8e9,stroke:#689f38,stroke-width:2px
    classDef google fill:#e0f2f1,stroke:#009688,stroke-width:2px
    classDef buffers fill:#fff8e1,stroke:#ffc107,stroke-width:2px
    classDef working fill:#fce4ec,stroke:#e91e63,stroke-width:2px
    classDef business fill:#f3e5f5,stroke:#9c27b0,stroke-width:2px
    classDef editors fill:#e8eaf6,stroke:#3f51b5,stroke-width:2px
    
    class "⚙️ System Ustawień - Główny Komponent" settings
    class "📂 Kategorie Ustawień" categories
    class "🔄 Przepływ Ustawień" flow
    class "🗄️ Model Danych Ustawień" data
    class "🔌 Serwis Ustawień" services
    class "🔥 Firebase Integration" firebase
    class "📱 Komponenty UI Ustawień" ui
    class "📅 Google Calendar Integration Settings" google
    class "⏰ Bufory Czasowe Ustawień" buffers
    class "📊 Godziny Pracy Ustawień" working
    class "🎯 Logika Biznesowa Ustawień" business
    class "🔧 Edytory Ustawień" editors
```

## Podpis
Architektura Systemu Ustawień_NEW - Aktualny stan z Google Calendar i buforami czasowymi (2025-10-17)