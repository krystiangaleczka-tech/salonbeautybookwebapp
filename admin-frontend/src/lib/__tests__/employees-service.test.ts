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
jest.mock('firebase/firestore', () => {
  const actualFirestore = jest.requireActual('firebase/firestore');
  
  return {
    ...actualFirestore,
    getFirestore: jest.fn(),
    collection: jest.fn((...args) => {
      (global as any).mockCollection?.(...args);
      return { id: 'mock-collection' };
    }),
    addDoc: jest.fn((...args) => (global as any).mockAddDoc?.(...args)),
    doc: jest.fn((...args) => {
      (global as any).mockDoc?.(...args);
      return { id: 'mock-doc' };
    }),
    getDoc: jest.fn(),
    updateDoc: jest.fn((...args) => (global as any).mockUpdateDoc?.(...args)),
    deleteDoc: jest.fn((...args) => (global as any).mockDeleteDoc?.(...args)),
    onSnapshot: jest.fn((collectionRef, callback) => {
      (global as any).mockOnSnapshot?.(collectionRef, callback);
      // Symuluj natychmiastowe wywołanie callback z danymi
      callback({
        docs: [
          {
            id: 'emp1',
            data: () => ({
              name: 'Jan Kowalski',
              email: 'jan@example.com',
              role: 'employee',
              workingHours: [],
            }),
          },
        ],
      });
      return jest.fn(); // Zwróć funkcję unsubscribe
    }),
    query: jest.fn((...args) => (global as any).mockQuery?.(...args)),
    orderBy: jest.fn((...args) => (global as any).mockOrderBy?.(...args)),
    serverTimestamp: jest.fn(() => (global as any).mockServerTimestamp?.()),
    Timestamp: class MockTimestamp {
      constructor(public seconds: number, public nanoseconds: number) {}
      
      toDate() {
        return new Date(this.seconds * 1000);
      }
      
      static fromDate(date: Date) {
        return new MockTimestamp(Math.floor(date.getTime() / 1000), 0);
      }
      
      static now() {
        return MockTimestamp.fromDate(new Date());
      }
    },
  };
});

// Przykładowi pracownicy do testów
const mockEmployees: Employee[] = [
  {
    id: 'emp1',
    name: 'Jan Kowalski',
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
    
    // Konfiguruj globalne mocki
    (global as any).mockCollection = jest.fn().mockReturnValue({ id: 'mock-collection' });
    (global as any).mockAddDoc = jest.fn().mockResolvedValue({ id: 'new-employee-id' });
    (global as any).mockDoc = jest.fn().mockReturnValue({ id: 'mock-doc' });
    (global as any).mockUpdateDoc = jest.fn().mockResolvedValue(undefined);
    (global as any).mockDeleteDoc = jest.fn().mockResolvedValue(undefined);
    (global as any).mockQuery = jest.fn().mockReturnValue({});
    (global as any).mockOrderBy = jest.fn().mockReturnValue({});
    (global as any).mockServerTimestamp = jest.fn(() => new Date());
    (global as any).mockOnSnapshot = jest.fn().mockReturnValue(jest.fn()); // Brakowało tej linii!
  });

  describe('subscribeToEmployees', () => {
    test('powinien poprawnie subskrybować do pracowników', () => {
      const mockCallback = jest.fn();
      const mockErrorCallback = jest.fn();
      
      const unsubscribe = subscribeToEmployees(mockCallback, mockErrorCallback);
      
      expect((global as any).mockOnSnapshot).toHaveBeenCalled();
      expect(mockCallback).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'emp1',
            name: 'Jan Kowalski',
            email: 'jan@example.com',
          })
        ])
      );
      expect(unsubscribe).toBeDefined();
    });
  });

  describe('createEmployee', () => {
    test('powinien tworzyć nowego pracownika', async () => {
      const employeePayload: EmployeePayload = {
        name: 'Nowy Pracownik',
        email: 'nowy@example.com',
        phone: '555555555',
        isActive: true,
        services: ['service1'],
        userRole: 'employee',
        googleCalendarEmail: 'nowy@gmail.com',
      };
      
      console.log('Before createEmployee - mockCollection calls:', (global as any).mockCollection.mock.calls.length);
      
      await createEmployee(employeePayload);
      
      console.log('After createEmployee - mockCollection calls:', (global as any).mockCollection.mock.calls.length);
      console.log('Mock addDoc calls:', (global as any).mockAddDoc.mock.calls.length);
      console.log('Mock addDoc args:', (global as any).mockAddDoc.mock.calls);

      expect((global as any).mockAddDoc).toHaveBeenCalledTimes(1);
      expect((global as any).mockAddDoc).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'mock-collection' }), // CollectionReference mock
        expect.objectContaining({
          name: employeePayload.name,
          email: employeePayload.email,
          phone: employeePayload.phone,
          isActive: employeePayload.isActive,
          services: employeePayload.services,
          userRole: employeePayload.userRole,
          googleCalendarEmail: employeePayload.googleCalendarEmail,
          createdAt: expect.anything(),
          updatedAt: expect.anything(),
        })
      );
    });
  });

  describe('updateEmployee', () => {
    test('powinien aktualizować istniejącego pracownika', async () => {
      const employeePayload: EmployeePayload = {
        name: 'Zaktualizowany Pracownik',
        email: 'updated@example.com',
        phone: '999999999',
        isActive: false,
        services: ['service2'],
        userRole: 'owner',
        googleCalendarEmail: 'updated@gmail.com',
      };
      
      await updateEmployee('emp1', employeePayload);
      
      expect((global as any).mockDoc).toHaveBeenCalled();
      expect((global as any).mockUpdateDoc).toHaveBeenCalledWith(
        { id: 'mock-doc' },
        expect.objectContaining({
          name: employeePayload.name,
          email: employeePayload.email,
          phone: employeePayload.phone,
          isActive: employeePayload.isActive,
          services: employeePayload.services,
          userRole: employeePayload.userRole,
          googleCalendarEmail: employeePayload.googleCalendarEmail,
          updatedAt: expect.anything(),
        })
      );
    });
  });

  describe('deleteEmployee', () => {
    test('powinien usuwać pracownika', async () => {
      await deleteEmployee('emp1');
      
      expect((global as any).mockDoc).toHaveBeenCalled();
      expect((global as any).mockDeleteDoc).toHaveBeenCalledWith({ id: 'mock-doc' });
    });
  });
});