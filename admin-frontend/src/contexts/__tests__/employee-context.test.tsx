// ===== MOCKI - MUSZĄ BYĆ PIERWSZE =====
const mockAuthContextValue = {
  user: {
    uid: 'test-user-id',
    email: 'jan@example.com',
  },
  loading: false,
};

// Mock dla auth-context
jest.mock('../auth-context', () => ({
  __esModule: true,
  AuthContext: require('react').createContext(null),
  useAuth: () => mockAuthContextValue,
}));

// Mock dla employees-service - używamy jest.fn() bezpośrednio
jest.mock('@/lib/employees-service', () => ({
  subscribeToEmployees: jest.fn(),
}));

jest.mock('@/lib/firebase', () => ({
  auth: { currentUser: null },
}));

// ===== IMPORTY =====
import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { EmployeeProvider, useEmployee } from '../employee-context';
import { AuthContext } from '../auth-context';
import { subscribeToEmployees } from '@/lib/employees-service';
import type { Employee } from '@/lib/employees-service';

// Teraz możemy uzyskać referencję do zmockowanej funkcji
const mockSubscribeToEmployees = subscribeToEmployees as jest.MockedFunction<typeof subscribeToEmployees>;

// ===== DANE TESTOWE =====
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
  {
    id: 'emp3',
    name: 'Piotr Wiśniewski',
    role: 'Manicurzysta',
    email: 'piotr@example.com',
    phone: '555555555',
    isActive: false,
    services: ['service4'],
    personalBuffers: {},
    defaultBuffer: 5,
    userRole: 'employee',
    workingHours: [],
  },
];

// ===== WRAPPER =====
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthContext.Provider value={mockAuthContextValue}>
    <EmployeeProvider>{children}</EmployeeProvider>
  </AuthContext.Provider>
);

