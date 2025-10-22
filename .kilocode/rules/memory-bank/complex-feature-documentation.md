---
updated: 2025-10-22
author: KiloCode AI
version: 1.0
project: Beauty Salon Booking System - Beauty Mario
---

# Complex Feature Documentation

## Google Calendar Synchronization

### Architecture Overview
Dwukierunkowa synchronizacja między systemem Beauty Mario a Google Calendar wykorzystująca OAuth2, Firestore triggers i Cloud Functions.

### Components

#### Frontend Integration
// src/lib/google-calendar-service.ts
export class GoogleCalendarService {
// OAuth2 authentication
async authenticate(userId: string): Promise<void>
// Manual sync trigger
async syncAppointment(appointmentId: string): Promise<void>
// Check sync status
async getSyncStatus(appointmentId: string): Promise<SyncStatus>
}
text

#### Backend Synchronization
// booking-functions/src/calendar-sync.ts
export const syncToGoogleCalendar = functions.firestore
.document('appointments/{id}')
.onCreate(async (snap, context) => {
const appointment = snap.data();
const employee = await getEmployee(appointment.staffName);
const tokens = await getTokens(employee.userId);
text
// Create event in Google Calendar
const eventId = await createCalendarEvent(appointment, tokens);

// Store eventId in Firestore
await snap.ref.update({ googleCalendarEventId: eventId });
});
text

### Data Flow

#### Create Flow
User Creates Appointment
↓
Save to Firestore (appointments)
↓
Firestore Trigger Fires
↓
Cloud Function: syncToGoogleCalendar
↓
Get Employee OAuth Tokens
↓
Create Google Calendar Event
↓
Store eventId in Firestore
↓
Update calendarSync Status
↓
Frontend Receives Update
text

#### Update Flow
User Updates Appointment
↓
Update Firestore (preserve eventId)
↓
Firestore Trigger: onUpdate
↓
Cloud Function: updateGoogleCalendarEvent
↓
Fetch Existing Event by eventId
↓
Update Event in Google Calendar
↓
Update calendarSync Status
text

### Error Handling Strategy

#### Token Expiry
async function executeWithTokenRefresh(
userId: string,
operation: (tokens: Tokens) => Promise<any>
) {
let tokens = await getTokens(userId);
// Check if expired
if (Date.now() > tokens.expiryDate) {
tokens = await refreshTokens(userId);
}
try {
return await operation(tokens);
} catch (error) {
if (error.code === 401) {
// Token invalid, refresh and retry
tokens = await refreshTokens(userId);
return await operation(tokens);
}
throw error;
}
}
text

#### Sync Failures
interface SyncRetryConfig {
maxRetries: 3;
backoffMultiplier: 2;
initialDelayMs: 1000;
}
async function syncWithRetry(
appointment: Appointment,
config: SyncRetryConfig
) {
for (let attempt = 0; attempt < config.maxRetries; attempt++) {
try {
return await syncToCalendar(appointment);
} catch (error) {
if (attempt === config.maxRetries - 1) throw error;
text
  const delay = config.initialDelayMs * 
    Math.pow(config.backoffMultiplier, attempt);
  await sleep(delay);
}
}
}
text

### Batch Synchronization
/**
Sync multiple appointments in batch
Used for initial sync or bulk operations
*/
async function batchSyncAppointments(
appointments: Appointment[],
userId: string
): Promise<SyncResult[]> {
const tokens = await getTokens(userId);
const batch = calendar.events.batch();
// Create batch requests
appointments.forEach(apt => {
batch.insert({
calendarId: 'primary',
resource: mapAppointmentToEvent(apt)
});
});
// Execute batch
const results = await batch.execute();
// Update Firestore with eventIds
const updates = results.map((result, i) => ({
appointmentId: appointments[i].id,
googleCalendarEventId: result.id
}));
await updateAppointmentsBatch(updates);
return results;
}
text

## Multi-Employee System

### Role-Based Access Control

#### Roles
type Role = 'owner' | 'employee' | 'tester';
interface RolePermissions {
canViewAllAppointments: boolean;
canEditAllAppointments: boolean;
canManageEmployees: boolean;
canManageServices: boolean;
canManageSettings: boolean;
canViewReports: boolean;
canManageCustomers: boolean;
}
const ROLE_PERMISSIONS: Record<Role, RolePermissions> = {
owner: {
canViewAllAppointments: true,
canEditAllAppointments: true,
canManageEmployees: true,
canManageServices: true,
canManageSettings: true,
canViewReports: true,
canManageCustomers: true
},
employee: {
canViewAllAppointments: false, // Own only
canEditAllAppointments: false, // Own only
canManageEmployees: false,
canManageServices: false,
canManageSettings: false,
canViewReports: false,
canManageCustomers: true
},
tester: {
canViewAllAppointments: true,
canEditAllAppointments: false,
canManageEmployees: false,
canManageServices: false,
canManageSettings: false,
canViewReports: true,
canManageCustomers: false
}
};
text

