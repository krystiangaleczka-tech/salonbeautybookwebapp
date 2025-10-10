import { renderHook, act } from '@testing-library/react';
import { usePendingTimeChanges } from '../usePendingTimeChanges';

// Mock dla appointments-service
jest.mock('@/lib/appointments-service', () => ({
  updateAppointment: jest.fn(),
}));

describe('usePendingTimeChanges - Przepływ zatwierdzania', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Zatwierdzanie zmian', () => {
    test('powinien zatwierdzić pojedynczą zmianę i usunąć ją z stanu', async () => {
      const { result } = renderHook(() => usePendingTimeChanges());
      const { updateAppointment } = require('@/lib/appointments-service');
      
      // Mock successful update
      updateAppointment.mockResolvedValue(undefined);
      
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

      // Dodaj zmianę
      act(() => {
        result.current.addTimeChange('appointment1', 5, appointmentData);
      });

      expect(result.current.hasPendingChange('appointment1')).toBe(true);

      // Zatwierdź zmianę
      await act(async () => {
        await result.current.commitChange('appointment1');
      });

      // Sprawdź, czy zmiana została usunięta
      expect(result.current.hasPendingChange('appointment1')).toBe(false);
      expect(updateAppointment).toHaveBeenCalledWith('appointment1', {
        serviceId: 'service1',
        clientId: 'client1',
        staffName: 'Jan Kowalski',
        start: new Date('2024-01-15T10:05:00'),
        end: new Date('2024-01-15T11:05:00'),
        status: 'confirmed',
        notes: 'Test notes',
        price: 100
      });
    });

    test('powinien obsłużyć błąd podczas zatwierdzania zmiany', async () => {
      const { result } = renderHook(() => usePendingTimeChanges());
      const { updateAppointment } = require('@/lib/appointments-service');
      
      // Mock failed update
      updateAppointment.mockRejectedValue(new Error('Błąd bazy danych'));
      
      const appointmentData = {
        start: new Date('2024-01-15T10:00:00'),
        end: new Date('2024-01-15T11:00:00'),
        serviceId: 'service1',
        clientId: 'client1',
        staffName: 'Jan Kowalski',
        status: 'confirmed' as const
      };

      // Dodaj zmianę
      act(() => {
        result.current.addTimeChange('appointment1', 5, appointmentData);
      });

      expect(result.current.hasPendingChange('appointment1')).toBe(true);

      // Próba zatwierdzenia zmiany (która się nie powiedzie)
      let error;
      try {
        await act(async () => {
          await result.current.commitChange('appointment1');
        });
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.message).toBe('Błąd bazy danych');
      
      // Zmiana powinna pozostać w stanie po błędzie
      expect(result.current.hasPendingChange('appointment1')).toBe(true);
    });

    test('powinien zatwierdzić wszystkie zmiany naraz', async () => {
      const { result } = renderHook(() => usePendingTimeChanges());
      const { updateAppointment } = require('@/lib/appointments-service');
      
      // Mock successful updates
      updateAppointment.mockResolvedValue(undefined);
      
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

      // Dodaj dwie zmiany
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

      // Zatwierdź wszystkie zmiany
      const results = await act(async () => {
        return await result.current.commitAllChanges();
      });

      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({ appointmentId: 'appointment1', success: true });
      expect(results[1]).toEqual({ appointmentId: 'appointment2', success: true });
      
      // Sprawdź, czy wszystkie zmiany zostały usunięte
      expect(result.current.getAllPendingChanges()).toEqual({});
    });

    test('powinien obsłużyć częściowe błędy podczas zatwierdzania wszystkich zmian', async () => {
      const { result } = renderHook(() => usePendingTimeChanges());
      const { updateAppointment } = require('@/lib/appointments-service');
      
      // Mock mixed results
      updateAppointment
        .mockResolvedValueOnce(undefined) // First succeeds
        .mockRejectedValueOnce(new Error('Błąd sieci')); // Second fails
      
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

      // Dodaj dwie zmiany
      act(() => {
        result.current.addTimeChange('appointment1', 5, appointmentData1);
        result.current.addTimeChange('appointment2', -10, appointmentData2);
      });

      // Zatwierdź wszystkie zmiany
      const results = await act(async () => {
        return await result.current.commitAllChanges();
      });

      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({ appointmentId: 'appointment1', success: true });
      expect(results[1]).toEqual({ 
        appointmentId: 'appointment2', 
        success: false, 
        error: 'Błąd sieci' 
      });
      
      // Tylko udana zmiana powinna zostać usunięta
      expect(result.current.hasPendingChange('appointment1')).toBe(false);
      expect(result.current.hasPendingChange('appointment2')).toBe(true);
    });
  });

  describe('Cofanie zmian', () => {
    test('powinien cofnąć zmianę i usunąć ją z stanu', () => {
      const { result } = renderHook(() => usePendingTimeChanges());
      
      const appointmentData = {
        start: new Date('2024-01-15T10:00:00'),
        end: new Date('2024-01-15T11:00:00'),
        serviceId: 'service1',
        clientId: 'client1',
        staffName: 'Jan Kowalski',
        status: 'confirmed' as const
      };

      // Dodaj zmianę
      act(() => {
        result.current.addTimeChange('appointment1', 5, appointmentData);
      });

      expect(result.current.hasPendingChange('appointment1')).toBe(true);

      // Cofnij zmianę
      act(() => {
        result.current.revertChange('appointment1');
      });

      expect(result.current.hasPendingChange('appointment1')).toBe(false);
      expect(result.current.getPendingChange('appointment1')).toBeNull();
    });

    test('powinien obsłużyć cofnięcie nieistniejącej zmiany', () => {
      const { result } = renderHook(() => usePendingTimeChanges());
      
      // Nie powinien rzucić błędu
      expect(() => {
        act(() => {
          result.current.revertChange('nonexistent');
        });
      }).not.toThrow();
      
      expect(result.current.hasPendingChange('nonexistent')).toBe(false);
    });
  });

  describe('Scenariusze brzegowe', () => {
    test('powinien poprawnie obsłużyć wielokrotne zmiany przed zatwierdzeniem', async () => {
      const { result } = renderHook(() => usePendingTimeChanges());
      const { updateAppointment } = require('@/lib/appointments-service');
      
      updateAppointment.mockResolvedValue(undefined);
      
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
        result.current.addTimeChange('appointment1', -10, appointmentData);
      });

      const pendingChange = result.current.getPendingChange('appointment1');
      expect(pendingChange?.minutesDelta).toBe(0); // 5 + 5 - 10 = 0
      
      // Zatwierdź zmianę
      await act(async () => {
        await result.current.commitChange('appointment1');
      });

      expect(result.current.hasPendingChange('appointment1')).toBe(false);
      
      // Sprawdź, czy zatwierdzono z ostatecznym czasem (bez zmian)
      expect(updateAppointment).toHaveBeenCalledWith('appointment1', {
        serviceId: 'service1',
        clientId: 'client1',
        staffName: 'Jan Kowalski',
        start: new Date('2024-01-15T10:00:00'), // Oryginalny czas
        end: new Date('2024-01-15T11:00:00'), // Oryginalny czas
        status: 'confirmed',
        notes: undefined,
        price: undefined
      });
    });

    test('powinien poprawnie zarządzać stanem przy przełączaniu dni', () => {
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
        start: new Date('2024-01-16T14:00:00'),
        end: new Date('2024-01-16T15:00:00'),
        serviceId: 'service2',
        clientId: 'client2',
        staffName: 'Anna Nowak',
        status: 'pending' as const
      };

      // Dodaj zmiany dla różnych dni
      act(() => {
        result.current.addTimeChange('appointment1', 15, appointmentData1);
        result.current.addTimeChange('appointment2', -5, appointmentData2);
      });

      // Stan powinien zawierać obie zmiany
      expect(Object.keys(result.current.getAllPendingChanges())).toHaveLength(2);
      
      // Cofnij zmianę tylko dla jednego dnia
      act(() => {
        result.current.revertChange('appointment1');
      });

      // Stan powinien zawierać tylko jedną zmianę
      expect(Object.keys(result.current.getAllPendingChanges())).toHaveLength(1);
      expect(result.current.hasPendingChange('appointment1')).toBe(false);
      expect(result.current.hasPendingChange('appointment2')).toBe(true);
    });
  });
});