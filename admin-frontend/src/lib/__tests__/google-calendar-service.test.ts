import { googleCalendarService } from '../google-calendar-service';
import type { Employee } from '../employees-service';

// Mock dla Firebase
jest.mock('@/lib/firebase', () => ({
  auth: {
    currentUser: {
      uid: 'test-user-id',
      email: 'test@example.com',
    },
  },
  functions: {
    httpsCallable: jest.fn(),
  },
}));

// Mock dla Firestore
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  updateDoc: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  onSnapshot: jest.fn(),
}));

// Przykładowi pracownicy do testów
const mockEmployee: Employee = {
  id: 'emp1',
  name: 'Jan Kowalski',
  role: 'Fryzjer',
  email: 'jan@example.com',
  phone: '123456789',
  isActive: true,
  services: ['service1', 'service2'],
  personalBuffers: { service1: 5 },
  defaultBuffer: 0,
  userRole: 'owner',
  googleCalendarEmail: 'jan@gmail.com',
  workingHours: [
    { dayOfWeek: 1, startTime: '09:00', endTime: '17:00', isActive: true },
    { dayOfWeek: 2, startTime: '09:00', endTime: '17:00', isActive: true },
  ],
};

const mockEmployeeWithoutGoogleCalendar: Employee = {
  ...mockEmployee,
  id: 'emp2',
  googleCalendarEmail: undefined,
};

// Mock console.error to avoid noise in test output
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