#### Permission Checks
function hasPermission(
user: Employee,
permission: keyof RolePermissions
): boolean {
return ROLE_PERMISSIONS[user.role][permission];
}
// Usage in component
function AppointmentList() {
const { employee } = useEmployee();
const canEditAll = hasPermission(employee, 'canEditAllAppointments');
return (
<div>
{appointments.map(apt => (
<AppointmentCard
key={apt.id}
appointment={apt}
canEdit={canEditAll || apt.staffName === employee.name}
/>
))}
</div>
);
}
text

### Auto-Create Admin Employee

/**
Automatically creates admin employee on first login
*/
export async function ensureAdminEmployee(
userId: string,
email: string
): Promise<Employee> {
// Check if employee exists
const existing = await db
.collection('employees')
.where('userId', '==', userId)
.limit(1)
.get();
if (!existing.empty) {
return existing.docs.data() as Employee;
}
// Check if this is the first user
const allEmployees = await db.collection('employees').get();
const isFirstUser = allEmployees.empty;
// Create employee
const employee: Employee = {
id: generateId(),
name: email.split('@'),
role: isFirstUser ? 'owner' : 'employee',
email,
userId,
isActive: true,
services: [],
defaultBuffer: 15,
createdAt: Timestamp.now(),
updatedAt: Timestamp.now()
};
await db.collection('employees').doc(employee.id).set(employee);
return employee;
}
text

## Advanced Filtering System

### Filter Presets
interface FilterPreset {
id: string;
name: string;
filters: AppointmentFilters;
userId: string;
isDefault: boolean;
createdAt: Date;
}
// Save preset
async function saveFilterPreset(
name: string,
filters: AppointmentFilters,
userId: string
): Promise<void> {
const preset: FilterPreset = {
id: generateId(),
name,
filters,
userId,
isDefault: false,
createdAt: new Date()
};
await db
.collection('filterPresets')
.doc(preset.id)
.set(preset);
}
// Load presets
async function getUserPresets(
userId: string
): Promise<FilterPreset[]> {
const snapshot = await db
.collection('filterPresets')
.where('userId', '==', userId)
.orderBy('createdAt', 'desc')
.get();
return snapshot.docs.map(doc => doc.data() as FilterPreset);
}
text

### Dynamic Filter Application
function applyFilters(
appointments: Appointment[],
filters: AppointmentFilters
): Appointment[] {
return appointments.filter(apt => {
// Date range filter
if (filters.startDate && apt.start < filters.startDate) {
return false;
}
if (filters.endDate && apt.start > filters.endDate) {
return false;
}
text
// Staff filter
if (filters.staffName && apt.staffName !== filters.staffName) {
  return false;
}

// Status filter
if (filters.status && apt.status !== filters.status) {
  return false;
}

// Service filter
if (filters.serviceId && apt.serviceId !== filters.serviceId) {
  return false;
}

// Client filter
if (filters.clientId && apt.clientId !== filters.clientId) {
  return false;
}

return true;
});
}
text

## Optimistic UI Updates

### Implementation Pattern
function useOptimisticAppointments() {
const [appointments, setAppointments] = useState<Appointment[]>([]);
const [pendingChanges, setPendingChanges] = useState<Map<string, Appointment>>(new Map());
const createAppointment = async (data: CreateAppointmentDTO) => {
// Generate temporary ID
const tempId = temp-${Date.now()};
const optimisticApt: Appointment = {
id: tempId,
...data,
createdAt: Timestamp.now(),
updatedAt: Timestamp.now()
};
text
// Update UI immediately
setAppointments(prev => [...prev, optimisticApt]);
setPendingChanges(prev => new Map(prev).set(tempId, optimisticApt));

try {
  // Save to backend
  const realId = await appointmentsService.create(data);
  
  // Replace temp with real
  setAppointments(prev => 
    prev.map(apt => apt.id === tempId 
      ? { ...apt, id: realId } 
      : apt
    )
  );
  setPendingChanges(prev => {
    const next = new Map(prev);
    next.delete(tempId);
    return next;
  });
  
  return realId;
} catch (error) {
  // Rollback on error
  setAppointments(prev => prev.filter(apt => apt.id !== tempId));
  setPendingChanges(prev => {
    const next = new Map(prev);
    next.delete(tempId);
    return next;
  });
  throw error;
}
};
return { appointments, createAppointment, pendingChanges };
}
text
undefined