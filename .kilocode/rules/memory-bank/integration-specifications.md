---
updated: 2025-10-22
author: KiloCode AI
version: 1.0
project: Beauty Salon Booking System - Beauty Mario
---

# Integration Specifications - Specyfikacje Integracji

## Google Calendar Integration

### Przegląd
Dwukierunkowa synchronizacja wizyt między systemem Beauty Mario a Google Calendar pracowników. Każdy pracownik ma osobisty kalendarz połączony przez OAuth2.

### OAuth2 Flow

#### Authentication
// 1. User initiates OAuth2 flow
const authUrl = googleCalendarService.getAuthUrl();
// 2. Handle OAuth2 callback
const { code } = req.query;
const toke
// 3. Store tokens in Firestore
aw
text

#### Token Storage
interface GoogleTokens {
userId: strin
; accessToken: str
ng; refreshToken: s
ring; expiryDate:
number; scope:
string[]; createdAt
Timestamp; updated
// Collection: googleTokens/{userId}
text

#### Token Refresh
- Automatyczne odświeżanie przed expiry
- Refresh 5 minut przed wygaśnięciem
- Retry logic z exponential backoff

### Synchronization Strategy

#### Create Appointment
User creates appointment in UI
Save to Firestore first (appointments collection)
Firestore trigger fires
Background Cloud Function syncs to Google Calendar
Store googleCalendarEventId in appointment
Update calendarSync collection with sync status
text

#### Update Appointment
User updates appointment
Update Firestore (preserve googleCalendarEventId)
Firestore trigger fires
Background sync updates Google Calendar event
Update calendarSync status
text

#### Delete Appointment
User deletes appointment
Soft delete in Firestore (status: 'cancelled')
Firestore trigger fires
Background sync deletes Google Calendar event
Update calendarSync status
text

### Sync Status Tracking

#### CalendarSync Collection
interface CalendarSync {
appointmentId: strin
; googleCalendarEventId: str
ng; lastSyncAt: Time
tamp; syncStatus: 'synced' | 'pending' |
error'; errorMessage
: string; retryCo
nt: number; nextRetryA
text

### Error Handling

#### Sync Failures
- Retry up to 3 times with exponential backoff
- Log errors to Firestore for debugging
- Notification to admin if sync fails repeatedly
- Manual sync option in UI

#### Token Expiry
- Automatic token refresh before operations
- Graceful degradation if refresh fails
- User notification to re-authenticate

### API Limits & Rate Limiting

#### Google Calendar API Quotas
- 1,000,000 requests/day
- 100 requests/100 seconds per user
- Batch operations for bulk sync

#### Rate Limiting Strategy
- Batch sync every 5 minutes
- Queue system for high-volume operations
- Prioritize user-initiated syncs

### Security Considerations

#### Token Protection
- Tokens stored in Firestore with user-scoped security rules
- No tokens exposed to frontend
- All sync operations through Cloud Functions

#### Scope Limitations
- Minimal scopes requested: `calendar.events`
- No access to other Google services
- User can revoke access anytime

## Future Integrations (Planned)

### SMS Notifications
- **Provider**: Twilio / MessageBird
- **Use Cases**: Appointment reminders, confirmations
- **Implementation**: Cloud Functions trigger on appointment creation

### Email Notifications
- **Provider**: SendGrid / Firebase Extensions
- **Use Cases**: Booking confirmations, receipts
- **Implementation**: Email templates + Cloud Functions

### Payment Gateway
- **Provider**: Stripe / PayPal
- **Use Cases**: Online payments, deposits
- **Implementation**: Stripe Checkout integration

### Analytics
- **Provider**: Google Analytics 4
- **Use Cases**: User behavior, conversion tracking
- **Status**: Partially implemented (Firebase Analytics active)