// ===== TESTY =====
describe('EmployeeContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Konfiguracja mocka subscribeToEmployees
    mockSubscribeToEmployees.mockImplementation((callback) => {
      // Wywołaj callback synchronicznie
      callback(mockEmployees);
      
      // Zwróć prawdziwą funkcję unsubscribe
      return () => {
        // cleanup
      };
    });
  });

  describe('Podstawowa funkcjonalność', () => {
    test('powinien dostarczyć listę pracowników', async () => {
      const { result } = renderHook(() => useEmployee(), { wrapper: TestWrapper });
      
      await waitFor(() => {
        expect(result.current.allEmployees.length).toBeGreaterThan(0);
      });
      
      expect(result.current.allEmployees).toEqual(mockEmployees);
      expect(result.current.isLoading).toBe(false);
      expect(mockSubscribeToEmployees).toHaveBeenCalledTimes(1);
    });

    test('owner powinien mieć dostęp do wszystkich pracowników', async () => {
      const { result } = renderHook(() => useEmployee(), { wrapper: TestWrapper });
      
      await waitFor(() => {
        expect(result.current.filteredEmployees).toHaveLength(3);
      });
      
      expect(result.current.filteredEmployees.map(emp => emp.id)).toEqual(['emp1', 'emp2', 'emp3']);
    });

    test('employee powinien widzieć tylko siebie w filteredEmployees', async () => {
      const employeeAuthContext = {
        user: {
          uid: 'test-user-id-2',
          email: 'anna@example.com',
        },
        loading: false,
      };

      const EmployeeTestWrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthContext.Provider value={employeeAuthContext}>
          <EmployeeProvider>{children}</EmployeeProvider>
        </AuthContext.Provider>
      );
      
      const { result } = renderHook(() => useEmployee(), { wrapper: EmployeeTestWrapper });
      
      await waitFor(() => {
        expect(result.current.filteredEmployees).toHaveLength(1);
      });
      
      expect(result.current.filteredEmployees[0].id).toBe('emp2');
      expect(result.current.filteredEmployees[0].email).toBe('anna@example.com');
    });

    test('powinien poprawnie określać uprawnienia widoku wszystkich pracowników', async () => {
      const { result } = renderHook(() => useEmployee(), { wrapper: TestWrapper });
      
      await waitFor(() => {
        expect(result.current.canViewAllEmployees).toBe(true);
      });
    });

    test('powinien znaleźć aktualnie zalogowanego pracownika', async () => {
      const { result } = renderHook(() => useEmployee(), { wrapper: TestWrapper });
      
      await waitFor(() => {
        expect(result.current.currentEmployee).not.toBeNull();
      });
      
      expect(result.current.currentEmployee).toEqual(mockEmployees[0]);
    });
  });

  describe('Role i uprawnienia', () => {
    test('powinien poprawnie obsługiwać rolę owner', async () => {
      const { result } = renderHook(() => useEmployee(), { wrapper: TestWrapper });
      
      await waitFor(() => {
        expect(result.current.currentEmployee?.userRole).toBe('owner');
      });
      
      expect(result.current.canViewAllEmployees).toBe(true);
    });

    test('powinien poprawnie identyfikować rolę employee', async () => {
      const employeeAuthContext = {
        user: {
          uid: 'test-user-id-2',
          email: 'anna@example.com',
        },
        loading: false,
      };

      const EmployeeTestWrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthContext.Provider value={employeeAuthContext}>
          <EmployeeProvider>{children}</EmployeeProvider>
        </AuthContext.Provider>
      );
      
      const { result } = renderHook(() => useEmployee(), { wrapper: EmployeeTestWrapper });
      
      await waitFor(() => {
        expect(result.current.currentEmployee?.email).toBe('anna@example.com');
      });
      
      expect(result.current.currentEmployee?.userRole).toBe('employee');
      expect(result.current.canViewAllEmployees).toBe(false);
    });
  });

  describe('Godziny pracy', () => {
    test('powinien poprawnie pobierać godziny pracy dla pracownika', async () => {
      const { result } = renderHook(() => useEmployee(), { wrapper: TestWrapper });
      
      await waitFor(() => {
        expect(result.current.allEmployees).toHaveLength(3);
      });
      
      const employeeWorkingHours = result.current.getEmployeeWorkingHours(mockEmployees[0]);
      expect(employeeWorkingHours).toHaveLength(2);
      expect(employeeWorkingHours[0].dayOfWeek).toBe(1);
      expect(employeeWorkingHours[0].startTime).toBe('09:00');
      expect(employeeWorkingHours[0].endTime).toBe('17:00');
    });

    test('powinien zwracać pustą tablicę dla pracownika bez zdefiniowanych godzin', async () => {
      const { result } = renderHook(() => useEmployee(), { wrapper: TestWrapper });
      
      await waitFor(() => {
        expect(result.current.allEmployees).toHaveLength(3);
      });
      
      const employeeWorkingHours = result.current.getEmployeeWorkingHours(mockEmployees[2]);
      expect(employeeWorkingHours).toHaveLength(0);
    });
  });

  describe('Google Calendar', () => {
    test('powinien poprawnie identyfikować pracowników z skonfigurowanym Google Calendar', async () => {
      const { result } = renderHook(() => useEmployee(), { wrapper: TestWrapper });
      
      await waitFor(() => {
        expect(result.current.allEmployees).toHaveLength(3);
      });
      
      const employeesWithGoogleCalendar = result.current.getEmployeesWithGoogleCalendar();
      expect(employeesWithGoogleCalendar).toHaveLength(2);
      expect(employeesWithGoogleCalendar.map(emp => emp.id)).toEqual(['emp1', 'emp2']);
    });

    test('powinien poprawnie pobierać email Google Calendar dla pracownika', async () => {
      const { result } = renderHook(() => useEmployee(), { wrapper: TestWrapper });
      
      await waitFor(() => {
        expect(result.current.allEmployees).toHaveLength(3);
      });
      
      const googleCalendarEmail = result.current.getEmployeeGoogleCalendarEmail(mockEmployees[0]);
      expect(googleCalendarEmail).toBe('jan@gmail.com');
    });

    test('powinien zwracać undefined dla pracownika bez emaila Google Calendar', async () => {
      const { result } = renderHook(() => useEmployee(), { wrapper: TestWrapper });
      
      await waitFor(() => {
        expect(result.current.allEmployees).toHaveLength(3);
      });
      
      const employeeWithoutGoogleCalendar = {
        ...mockEmployees[2],
        googleCalendarEmail: undefined,
      };
      
      const googleCalendarEmail = result.current.getEmployeeGoogleCalendarEmail(employeeWithoutGoogleCalendar);
      expect(googleCalendarEmail).toBeUndefined();
    });
  });
});
