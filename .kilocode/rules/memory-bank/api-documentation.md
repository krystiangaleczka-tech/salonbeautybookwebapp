---
updated: 2025-10-22
author: KiloCode AI
version: 1.0
project: Beauty Salon Booking System - Beauty Mario
---

# API Documentation - Dokumentacja API

## Firestore Service Layer

### Appointments Service

#### getAppointments()
/**
Fetch all appointments with optional filters
@param filters - Optional filters (date range, staff, status)
@returns Promise<Appointment[]>
*/
async function getAppointments(
filters?: AppointmentFilters
): Promise<Appointment[]>
// Example usage:
const appointments = await getAppointments({
startDate: new Date('2025-10-22'),
endDate: new Date('2025-10-29'),
staffName: 'Mario',
status: 'confirmed'
});
text

#### createAppointment()
/**
Create new appointment with conflict detection
@param data - Appointment data
@returns Promise<string> - New appointment ID
@throws Error if time conflict detected
*/
async function createAppointment(
data: CreateAppointmentDTO
): Promise<string>
// Example:
const appointmentId = await createAppointment({
serviceId: 'service-123',
clientId: 'client-456',
staffName: 'Mario',
start: new Date('2025-10-22T14:00:00'),
end: new Date('2025-10-22T15:00:00'),
status: 'confirmed',
price: 100
});
text

#### updateAppointment()
/**
Update existing appointment
IMPORTANT: Preserves googleCalendarEventId
@param id - Appointment ID
@param data - Updated data
@returns Promise<void>
*/
async function updateAppointment(
id: string,
data: Partial<Appointment>
): Promise<void>
text

#### deleteAppointment()
/**
Soft delete appointment (sets status to 'cancelled')
@param id - Appointment ID
@returns Promise<void>
*/
async function deleteAppointment(id: string): Promise<void>
text

### Customers Service

#### getCustomers()
/**
Fetch all customers
@returns Promise<Customer[]>
*/
async function getCustomers(): Promise<Customer[]>
text

#### createCustomer()
/**
Create new customer
@param data - Customer data
@returns Promise<string> - New customer ID
*/
async function createCustomer(
data: CreateCustomerDTO
): Promise<string>
text

#### searchCustomers()
/**
Search customers by name, phone, or email
@param query - Search query
@returns Promise<Customer[]>
*/
async function searchCustomers(query: string): Promise<Customer[]>
text

### Services Service

#### getServices()
/**
Fetch all services
@returns Promise<Service[]>
*/
async function getServices(): Promise<Service[]>
text

#### createService()
/**
Create new service with buffer configuration
@param data - Service data
@returns Promise<string> - New service ID
*/
async function createService(
data: CreateServiceDTO
): Promise<string>
text

### Employees Service

#### getEmployees()
/**
Fetch all employees
@returns Promise<Employee[]>
*/
async function getEmployees(): Promise<Employee[]>
text

#### createEmployee()
/**
Create new employee
@param data - Employee data
@returns Promise<string> - New employee ID
*/
async function createEmployee(
data: CreateEmployeeDTO
): Promise<string>
text

## Google Calendar Service

### OAuth2 Methods

#### getAuthUrl()
/**
Generate OAuth2 authorization URL
@returns string - Authorization URL
*/
function getAuthUrl(): string
text

#### getTokensFromCode()
/**
Exchange authorization code for tokens
@param code - Authorization code
@returns Promise<TokenResponse>
*/
async function getTokensFromCode(
code: string
): Promise<TokenResponse>
text

### Calendar Operations

#### syncAppointmentToCalendar()
/**
Sync appointment to Google Calendar
@param appointment - Appointment data
@param userId - User ID for token lookup
@returns Promise<string> - Google Calendar event ID
*/
async function syncAppointmentToCalendar(
appointment: Appointment,
userId: string
): Promise<string>
text

#### updateCalendarEvent()
/**
Update existing calendar event
@param eventId - Google Calendar event ID
@param appointment - Updated appointment data
@param userId - User ID for token lookup
@returns Promise<void>
*/
async function updateCalendarEvent(
eventId: string,
appointment: Appointment,
userId: string
): Promise<void>
text

#### deleteCalendarEvent()
/**
Delete calendar event
@param eventId - Google Calendar event ID
@param userId - User ID for token lookup
@returns Promise<void>
*/
async function deleteCalendarEvent(
eventId: string,
userId: string
): Promise<void>
text

## Cloud Functions

### Firestore Triggers

#### onAppointmentCreate
/**
Triggered when appointment is created
Syncs to Google Calendar
Creates notification
Updates calendarSync status
*/
exports.onAppointmentCreate = functions.firestore
.document('salons/{salonId}/appointments/{appointmentId}')
.onCreate(async (snap, context) => {
// Implementation
});
text

#### onAppointmentUpdate
/**
Triggered when appointment is updated
Syncs changes to Google Calendar
Updates calendarSync status
*/
exports.onAppointmentUpdate = functions.firestore
.document('salons/{salonId}/appointments/{appointmentId}')
.onUpdate(async (change, context) => {
// Implementation
});
text

#### onAppointmentDelete
/**
Triggered when appointment is deleted
Deletes from Google Calendar
Updates calendarSync status
*/
exports.onAppointmentDelete = functions.firestore
.document('salons/{salonId}/appointments/{appointmentId}')
.onDelete(async (snap, context) => {
// Implementation
});
text

## Error Codes

### Firestore Errors
- `PERMISSION_DENIED` - User lacks permissions
- `NOT_FOUND` - Document doesn't exist
- `ALREADY_EXISTS` - Duplicate document
- `CONFLICT` - Time conflict detected

### Google Calendar Errors
- `INVALID_TOKEN` - OAuth2 token invalid/expired
- `RATE_LIMIT_EXCEEDED` - API quota exceeded
- `EVENT_NOT_FOUND` - Calendar event doesn't exist
- `INSUFFICIENT_PERMISSIONS` - Scope limitations

## Rate Limits

### Firestore
- 10,000 writes/day (free tier)
- 50,000 reads/day (free tier)
- 1 write/second per document

### Google Calendar API
- 1,000,000 requests/day
- 100 requests/100 seconds per user

## Best Practices

### Error Handling
try {
await createAppointment(data);
} catch (error) {
if (error.code === 'CONFLICT') {
// Handle time conflict
} else if (error.code === 'PERMISSION_DENIED') {
// Handle permission error
} else {
// Generic error handling
}
}
text

### Optimistic Updates
// Update UI immediately
setAppointments([...appointments, newAppointment]);
// Then sync to backend
try {
await createAppointment(newAppointment);
} catch (error) {
// Rollback UI on error
setAppointments(appointments);
}
text
undefined