describe('GoogleCalendarService', () => {
  beforeEach(() => {
    // Resetuj mocki przed każdym testem
    jest.clearAllMocks();
  });

  describe('Funkcjonalność per pracownik', () => {
    test('powinien zwrócić status połączenia dla pracownika z Google Calendar', async () => {
      // Mock dla getDoc
      const mockGetDoc = require('firebase/firestore').getDoc;
      const mockDoc = {
        exists: true,
        data: () => ({
          isActive: true,
          updatedAt: { toDate: () => new Date() },
          calendarId: 'primary',
        }),
      };
      mockGetDoc.mockResolvedValue(mockDoc);

      const status = await googleCalendarService.getEmployeeConnectionStatus(mockEmployee);
      
      expect(status).not.toBeNull();
      expect(status?.isConnected).toBe(true);
      expect(status?.employeeId).toBe(mockEmployee.id);
      expect(status?.employeeName).toBe(mockEmployee.name);
      expect(status?.googleCalendarEmail).toBe(mockEmployee.googleCalendarEmail);
    });

    test('powinien zwrócić status braku połączenia dla pracownika bez Google Calendar', async () => {
      const status = await googleCalendarService.getEmployeeConnectionStatus(mockEmployeeWithoutGoogleCalendar);
      
      expect(status).not.toBeNull();
      expect(status?.isConnected).toBe(false);
      expect(status?.syncEnabled).toBe(false);
      expect(status?.employeeId).toBe(mockEmployeeWithoutGoogleCalendar.id);
      expect(status?.googleCalendarEmail).toBeUndefined();
    });

    test('powinien generować URL autoryzacji dla pracownika', async () => {
      // Mock dla httpsCallable
      const mockHttpsCallable = require('@/lib/firebase').functions.httpsCallable;
      mockHttpsCallable.mockReturnValue(() => 
        Promise.resolve({ data: { url: 'https://accounts.google.com/oauth/authorize?...' } })
      );

      const url = await googleCalendarService.getEmployeeAuthUrl(mockEmployee);
      
      expect(url).toBe('https://accounts.google.com/oauth/authorize?...');
      expect(mockHttpsCallable).toHaveBeenCalledWith({ email: mockEmployee.googleCalendarEmail });
    });

    test('powinien rzucić błąd przy próbie uzyskania URL dla pracownika bez Google Calendar', async () => {
      await expect(
        googleCalendarService.getEmployeeAuthUrl(mockEmployeeWithoutGoogleCalendar)
      ).rejects.toThrow('Pracownik nie ma skonfigurowanego emaila Google Calendar!');
    });
  });

  describe('Synchronizacja wizyt per pracownik', () => {
    test('powinien synchronizować wizytę dla pracownika z Google Calendar', async () => {
      // Mock dla httpsCallable
      const mockHttpsCallable = require('@/lib/firebase').functions.httpsCallable;
      mockHttpsCallable.mockReturnValue(() => 
        Promise.resolve({ data: { success: true, googleEventId: 'event123' } })
      );

      const appointmentData = {
        id: 'appointment1',
        serviceId: 'service1',
        clientId: 'client1',
        staffName: 'Jan Kowalski',
        start: new Date('2024-01-15T10:00:00'),
        end: new Date('2024-01-15T11:00:00'),
        status: 'confirmed',
        notes: 'Test notes',
        clientEmail: 'client@example.com',
        serviceName: 'Strzyżenie',
        clientName: 'Jan Kowalski',
      };

      const result = await googleCalendarService.syncAppointmentToGoogleForEmployee(appointmentData, mockEmployee);
      
      expect(result).toBe('event123');
      expect(mockHttpsCallable).toHaveBeenCalledWith({
        ...appointmentData,
        googleCalendarEmail: mockEmployee.googleCalendarEmail,
      });
    });

    test('powinien zwrócić null dla pracownika bez Google Calendar', async () => {
      const appointmentData = {
        id: 'appointment1',
        serviceId: 'service1',
        clientId: 'client1',
        staffName: 'Jan Kowalski',
        start: new Date('2024-01-15T10:00:00'),
        end: new Date('2024-01-15T11:00:00'),
        status: 'confirmed',
        clientEmail: 'client@example.com',
        serviceName: 'Strzyżenie',
        clientName: 'Jan Kowalski',
      };

      const result = await googleCalendarService.syncAppointmentToGoogleForEmployee(appointmentData, mockEmployeeWithoutGoogleCalendar);
      
      expect(result).toBeNull();
    });

    test('powinien aktualizować wydarzenie w Google Calendar dla pracownika', async () => {
      // Mock dla httpsCallable
      const mockHttpsCallable = require('@/lib/firebase').functions.httpsCallable;
      mockHttpsCallable.mockReturnValue(() => 
        Promise.resolve({ data: { success: true } })
      );

      const updateData = {
        googleCalendarEventId: 'event123',
        appointment: {
          id: 'appointment1',
          serviceId: 'service1',
          clientId: 'client1',
          staffName: 'Jan Kowalski',
          start: new Date('2024-01-15T10:00:00'),
          end: new Date('2024-01-15T11:00:00'),
          status: 'confirmed',
          notes: 'Updated notes',
        },
        clientEmail: 'client@example.com',
        serviceName: 'Strzyżenie',
        clientName: 'Jan Kowalski',
      };

      const result = await googleCalendarService.updateGoogleCalendarEventForEmployee(updateData, mockEmployee);
      
      expect(result.success).toBe(true);
      expect(mockHttpsCallable).toHaveBeenCalledWith({
        ...updateData,
        googleCalendarEmail: mockEmployee.googleCalendarEmail,
      });
    });

    test('powinien usuwać wydarzenie z Google Calendar dla pracownika', async () => {
      // Mock dla httpsCallable
      const mockHttpsCallable = require('@/lib/firebase').functions.httpsCallable;
      mockHttpsCallable.mockReturnValue(() => 
        Promise.resolve({ data: { success: true } })
      );

      const result = await googleCalendarService.deleteGoogleCalendarEventForEmployee('event123', mockEmployee);
      
      expect(result.success).toBe(true);
      expect(mockHttpsCallable).toHaveBeenCalledWith({
        googleEventId: 'event123',
        googleCalendarEmail: mockEmployee.googleCalendarEmail,
      });
    });
  });
});