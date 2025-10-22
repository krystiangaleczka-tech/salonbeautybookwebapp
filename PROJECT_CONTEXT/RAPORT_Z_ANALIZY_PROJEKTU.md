RAPORT Z ANALIZY PROJEKTU SALON BEAUTY MARIO
1. STAN AKTUALNY FIREBASE I KOLEKCJI FIRESTORE
Konfiguracja Firebase:

Projekt: salonbeautymario-x1 (aktywny)
Baza danych Firestore: (default) w regionie eur3 (europe-west3)
Firebase Functions skonfigurowane dla regionu europe-central2
Struktura kolekcji Firestore (zgodnie z dokumentacją):

appointments - wizyty z polami: id, serviceId, clientId, staffName, start, end, status, notes, price, createdAt, updatedAt, googleCalendarEventId
customers - klienci z polami: id, fullName, phone, email, notes, blacklisted, lastVisit, createdAt, updatedAt
services - usługi z polami: id, name, category, durationMin, price, noParallel, bufferAfterMin, tone, description, weeklyBookings, quarterlyBookings, createdAt, updatedAt
employees - pracownicy z polami: id, name, role, email, phone, isActive, services, personalBuffers, defaultBuffer, createdAt, updatedAt
notifications - powiadomienia
settings - ustawienia salonu
googleTokens - tokeny OAuth Google
calendarSync - synchronizacja z Google Calendar
filterPresets - presety filtrów
reports - raporty
2. ANALIZA KOMPONENTÓW KALENDARZA
Główny komponent kalendarza:

Lokalizacja: admin-frontend/src/app/(protected)/kalendarz/page.tsx
Widoki: dzień, tydzień, miesiąc
Funkcjonalności: dodawanie, edycja, usuwanie wizyt, filtrowanie, optymistyczne aktualizacje UI
Kluczowe zależności:

appointments-service.ts - obsługa wizyt w Firestore
employees-service.ts - zarządzanie pracownikami
services-service.ts - zarządzanie usługami
customers-service.ts - zarządzanie klientami
google-calendar-service.ts - integracja z Google Calendar
usePendingTimeChanges.ts - zarządzanie zmianami czasu wizyt
optimistic-updates.ts - optymistyczne aktualizacje UI