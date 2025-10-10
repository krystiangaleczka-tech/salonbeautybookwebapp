import { renderHook, act } from '@testing-library/react';
import { usePendingTimeChanges } from '../usePendingTimeChanges';

// Mock dla appointments-service
jest.mock('@/lib/appointments-service', () => ({
  updateAppointment: jest.fn(),
}));

describe('usePendingTimeChanges', () => {
  beforeEach(() => {
    // Resetuj mocki przed każdym testem
    jest.clearAllMocks();
  });

  describe('Podstawowa funkcjonalność', () => {
    test('powinien zaczynać z pustym stanem oczekujących zmian', () => {
      const { result } = renderHook(() => usePendingTimeChanges());
      
      expect(result.current.pendingChanges).toEqual({});
      expect(result.current.getAllPendingChanges()).toEqual({});
    });

    test('powinien dodawać nową zmianę czasu dla wizyty', () => {
      const { result } = renderHook(() => usePendingTimeChanges());
      
      const appointmentData = {
        start: new Date('2024-01-15T10:00:00'),
        end: new Date('2024-01-15T11:00:00'),
        serviceId: 'service1',
        clientId: 'client1',
        staffName: 'Jan Kowalski',
        status: 'confirmed' as const,
        notes: 'Test notes',
        price: 100
      };

      act(() => {
        result.current.addTimeChange('appointment1', 5, appointmentData);
      });

      expect(result.current.hasPendingChange('appointment1')).toBe(true);
      
      const pendingChange = result.current.getPendingChange('appointment1');
      expect(pendingChange).not.toBeNull();
      expect(pendingChange?.appointmentId).toBe('appointment1');
      expect(pendingChange?.minutesDelta).toBe(5);
      expect(pendingChange?.originalStart).toEqual(appointmentData.start);
      expect(pendingChange?.originalEnd).toEqual(appointmentData.end);
      expect(pendingChange?.newStart).toEqual(new Date('2024-01-15T10:05:00'));
      expect(pendingChange?.newEnd).toEqual(new Date('2024-01-15T11:05:00'));
    });

    test('powinien poprawnie obliczać nowy czas przy ujemnej delta', () => {
      const { result } = renderHook(() => usePendingTimeChanges());
      
      const appointmentData = {
        start: new Date('2024-01-15T10:00:00'),
        end: new Date('2024-01-15T11:00:00'),
        serviceId: 'service1',
        clientId: 'client1',
        staffName: 'Jan Kowalski',
        status: 'confirmed' as const
      };

      act(() => {
        result.current.addTimeChange('appointment1', -10, appointmentData);
      });

      const pendingChange = result.current.getPendingChange('appointment1');
      expect(pendingChange?.minutesDelta).toBe(-10);
      expect(pendingChange?.newStart).toEqual(new Date('2024-01-15T09:50:00'));
      expect(pendingChange?.newEnd).toEqual(new Date('2024-01-15T10:50:00'));
    });

    test('powinien aktualizować istniejącą zmianę przy wielokrotnych kliknięciach', () => {
      const { result } = renderHook(() => usePendingTimeChanges());
      
      const appointmentData = {
        start: new Date('2024-01-15T10:00:00'),
        end: new Date('2024-01-15T11:00:00'),
        serviceId: 'service1',
        clientId: 'client1',
        staffName: 'Jan Kowalski',
        status: 'confirmed' as const
      };

      // Pierwsza zmiana: +5 minut
      act(() => {
        result.current.addTimeChange('appointment1', 5, appointmentData);
      });

      let pendingChange = result.current.getPendingChange('appointment1');
      expect(pendingChange?.minutesDelta).toBe(5);
      expect(pendingChange?.newStart).toEqual(new Date('2024-01-15T10:05:00'));

      // Druga zmiana: kolejne +5 minut (łącznie +10)
      act(() => {
        result.current.addTimeChange('appointment1', 5, appointmentData);
      });

      pendingChange = result.current.getPendingChange('appointment1');
      expect(pendingChange?.minutesDelta).toBe(10);
      expect(pendingChange?.newStart).toEqual(new Date('2024-01-15T10:10:00'));

      // Trzecia zmiana: -5 minut (łącznie +5)
      act(() => {
        result.current.addTimeChange('appointment1', -5, appointmentData);
      });

      pendingChange = result.current.getPendingChange('appointment1');
      expect(pendingChange?.minutesDelta).toBe(5);
      expect(pendingChange?.newStart).toEqual(new Date('2024-01-15T10:05:00'));
    });

    test('powinien obsługiwać wiele wizyt ze zmianami jednocześnie', () => {
      const { result } = renderHook(() => usePendingTimeChanges());
      
      const appointmentData1 = {
        start: new Date('2024-01-15T10:00:00'),
        end: new Date('2024-01-15T11:00:00'),
        serviceId: 'service1',
        clientId: 'client1',
        staffName: 'Jan Kowalski',
        status: 'confirmed' as const
      };

      const appointmentData2 = {
        start: new Date('2024-01-15T12:00:00'),
        end: new Date('2024-01-15T13:00:00'),
        serviceId: 'service2',
        clientId: 'client2',
        staffName: 'Anna Nowak',
        status: 'pending' as const
      };

      act(() => {
        result.current.addTimeChange('appointment1', 5, appointmentData1);
        result.current.addTimeChange('appointment2', -10, appointmentData2);
      });

      expect(result.current.hasPendingChange('appointment1')).toBe(true);
      expect(result.current.hasPendingChange('appointment2')).toBe(true);
      expect(result.current.hasPendingChange('appointment3')).toBe(false);

      const pendingChange1 = result.current.getPendingChange('appointment1');
      const pendingChange2 = result.current.getPendingChange('appointment2');
      
      expect(pendingChange1?.minutesDelta).toBe(5);
      expect(pendingChange2?.minutesDelta).toBe(-10);
      
      const allChanges = result.current.getAllPendingChanges();
      expect(Object.keys(allChanges)).toHaveLength(2);
    });
  });

  describe('Cofanie zmian', () => {
    test('powinien cofać pojedynczą zmianę', () => {
      const { result } = renderHook(() => usePendingTimeChanges());
      
      const appointmentData = {
        start: new Date('2024-01-15T10:00:00'),
        end: new Date('2024-01-15T11:00:00'),
        serviceId: 'service1',
        clientId: 'client1',
        staffName: 'Jan Kowalski',
        status: 'confirmed' as const
      };

      act(() => {
        result.current.addTimeChange('appointment1', 5, appointmentData);
      });

      expect(result.current.hasPendingChange('appointment1')).toBe(true);

      act(() => {
        result.current.revertChange('appointment1');
      });

      expect(result.current.hasPendingChange('appointment1')).toBe(false);
      expect(result.current.getPendingChange('appointment1')).toBeNull();
    });

    test('powinien cofać wszystkie zmiany', () => {
      const { result } = renderHook(() => usePendingTimeChanges());
      
      const appointmentData1 = {
        start: new Date('2024-01-15T10:00:00'),
        end: new Date('2024-01-15T11:00:00'),
        serviceId: 'service1',
        clientId: 'client1',
        staffName: 'Jan Kowalski',
        status: 'confirmed' as const
      };

      const appointmentData2 = {
        start: new Date('2024-01-15T12:00:00'),
        end: new Date('2024-01-15T13:00:00'),
        serviceId: 'service2',
        clientId: 'client2',
        staffName: 'Anna Nowak',
        status: 'pending' as const
      };

      act(() => {
        result.current.addTimeChange('appointment1', 5, appointmentData1);
        result.current.addTimeChange('appointment2', -10, appointmentData2);
      });

      expect(result.current.getAllPendingChanges()).toEqual(
        expect.objectContaining({
          appointment1: expect.any(Object),
          appointment2: expect.any(Object)
        })
      );

      act(() => {
        result.current.revertAllChanges();
      });

      expect(result.current.getAllPendingChanges()).toEqual({});
      expect(result.current.hasPendingChange('appointment1')).toBe(false);
      expect(result.current.hasPendingChange('appointment2')).toBe(false);
    });
  });

  describe('Obsługa błędów', () => {
    test('powinien rzucić błąd przy próbie zatwierdzenia nieistniejącej zmiany', async () => {
      const { result } = renderHook(() => usePendingTimeChanges());
      
      await expect(result.current.commitChange('nonexistent')).rejects.toThrow(
        'Brak oczekującej zmiany dla wizyty nonexistent'
      );
    });

    test('powinien obsługiwać próbę cofnięcia nieistniejącej zmiany', () => {
      const { result } = renderHook(() => usePendingTimeChanges());
      
      // Nie powinien rzucić błędu przy próbie cofnięcia nieistniejącej zmiany
      expect(() => {
        act(() => {
          result.current.revertChange('nonexistent');
        });
      }).not.toThrow();
      
      expect(result.current.hasPendingChange('nonexistent')).toBe(false);
    });
  });
});