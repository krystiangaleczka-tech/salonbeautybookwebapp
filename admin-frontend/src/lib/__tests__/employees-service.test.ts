import { 
  subscribeToEmployees, 
  createEmployee, 
  updateEmployee, 
  deleteEmployee,
  type Employee,
  type EmployeePayload 
} from '../employees-service';

// Mock dla Firebase
jest.mock('@/lib/firebase', () => ({
  db: {},
}));

// Mock dla Firestore
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  onSnapshot: jest.fn(),
  query: jest.fn(),
  orderBy: jest.fn(),
  serverTimestamp: jest.fn(() => new Date()),
  Timestamp: {
    fromDate: (date: Date) => ({ seconds: Math.floor(date.getTime() / 1000), toDate: () => date }),
  },
}));

// Przykładowi pracownicy do testów
const mockEmployees: Employee[] = [
  {
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
  },
  {
    id: 'emp2',
    name: 'Anna Nowak',
    role: 'Kosmetyczka',
    email: 'anna@example.com',
    phone: '987654321',
    isActive: true,
    services: ['service3'],
    personalBuffers: {},
    defaultBuffer: 10,
    userRole: 'employee',
    googleCalendarEmail: 'anna@gmail.com',
    workingHours: [
      { dayOfWeek: 3, startTime: '10:00', endTime: '18:00', isActive: true },
      { dayOfWeek: 4, startTime: '10:00', endTime: '18:00', isActive: true },
    ],
  },
];

// Mock console.error to avoid noise in test output
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

describe('EmployeesService', () => {
  beforeEach(() => {
    // Resetuj mocki przed każdym testem
    jest.clearAllMocks();
  });

  describe('subscribeToEmployees', () => {
    test('powinien poprawnie subskrybować do pracowników', () => {
      const mockOnSnapshot = require('firebase/firestore').onSnapshot;
      const mockCallback = jest.fn();
      const mockErrorCallback = jest.fn();
      
      // Mock dla onSnapshot
      mockOnSnapshot.mockImplementation((query, callback, errorCallback) => {
        // Symuluj natychmiastowe wywołanie callback z danymi testowymi
        callback({
          docs: mockEmployees.map(emp => ({
            id: emp.id,
            data: () => emp,
          }))
        });
        
        // Zwróć funkcja do czyszczenia subskrypcji
        return jest.fn();
      });
      
      const unsubscribe = subscribeToEmployees(mockCallback, mockErrorCallback);
      
      expect(mockOnSnapshot).toHaveBeenCalled();
      expect(mockCallback).toHaveBeenCalledWith(mockEmployees);
      expect(unsubscribe).toBeDefined();
    });
  });

  describe('createEmployee', () => {
    test('powinien tworzyć nowego pracownika', async () => {
      const mockAddDoc = require('firebase/firestore').addDoc;
      const mockCollection = require('firebase/firestore').collection;
      const mockServerTimestamp = require('firebase/firestore').serverTimestamp;
      
      // Mock dla collection i addDoc
      mockCollection.mockReturnValue({});
      mockAddDoc.mockResolvedValue({ id: 'new-employee-id' });
      mockServerTimestamp.mockReturnValue(new Date());
      
      const employeePayload: EmployeePayload = {
        name: 'Nowy Pracownik',
        role: 'Fryzjer',
        email: 'nowy@example.com',
        phone: '555555555',
        isActive: true,
        services: ['service1'],
        userRole: 'employee',
        googleCalendarEmail: 'nowy@gmail.com',
      };
      
      await createEmployee(employeePayload);
      
      expect(mockCollection).toHaveBeenCalled();
      expect(mockAddDoc).toHaveBeenCalledWith(
        {},
        expect.objectContaining({
          name: employeePayload.name,
          role: employeePayload.role,
          email: employeePayload.email,
          phone: employeePayload.phone,
          isActive: employeePayload.isActive,
          services: employeePayload.services,
          userRole: employeePayload.userRole,
          googleCalendarEmail: employeePayload.googleCalendarEmail,
          createdAt: expect.anything),
          updatedAt: expect.anything),
        })
      );
    });
  });

  describe('updateEmployee', () => {
    test('powinien aktualizować istniejącego pracownika', async () => {
      const mockUpdateDoc = require('firebase/firestore').updateDoc;
      const mockDoc = require('firebase/firestore').doc;
      const mockServerTimestamp = require('firebase/firestore').serverTimestamp;
      
      // Mock dla doc i updateDoc
      mockDoc.mockReturnValue({});
      mockUpdateDoc.mockResolvedValue(undefined);
      mockServerTimestamp.mockReturnValue(new Date());
      
      const employeePayload: EmployeePayload = {
        name: 'Zaktualizowany Pracownik',
        role: 'Kosmetyczka',
        email: 'updated@example.com',
        phone: '999999999',
        isActive: false,
        services: ['service2'],
        userRole: 'owner',
        googleCalendarEmail: 'updated@gmail.com',
      };
      
      await updateEmployee('emp1', employeePayload);
      
      expect(mockDoc).toHaveBeenCalled();
      expect(mockUpdateDoc).toHaveBeenCalledWith(
        {},
        expect.objectContaining({
          name: employeePayload.name,
          role: employeePayload.role,
          email: employeePayload.email,
          phone: employeePayload.phone,
          isActive: employeePayload.isActive,
          services: employeePayload.services,
          userRole: employeePayload.userRole,
          googleCalendarEmail: employeePayload.googleCalendarEmail,
          updatedAt: expect.anything),
        })
      );
    });
  });

  describe('deleteEmployee', () => {
    test('powinien usuwać pracownika', async () => {
      const mockDeleteDoc = require('firebase/firestore').deleteDoc;
      const mockDoc = require('firebase/firestore').doc;
      
      // Mock dla doc i deleteDoc
      mockDoc.mockReturnValue({});
      mockDeleteDoc.mockResolvedValue(undefined);
      
      await deleteEmployee('emp1');
      
      expect(mockDoc).toHaveBeenCalled();
      expect(mockDeleteDoc).toHaveBeenCalledWith({});
    });
  });
});