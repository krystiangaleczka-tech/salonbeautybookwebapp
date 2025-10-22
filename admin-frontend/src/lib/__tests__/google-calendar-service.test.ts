import { googleCalendarService } from '../google-calendar-service';
import type { Employee } from '../employees-service';

// Deklaracja mocka przed jest.mock()
const mockHttpsCallable = jest.fn();

// Mock dla Firebase Functions
jest.mock('firebase/functions', () => ({
  getFunctions: jest.fn(),
  httpsCallable: jest.fn(() => mockHttpsCallable),
}));

// Mock dla Firebase
jest.mock('@/lib/firebase', () => ({
  auth: {
    currentUser: {
      uid: 'test-user-id',
      email: 'test@example.com',
    } as unknown as import('firebase/auth').User,
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
  
  email: 'jan@example.com',
  phone: '123456789',
  isActive: true,
  services: ['service1', 'service2'],
  personalBuffers: { service1: 5 },
  defaultBuffer: 0,
  userRole: 'owner',
  googleCalendarId: 'jan@gmail.com',
  workingHours: [
    { dayOfWeek: 1, startTime: '09:00', endTime: '17:00', isActive: true },
    { dayOfWeek: 2, startTime: '09:00', endTime: '17:00', isActive: true },
  ],
};

const mockEmployeeWithoutGoogleCalendar: Employee = {
  ...mockEmployee,
  id: 'emp2',
  googleCalendarId: undefined,
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
      // Mock dla Firestore
      const { getDoc, doc, getFirestore } = require('firebase/firestore');
      
      // Mock dla getFirestore
      const mockDb = { id: 'mock-db' };
      getFirestore.mockReturnValue(mockDb);
      
      // Mock dla doc
      const mockDocRef = { id: 'mock-doc-ref' };
      doc.mockReturnValue(mockDocRef);
      
      // Mock dla getDoc - zwróć dane z isActive: true
      getDoc.mockResolvedValue({
        exists: () => true, // ← FUNKCJA, nie właściwość!
        data: () => ({
          isActive: true,
          updatedAt: { toDate: () => new Date() },
          calendarId: 'primary',
        }),
      });
      
      const status = await googleCalendarService.getEmployeeConnectionStatus(mockEmployee);
      
      expect(status).not.toBeNull();
      expect(status?.isConnected).toBe(true);
      expect(status?.syncEnabled).toBe(true);
      expect(status?.employeeId).toBe(mockEmployee.id);
      expect(status?.employeeName).toBe(mockEmployee.name);
      expect(status?.googleCalendarId).toBe(mockEmployee.googleCalendarId);
      expect(getFirestore).toHaveBeenCalled();
      expect(doc).toHaveBeenCalledWith(mockDb, 'googleTokens', mockEmployee.googleCalendarId);
      expect(getDoc).toHaveBeenCalledWith(mockDocRef);
    });

    test('powinien zwrócić status braku połączenia dla pracownika bez Google Calendar', async () => {
      const status = await googleCalendarService.getEmployeeConnectionStatus(mockEmployeeWithoutGoogleCalendar);
      
      expect(status).not.toBeNull();
      expect(status?.isConnected).toBe(false);
      expect(status?.syncEnabled).toBe(false);
      expect(status?.employeeId).toBe(mockEmployeeWithoutGoogleCalendar.id);
      expect(status?.googleCalendarId).toBeUndefined();
    });

    test('powinien generować URL autoryzacji dla pracownika', async () => {
      // Mock dla httpsCallable
      mockHttpsCallable.mockResolvedValueOnce({
        data: { url: 'https://accounts.google.com/oauth/authorize?...' }
      });

      const url = await googleCalendarService.getEmployeeAuthUrl(mockEmployee);
      
      expect(url).toBe('https://accounts.google.com/oauth/authorize?...');
      expect(mockHttpsCallable).toHaveBeenCalledWith({ calendarId: mockEmployee.googleCalendarId });
    });

    test('powinien rzucić błąd przy próbie uzyskania URL dla pracownika bez Google Calendar', async () => {
      await expect(
        googleCalendarService.getEmployeeAuthUrl(mockEmployeeWithoutGoogleCalendar)
      ).rejects.toThrow('Pracownik nie ma skonfigurowanego ID kalendarza Google Calendar!');
    });
  });

  describe('Synchronizacja wizyt per pracownik', () => {
    test('powinien synchronizować wizytę dla pracownika z Google Calendar', async () => {
      // Mock dla httpsCallable
      mockHttpsCallable.mockResolvedValueOnce({
        data: { success: true, googleEventId: 'event123' }
      });

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
        calendarId: mockEmployee.googleCalendarId,
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
      mockHttpsCallable.mockResolvedValueOnce({
        data: { success: true }
      });

      const updateData = {
        mainCalendarEventId: 'event123',
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
        calendarId: mockEmployee.googleCalendarId,
      });
    });

    test('powinien usuwać wydarzenie z Google Calendar dla pracownika', async () => {
      // Mock dla httpsCallable
      mockHttpsCallable.mockResolvedValueOnce({
        data: { success: true }
      });

      const result = await googleCalendarService.deleteGoogleCalendarEventForEmployee('event123', mockEmployee);
      
      expect(result.success).toBe(true);
      expect(mockHttpsCallable).toHaveBeenCalledWith({
        googleEventId: 'event123',
        calendarId: mockEmployee.googleCalendarId,
      });
    });
  });
});