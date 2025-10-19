import { renderHook, act } from '@testing-library/react';
import { usePendingTimeChanges } from '../usePendingTimeChanges';

// Mock dla appointments-service
jest.mock('@/lib/appointments-service', () => ({
  updateAppointment: jest.fn(),
}));

// Mock console.error to avoid noise in test output
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

describe('usePendingTimeChanges - Przypadki brzegowe', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Wielokrotne kliknięcia', () => {
    test('powinien poprawnie obsłużyć wielokrotne kliknięcia +5min przed zatwierdzeniem', () => {
      const { result } = renderHook(() => usePendingTimeChanges());
      
      const appointmentData = {
        start: new Date('2024-01-15T10:00:00'),
        end: new Date('2024-01-15T11:00:00'),
        serviceId: 'service1',
        clientId: 'client1',
        staffName: 'Jan Kowalski',
        status: 'confirmed' as const
      };

      // Symuluj wielokrotne kliknięcia +5min
      act(() => {
        result.current.addTimeChange('appointment1', 5, appointmentData);
        result.current.addTimeChange('appointment1', 5, appointmentData);
        result.current.addTimeChange('appointment1', 5, appointmentData);
        result.current.addTimeChange('appointment1', 5, appointmentData);
        result.current.addTimeChange('appointment1', 5, appointmentData);
      });

      const pendingChange = result.current.getPendingChange('appointment1');
      expect(pendingChange?.minutesDelta).toBe(25); // 5 * 5 = 25 minut
      expect(pendingChange?.newStart).toEqual(new Date('2024-01-15T10:25:00'));
      expect(pendingChange?.newEnd).toEqual(new Date('2024-01-15T11:25:00'));
    });

    test('powinien poprawnie obsłużyć naprzemienne kliknięcia +5min/-5min', () => {
      const { result } = renderHook(() => usePendingTimeChanges());
      
      const appointmentData = {
        start: new Date('2024-01-15T10:00:00'),
        end: new Date('2024-01-15T11:00:00'),
        serviceId: 'service1',
        clientId: 'client1',
        staffName: 'Jan Kowalski',
        status: 'confirmed' as const
      };

      // Symuluj naprzemienne kliknięcia
      act(() => {
        result.current.addTimeChange('appointment1', 5, appointmentData);   // +5min
        result.current.addTimeChange('appointment1', -5, appointmentData);  // 0min
        result.current.addTimeChange('appointment1', 5, appointmentData);   // +5min
        result.current.addTimeChange('appointment1', 5, appointmentData);   // +10min
        result.current.addTimeChange('appointment1', -10, appointmentData); // 0min
        result.current.addTimeChange('appointment1', 15, appointmentData);  // +15min
      });

      const pendingChange = result.current.getPendingChange('appointment1');
      expect(pendingChange?.minutesDelta).toBe(15);
      expect(pendingChange?.newStart).toEqual(new Date('2024-01-15T10:15:00'));
      expect(pendingChange?.newEnd).toEqual(new Date('2024-01-15T11:15:00'));
    });

    test('powinien obsłużyć dużą liczbę małych zmian przed zatwierdzeniem', () => {
      const { result } = renderHook(() => usePendingTimeChanges());
      
      const appointmentData = {
        start: new Date('2024-01-15T10:00:00'),
        end: new Date('2024-01-15T11:00:00'),
        serviceId: 'service1',
        clientId: 'client1',
        staffName: 'Jan Kowalski',
        status: 'confirmed' as const
      };

      // Symuluj 20 małych zmian
      act(() => {
        for (let i = 0; i < 20; i++) {
          result.current.addTimeChange('appointment1', 1, appointmentData);
        }
      });

      const pendingChange = result.current.getPendingChange('appointment1');
      expect(pendingChange?.minutesDelta).toBe(20);
      expect(pendingChange?.newStart).toEqual(new Date('2024-01-15T10:20:00'));
      expect(pendingChange?.newEnd).toEqual(new Date('2024-01-15T11:20:00'));
    });
  });

  describe('Wiele wizyt ze zmianami', () => {
    test('powinien poprawnie zarządzać stanem przy wielu wizytach ze zmianami', () => {
      const { result } = renderHook(() => usePendingTimeChanges());
      
      const appointments = Array.from({ length: 10 }, (_, i) => ({
        id: `appointment${i + 1}`,
        start: new Date(`2024-01-15T${10 + i}:00:00`),
        end: new Date(`2024-01-15T${11 + i}:00:00`),
        serviceId: `service${i + 1}`,
        clientId: `client${i + 1}`,
        staffName: `Pracownik${i + 1}`,
        status: 'confirmed' as const
      }));

      // Dodaj zmiany dla wszystkich wizyt
      act(() => {
        appointments.forEach((appointment, index) => {
          const delta = index % 2 === 0 ? 5 : -10; // Naprzemienne +5min i -10min
          result.current.addTimeChange(appointment.id, delta, appointment);
        });
      });

      // Sprawdź, czy wszystkie wizyty mają zmiany
      expect(Object.keys(result.current.getAllPendingChanges())).toHaveLength(10);
      
      // Sprawdź poprawność zmian
      appointments.forEach((appointment, index) => {
        const expectedDelta = index % 2 === 0 ? 5 : -10;
        const pendingChange = result.current.getPendingChange(appointment.id);
        expect(pendingChange?.minutesDelta).toBe(expectedDelta);
      });
    });

    test('powinien poprawnie zatwierdzić zmiany dla wielu wizyt', async () => {
      const { result } = renderHook(() => usePendingTimeChanges());
      const { updateAppointment } = require('@/lib/appointments-service');
      
      updateAppointment.mockResolvedValue(undefined);
      
      const appointments = [
        {
          id: 'appointment1',
          start: new Date('2024-01-15T10:00:00'),
          end: new Date('2024-01-15T11:00:00'),
          serviceId: 'service1',
          clientId: 'client1',
          staffName: 'Jan Kowalski',
          status: 'confirmed' as const
        },
        {
          id: 'appointment2',
          start: new Date('2024-01-15T12:00:00'),
          end: new Date('2024-01-15T13:00:00'),
          serviceId: 'service2',
          clientId: 'client2',
          staffName: 'Anna Nowak',
          status: 'pending' as const
        },
        {
          id: 'appointment3',
          start: new Date('2024-01-15T14:00:00'),
          end: new Date('2024-01-15T15:00:00'),
          serviceId: 'service3',
          clientId: 'client3',
          staffName: 'Piotr Wiśniewski',
          status: 'confirmed' as const
        }
      ];

      // Dodaj zmiany dla wszystkich wizyt
      act(() => {
        appointments.forEach((appointment, index) => {
          const delta = (index + 1) * 5; // 5, 10, 15 minut
          result.current.addTimeChange(appointment.id, delta, appointment);
        });
      });

      // Zatwierdź wszystkie zmiany
      const results = await act(async () => {
        return await result.current.commitAllChanges();
      });

      expect(results).toHaveLength(3);
      expect(results.every(r => r.success)).toBe(true);
      expect(result.current.getAllPendingChanges()).toEqual({});
    });

    test('powinien poprawnie obsłużyć błędy przy zatwierdzaniu wielu wizyt', async () => {
      const { result } = renderHook(() => usePendingTimeChanges());
      const { updateAppointment } = require('@/lib/appointments-service');
      
      // Mock: druga aktualizacja się nie powiedzie
      updateAppointment
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('Błąd połączenia'))
        .mockResolvedValueOnce(undefined);
      
      const appointments = [
        {
          id: 'appointment1',
          start: new Date('2024-01-15T10:00:00'),
          end: new Date('2024-01-15T11:00:00'),
          serviceId: 'service1',
          clientId: 'client1',
          staffName: 'Jan Kowalski',
          status: 'confirmed' as const
        },
        {
          id: 'appointment2',
          start: new Date('2024-01-15T12:00:00'),
          end: new Date('2024-01-15T13:00:00'),
          serviceId: 'service2',
          clientId: 'client2',
          staffName: 'Anna Nowak',
          status: 'pending' as const
        },
        {
          id: 'appointment3',
          start: new Date('2024-01-15T14:00:00'),
          end: new Date('2024-01-15T15:00:00'),
          serviceId: 'service3',
          clientId: 'client3',
          staffName: 'Piotr Wiśniewski',
          status: 'confirmed' as const
        }
      ];

      // Dodaj zmiany dla wszystkich wizyt
      act(() => {
        appointments.forEach((appointment) => {
          result.current.addTimeChange(appointment.id, 5, appointment);
        });
      });

      // Zatwierdź wszystkie zmiany
      const results = await act(async () => {
        return await result.current.commitAllChanges();
      });

      expect(results).toHaveLength(3);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[2].success).toBe(true);
      
      // Tylko wizyty z udanymi zmianami powinny być usunięte
      expect(result.current.hasPendingChange('appointment1')).toBe(false);
      expect(result.current.hasPendingChange('appointment2')).toBe(true);
      expect(result.current.hasPendingChange('appointment3')).toBe(false);
    });
  });

  describe('Zarządzanie stanem', () => {
    test('powinien poprawnie cofnąć zmianę po wielu korektach', () => {
      const { result } = renderHook(() => usePendingTimeChanges());
      
      const appointmentData = {
        start: new Date('2024-01-15T10:00:00'),
        end: new Date('2024-01-15T11:00:00'),
        serviceId: 'service1',
        clientId: 'client1',
        staffName: 'Jan Kowalski',
        status: 'confirmed' as const
      };

      // Dodaj wiele zmian
      act(() => {
        result.current.addTimeChange('appointment1', 5, appointmentData);
        result.current.addTimeChange('appointment1', 5, appointmentData);
        result.current.addTimeChange('appointment1', -5, appointmentData);
        result.current.addTimeChange('appointment1', 10, appointmentData);
      });

      const pendingChange = result.current.getPendingChange('appointment1');
      expect(pendingChange?.minutesDelta).toBe(15); // 5 + 5 - 5 + 10 = 15

      // Cofnij zmianę
      act(() => {
        result.current.revertChange('appointment1');
      });

      expect(result.current.hasPendingChange('appointment1')).toBe(false);
    });

    test('powinien poprawnie zarządzać stanem przy przełączaniu dni', () => {
      const { result } = renderHook(() => usePendingTimeChanges());
      
      // Dodaj zmiany dla różnych dni
      const todayAppointments = [
        {
          id: 'today1',
          start: new Date('2024-01-15T10:00:00'),
          end: new Date('2024-01-15T11:00:00'),
          serviceId: 'service1',
          clientId: 'client1',
          staffName: 'Jan Kowalski',
          status: 'confirmed' as const
        },
        {
          id: 'today2',
          start: new Date('2024-01-15T14:00:00'),
          end: new Date('2024-01-15T15:00:00'),
          serviceId: 'service2',
          clientId: 'client2',
          staffName: 'Anna Nowak',
          status: 'pending' as const
        }
      ];

      const tomorrowAppointments = [
        {
          id: 'tomorrow1',
          start: new Date('2024-01-16T09:00:00'),
          end: new Date('2024-01-16T10:00:00'),
          serviceId: 'service3',
          clientId: 'client3',
          staffName: 'Piotr Wiśniewski',
          status: 'confirmed' as const
        }
      ];

      // Dodaj zmiany dla wszystkich wizyt
      act(() => {
        todayAppointments.forEach(appointment => {
          result.current.addTimeChange(appointment.id, 5, appointment);
        });
        
        tomorrowAppointments.forEach(appointment => {
          result.current.addTimeChange(appointment.id, -10, appointment);
        });
      });

      // Sprawdź stan przed zmianą dnia
      expect(Object.keys(result.current.getAllPendingChanges())).toHaveLength(3);

      // Symuluj zmianę dnia - cofnij wszystkie zmiany dla dnia następnego
      act(() => {
        tomorrowAppointments.forEach(appointment => {
          result.current.revertChange(appointment.id);
        });
      });

      // Sprawdź stan po zmianie dnia
      expect(Object.keys(result.current.getAllPendingChanges())).toHaveLength(2);
      expect(result.current.hasPendingChange('today1')).toBe(true);
      expect(result.current.hasPendingChange('today2')).toBe(true);
      expect(result.current.hasPendingChange('tomorrow1')).toBe(false);
    });
  });

  describe('Wydajność', () => {
    test('powinien wydajnie obsłużyć dużą liczbę zmian', () => {
      const { result } = renderHook(() => usePendingTimeChanges());
      
      const baseAppointmentData = {
        start: new Date('2024-01-15T10:00:00'),
        end: new Date('2024-01-15T11:00:00'),
        serviceId: 'service1',
        clientId: 'client1',
        staffName: 'Jan Kowalski',
        status: 'confirmed' as const
      };

      const startTime = performance.now();
      
      // Dodaj 100 zmian
      act(() => {
        for (let i = 0; i < 100; i++) {
          result.current.addTimeChange(`appointment${i}`, i % 20 - 10, baseAppointmentData);
        }
      });
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      // Sprawdź, czy operacja zajęła rozsądny czas (mniej niż 100ms)
      expect(executionTime).toBeLessThan(100);
      expect(Object.keys(result.current.getAllPendingChanges())).toHaveLength(100);
    });
  });
});