---
updated: 2025-10-22
author: KiloCode AI
version: 1.0
project: Beauty Salon Booking System - Beauty Mario
---

# Testing Strategies - Strategie Testowania

## Przegląd Strategii Testowania

### Piramida Testów
text
    E2E Tests (5%)
     /\
    /  \
   /____\
  Integration Tests (15%)
   /    \
  /      \
 /________\
Unit Tests (80%)
text

### Pokrycie Kodu
- **Target**: 80% code coverage
- **Focus**: Critical business logic, custom hooks, services
- **Tools**: Jest, React Testing Library

## Unit Testing

### Custom Hooks Testing

#### useAuth Hook
// tests/hooks/useAuth.test.ts
import { renderHook, act } from '@testing-library/react';
describe('useAuth', () => {
it('should handle login successfully', async () =>
text
await act(async () => {
  await result.current.login('test@example.com', 'password123');
});

expect(result.current.user).toBeDefined();
expect(result.current.isAuthenticated).toBe(true);
});
it('should handle login failure', async () => {
const { result } = renderHook(() => useAuth())
text
await expect(async () => {
  await act(async () => {
    await result.current.login('invalid@example.com', 'wrong');
  });
}).rejects.toThrow();

expect(result.current.user).toBeNull();
expect(result.current.isAuthenticated).toBe(false);
});
})
text

#### usePendingTimeChanges Hook
// tests/hooks/usePendingTimeChanges.test.ts
import { renderHook, act } from '@testing-library/react';
describe('usePendingTimeChanges', () => {
it('should add pending time change', () =>
text
act(() => {
  result.current.addPendingChange('apt-123', {
    start: new Date('2025-10-22T14:00'),
    end: new Date('2025-10-22T15:00')
  });
});

expect(result.current.hasPendingChanges('apt-123')).toBe(true);
});
it('should commit pending changes', async () => {
const { result } = renderHook(() => usePendingTimeChanges
text
act(() => {
  result.current.addPendingChange('apt-123', {
    start: new Date('2025-10-22T14:00'),
    end: new Date('2025-10-22T15:00')
  });
});

await act(async () => {
  await result.current.commitChanges('apt-123', mockUpdate);
});

expect(mockUpdate).toHaveBeenCalled();
expect(result.current.hasPendingChanges('apt-123')).toBe(false);
});
})
text

### Service Layer Testing

