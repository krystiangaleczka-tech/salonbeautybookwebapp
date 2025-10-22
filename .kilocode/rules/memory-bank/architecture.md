---
updated: 2025-10-22
author: KiloCode AI
version: 1.0
project: Beauty Salon Booking System - Beauty Mario
---

# Architecture - Architektura Systemu

## Przegląd Architektury
System rezerwacji dla małego salonu piękności oparty na architekturze JAMstack z Firebase jako backend. Architektura zaprojektowana z myślą o prostocie, skalowalności i niskich kosztach utrzymania.

## Kluczowe Założenia Architektoniczne
1. **Serverless-first** - Firebase jako managed solution
2. **Real-time by default** - Synchronizacja w czasie rzeczywistym z fallbackiem na static fetch
3. **Mobile-first** - Optymalizacja dla tabletów i urządzeń mobilnych
4. **Progressive enhancement** - Podstawowe funkcje działają bez JavaScript
5. **Security by design** - Ochrona danych na każdym poziomie
6. **Integration-ready** - Przygotowanie na integracje (Google Calendar zaimplementowane)

## Stack Technologiczny

### Frontend
- **Framework**: Next.js 14 z App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: React Context + custom hooks
- **Forms**: React Hook Form z walidacją
- **Animations**: Framer Motion

### Backend
- **Firebase Authentication** - email/password, OAuth2 (Google Calendar)
- **Firestore** (eur3) - NoSQL database z real-time capabilities
- **Cloud Functions** (europe-central2) - Serverless functions dla logiki biznesowej
- **Firebase Hosting** - Hosting dla aplikacji frontend
- **Firebase Storage** - Przechowywanie plików
- **Firebase Analytics** - Analityka i monitorowanie

### Integracje
- **Google Calendar API** - Dwukierunkowa synchronizacja wizyt
- **OAuth2** - Bezpieczna autentykacja z refresh tokens

## Model Danych Firestore

### Collections
salons/{salonId}/
├── appointments/{appointmentId} # Wizyty
├── customers/{customerId} # Klienci
├── services/{serviceId} # Usługi
├── employees/{employeeId} # Pracownicy
├── notifications/{notificationId} # Powiadomienia
├── settings/{settingKey} # Ustawienia
├── googleTokens/{userId} # OAuth2 tokens
text

### Kluczowe Schematy

**Appointment**
interface Appointment {
id: strin
; serviceId: str
ng; clientId: s
ring; staffName:
string; start:
imestamp; end
Timestamp; status: 'confirmed' | 'cancelled'
'completed';
notes?: string
price: number; googleCalen
arEventId?: string;
createdAt: Timestamp;
text

**Employee**
interface Employee {
id: strin
; name: str
ng; role: 'owner' | 'employee' | 'te
ter'; email?:
string; phone
: string; isActi
e: boolean; servi
es: string[]; personalBuffers?: Record<
tring, number>; defa
ltBuffer: number
userId?: string;
createdAt: Timestamp;
text

## Bezpieczeństwo

### Firebase Security Rules
- Role-based access control (RBAC)
- User authentication required dla wszystkich operacji
- Admin-only access dla krytycznych kolekcji (employees, settings)
- User-scoped access dla Google tokens
- Validation rules na poziomie Firestore

### Ochrona Danych
- Szyfrowanie w tranzycie (HTTPS/TLS 1.3)
- Szyfrowanie w spoczynku (Firebase)
- Minimalizacja zbieranych danych osobowych
- Secure token storage (Firestore)
- Limited scopes dla Google Calendar API

## Wydajność

### Optymalizacje Frontend
- Lazy loading komponentów
- Code splitting na poziomie tras
- Dynamiczny import bibliotek
- Minimalizacja bundle size
- Static fetch zamiast realtime listeners (stabilność)

### Optymalizacje Backend
- Indeksy Firestore dla optymalnych zapytań
- Batch operations dla wielu zmian
- Region separation (Firestore eur3, Functions europe-central2)
- Reduced Firestore queries
- Firestore triggers dla background synchronization

### Metryki
- Page load time: < 2s (95th percentile)
- API response time: < 300ms (95th percentile)
- Time to Interactive: < 3s
- First Contentful Paint: < 1.5s

## Deployment

### CI/CD Pipeline
- GitHub Actions dla automatyzacji
- Testy uruchamiane przed każdym wdrożeniem
- Automatyczne wdrożenie na Firebase Hosting
- Environment separation (dev/staging/prod)
- Separate deployment dla frontend i functions

### Monitoring
- Sentry dla monitorowania błędów
- Firebase Analytics dla metryk użytkowania
- Uptime monitoring
- Performance monitoring
- Google Calendar API monitoring

## Ważne Decyzje Architektoniczne

### Dlaczego Firebase?
- Managed solution - zero server maintenance
- Auto-scaling out of the box
- Built-in security rules
- Real-time capabilities
- Excellent mobile SDK
- Predictable pricing

### Dlaczego Next.js?
- Server-side rendering dla SEO
- Automatic code splitting
- Built-in routing
- API routes dla backend logic
- Excellent TypeScript support
- Large ecosystem

### Dlaczego Static Fetch zamiast Realtime Listeners?
- **Stabilność**: Eliminuje infinite loops
- **Kontrola**: Manual refresh daje lepszą kontrolę
- **Koszty**: Mniej Firestore read operations
- **Debugging**: Łatwiejsze debugowanie przepływu danych

### Dlaczego Region Separation?
- **Latency**: eur3 (Firestore) i europe-central2 (Functions) blisko użytkowników
- **Compliance**: GDPR compliance przez lokalizację danych w EU
- **Performance**: Optimal performance dla europejskich użytkowników

## Deployment URL
**Production**: https://salonbeautymario-x1.web.app

## Diagramy
Szczegółowe diagramy architektury znajdują się w:
- `Architektura Wysokiego Poziomu_NEW.md`
- `Architektura Komponentów Kalendarza_NEW.md`
- `Architektura Systemu Powiadomień_NEW.md`
- `Architektura Systemu Ustawień_NEW.md`
- `Przepływ Danych w Systemie_NEW.md`