#### Appointments Service
// tests/lib/appointments-service.test.ts
import { appointmentsService } from '@/lib/appointments-service';
mocks/firebase';
jest.mock('@/lib/firebase');
describe('AppointmentsService', () => {
beforeEach(() =>
{ jest.clearAllMo
describe('createAppointment', () => {
it('should create appointment successfully', async ()
> { const appointme
tData = { service
d: 'service-123',
clientId: 'client
456', staffName: 'Mario',
start: new Date('2025-10-22T1
:00'), end: new Date(
2025-10-22
text
  const id = await appointmentsService.create(appointmentData);
  
  expect(id).toBeDefined();
  expect(mockFirestore.collection).toHaveBeenCalledWith('appointments');
});

it('should detect time conflicts', async () => {
  // Mock existing appointment at same time
  mockFirestore.collection.mockReturnValue({
    where: jest.fn().mockReturnThis(),
    get: jest.fn().mockResolvedValue({
      docs: [{ id: 'existing-123', data: () => ({}) }]
    })
  });
  
  const appointmentData = {
    serviceId: 'service-123',
    clientId: 'client-456',
    staffName: 'Mario',
    start: new Date('2025-10-22T14:00'),
    end: new Date('2025-10-22T15:00'),
    status: 'confirmed' as const,
    price: 100
  };
  
  await expect(
    appointmentsService.create(appointmentData)
  ).rejects.toThrow('Time conflict detected');
});
});
describe('updateAppointment', () => {
it('should preserve googleCalendarEventId', async ()
> { const u
dates = { start: new Date('2
25-10-22T15:00'), end: ne
text
  await appointmentsService.update('apt-123', updates);
  
  const updateCall = mockFirestore.doc().update.mock.calls;
  expect(updateCall.googleCalendarEventId).toBeUndefined();
});
});
})
text

### Component Testing

#### Calendar Component
// tests/components/calendar/Calendar.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import {
describe('Calendar', () => {
it('should render calendar with appointments', () =>
{ const appointmen
s
= [
{ id: '1',
serviceId: 'servi
e-1', clien
Id: 'client-1', staffName: '
ario', start: new Date('20
5-10-22T14:00'), end:
new Date('
0
text
render(<Calendar appointments={appointments} />);

expect(screen.getByText('Mario')).toBeInTheDocument();
});
it('should handle appointment click', () => {
const onAppointmentClick = jest.f
text
render(
  <Calendar 
    appointments={appointments}
    onAppointmentClick={onAppointmentClick}
  />
);

fireEvent.click(screen.getByTestId('appointment-1'));

expect(onAppointmentClick).toHaveBeenCalledWith('1');
});
})
text

## Integration Testing

### Authentication Flow
// tests/integration/auth-flow.test.ts
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider } from '@/contexts/auth-context';
describe('Authentication Flow', () => {
it('should complete login flow', async () =>
{ r
<AuthProvider>
<LoginPage />
</AuthProvider>
text
// Fill in form
fireEvent.change(screen.getByLabelText('Email'), {
  target: { value: 'test@example.com' }
});
fireEvent.change(screen.getByLabelText('Password'), {
  target: { value: 'password123' }
});

// Submit
fireEvent.click(screen.getByRole('button', { name: 'Login' }));

// Wait for redirect
await waitFor(() => {
  expect(window.location.pathname).toBe('/protected');
});
});
})
text

### Appointment CRUD Flow
// tests/integration/appointment-crud.test.ts
describe('Appointment CRUD Flow', () => {
it('should create, update, and delete appointment', async () =>
text
// Create
await act(async () => {
  const id = await result.current.create({
    serviceId: 'service-123',
    clientId: 'client-456',
    staffName: 'Mario',
    start: new Date('2025-10-22T14:00'),
    end: new Date('2025-10-22T15:00'),
    status: 'confirmed',
    price: 100
  });
  
  expect(id).toBeDefined();
});

// Update
await act(async () => {
  await result.current.update('apt-123', {
    start: new Date('2025-10-22T15:00')
  });
});

// Delete
await act(async () => {
  await result.current.delete('apt-123');
});

expect(result.current.appointments).toHaveLength(0);
});
})
text

## E2E Testing (Playwright)

### Calendar Navigation
// e2e/calendar-navigation.spec.ts
import { test
test.describe('Calendar Navigation', () => {
test.beforeEach(async ({ page }) =>
http://localhost:3001');
await page.fill('[name="ematest@example.com');
await page.fill('[name="password"]', 'password12
'); await page.click('button[type="sub
it"]'); await page.waitForURL('**/protected/
test('should navigate between calendar views', async ({ page }) => {
// Click week
iew await page.click('[data-testid="view-w
text
// Click day view
await page.click('[data-testid="view-day"]');
expect(await page.locator('.day-view').isVisible()).toBe(true);

// Click month view
await page.click('[data-testid="view-month"]');
expect(await page.locator('.month-view').isVisible()).toBe(true);
});
})
text

### Appointment Creation
// e2e/appointment-creation.spec.ts
test('should create appointment through UI', async ({ page }) => {
http://localhost:3001/protected/kalendarz');
// Open create modal
await page.click('[data-testid="crea
// Fill form
await page.selectOption('[name="serviceId"]', 'service-123'
; await page.fill('[name="clientName"]', 'Jan Kowalsk
'); await page.fill('[name="phone"]', '+48 123 456
89'); await page.click('[name="d
te"]'); await page.click('[data-date="2025-
// Submit
await page.click('[type=
// Verify success
await expect(page.locator('.toast-success')).toBeVisible(
; await expect(page.locator('[data-appointment-id]')).toBeVisibl
text

## Performance Testing

### Load Time Testing
// tests/performance/load-time.test.ts
import { p
describe('Performance Tests', () => {
it('should load calendar page within 2 seconds', async () =>
text
// Render calendar with 100 appointments
const appointments = generateMockAppointments(100);
render(<Calendar appointments={appointments} />);

const end = performance.now();
const loadTime = end - start;

expect(loadTime).toBeLessThan(2000);
});
})
text

## Test Data Management

### Mock Data Factories
// tests/factories/appointment.factory.ts
export function createMockAppointment(
<Appointment>
): Appointment {
return
apt-${Math.random()},
serviceId: 'service-1
3', clientId: 'clie
t-456', staffNa
e: 'Mario', start: new Date('202
-10-22T14:00'), end: new Date(
2025-10-22T15:00'),
status:
confirmed', price: 100,
createdAt: Timestamp.no
(), upda
ed
export function createMockAppointments(count: number): Appointment[] {
return Array.from({ length: count }, (_, i)
> createMockAppoin
apt-${i},
start: n2025-10-22T${14 + i}:00)

}
text

## CI/CD Testing

### GitHub Actions Workflow
.github/workflows/test.yml
name: Test
on: [push, pull_request]
jobs:
tes
: runs
text
steps:
  - uses: actions/checkout@v3
  
  - name: Setup Node.js
    uses: actions/setup-node@v3
    with:
      node-version: '18'
  
  - name: Install dependencies
    run: npm ci
  
  - name: Run unit tests
    run: npm test -- --coverage
  
  - name: Run E2E tests
    run: npm run test:e2e
  
  - name: Upload coverage
    uses: codecov/codecov-action@v3
text

## Test Commands

Unit tests
npm test
Watch mode
npm test:watch
Coverage report
npm test:coverage
E2E tests
npm run test:e2e
E2E headed mode
npm run test:e2e:headed
Specific test file
npm test -- appointments-service.test.ts
text
undefined