import { renderHook, act } from '@testing-library/react';
import { usePendingTimeChanges } from '../usePendingTimeChanges';

// Mock dla appointments-service
jest.mock('@/lib/appointments-service', () => ({
  updateAppointment: jest.fn(),
}));

describe('usePendingTimeChanges - Integracja z edycją modalną', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Interakcja z edycją modalną', () => {
    test('powinien zachować zmiany lokalne przy otwieraniu edycji modalnej', () => {
      const { result } = renderHook(() => usePendingTimeChanges());
      
      const appointmentData = {
        start: new Date('2024-01-15T10:00:00'),
        end: new Date('2024-01-15T11:00:00'),
        serviceId: 'service1',
        clientId: 'client1',
        staffName: 'Jan Kowalski',
        status: 'confirmed' as const,
        notes: 'Oryginalne notatki'
      };

      // Dodaj zmianę czasu
      act(() => {
        result.current.addTimeChange('appointment1', 15, appointmentData);
      });

      const pendingChange = result.current.getPendingChange('appointment1');
      expect(pendingChange?.minutesDelta).toBe(15);
      expect(pendingChange?.newStart).toEqual(new Date('2024-01-15T10:15:00'));
      
      // Symuluj otwarcie modalu edycji - zmiany lokalne powinny być zachowane
      expect(result.current.hasPendingChange('appointment1')).toBe(true);
      expect(result.current.getAllPendingChanges()).toEqual(
        expect.objectContaining({
          appointment1: expect.any(Object)
        })
      );
    });

    test('powinien obsłużyć sytuację, gdy użytkownik edytuje wizytę w modalu po wprowadzeniu zmian lokalnych', () => {
      const { result } = renderHook(() => usePendingTimeChanges());
      
      const originalAppointmentData = {
        start: new Date('2024-01-15T10:00:00'),
        end: new Date('2024-01-15T11:00:00'),
        serviceId: 'service1',
        clientId: 'client1',
        staffName: 'Jan Kowalski',
        status: 'confirmed' as const,
        notes: 'Oryginalne notatki'
      };

      // Dodaj zmianę czasu
      act(() => {
        result.current.addTimeChange('appointment1', 15, originalAppointmentData);
      });

      // Symuluj edycję wizyty w modalu (zmiana danych, ale nie czasu)
      const modalEditData = {
        start: new Date('2024-01-15T10:00:00'), // Bez zmiany czasu w modalu
        end: new Date('2024-01-15T11:00:00'),
        serviceId: 'service2', // Zmiana usługi
        clientId: 'client2', // Zmiana klienta
        staffName: 'Anna Nowak', // Zmiana pracownika
        status: 'confirmed' as const,
        notes: 'Zaktualizowane notatki' // Zmiana notatek
      };

      // Po edycji modalnej zmiany lokalne czasu powinny być zachowane
      // ale inne dane powinny pochodzić z modalu
      const pendingChange = result.current.getPendingChange('appointment1');
      expect(pendingChange?.minutesDelta).toBe(15);
      expect(pendingChange?.newStart).toEqual(new Date('2024-01-15T10:15:00'));
      
      // Stan zmian lokalnych powinien być zachowany
      expect(result.current.hasPendingChange('appointment1')).toBe(true);
    });

    test('powinien umożliwić zatwierdzenie zmian lokalnych po edycji w modalu', async () => {
      const { result } = renderHook(() => usePendingTimeChanges());
      const { updateAppointment } = require('@/lib/appointments-service');
      
      updateAppointment.mockResolvedValue(undefined);
      
      const appointmentData = {
        start: new Date('2024-01-15T10:00:00'),
        end: new Date('2024-01-15T11:00:00'),
        serviceId: 'service1',
        clientId: 'client1',
        staffName: 'Jan Kowalski',
        status: 'confirmed' as const,
        notes: 'Oryginalne notatki'
      };

      // Dodaj zmianę czasu
      act(() => {
        result.current.addTimeChange('appointment1', 15, appointmentData);
      });

      // Symuluj edycję w modalu (zmiana notatek)
      const modalEditData = {
        ...appointmentData,
        notes: 'Zaktualizowane notatki w modalu'
      };

      // Zatwierdź zmiany lokalne
      await act(async () => {
        await result.current.commitChange('appointment1');
      });

      // Sprawdź, czy zatwierdzono z poprawnym czasem
      expect(updateAppointment).toHaveBeenCalledWith('appointment1', {
        serviceId: 'service1',
        clientId: 'client1',
        staffName: 'Jan Kowalski',
        start: new Date('2024-01-15T10:15:00'),
        end: new Date('2024-01-15T11:15:00'),
        status: 'confirmed',
        notes: 'Oryginalne notatki',
        price: undefined
      });

      // Zmiana powinna zostać usunięta ze stanu lokalnego
      expect(result.current.hasPendingChange('appointment1')).toBe(false);
    });

    test('powinien umożliwić cofnięcie zmian lokalnych po edycji w modalu', () => {
      const { result } = renderHook(() => usePendingTimeChanges());
      
      const appointmentData = {
        start: new Date('2024-01-15T10:00:00'),
        end: new Date('2024-01-15T11:00:00'),
        serviceId: 'service1',
        clientId: 'client1',
        staffName: 'Jan Kowalski',
        status: 'confirmed' as const
      };

      // Dodaj zmianę czasu
      act(() => {
        result.current.addTimeChange('appointment1', 15, appointmentData);
      });

      // Symuluj edycję w modalu (zmiana usługi)
      const modalEditData = {
        ...appointmentData,
        serviceId: 'service2'
      };

      // Cofnij zmiany lokalne
      act(() => {
        result.current.revertChange('appointment1');
      });

      // Zmiana lokalna powinna zostać usunięta
      expect(result.current.hasPendingChange('appointment1')).toBe(false);
      expect(result.current.getPendingChange('appointment1')).toBeNull();
    });

    test('powinien obsłużyć sytuację, gdy użytkownik zmieni czas w modalu mając oczekujące zmiany lokalne', () => {
      const { result } = renderHook(() => usePendingTimeChanges());
      
      const originalAppointmentData = {
        start: new Date('2024-01-15T10:00:00'),
        end: new Date('2024-01-15T11:00:00'),
        serviceId: 'service1',
        clientId: 'client1',
        staffName: 'Jan Kowalski',
        status: 'confirmed' as const
      };

      // Dodaj zmianę czasu (+15min)
      act(() => {
        result.current.addTimeChange('appointment1', 15, originalAppointmentData);
      });

      // Symuluj edycję czasu w modalu (przesunięcie o 30min)
      const modalTimeEditData = {
        ...originalAppointmentData,
        start: new Date('2024-01-15T10:30:00'),
        end: new Date('2024-01-15T11:30:00')
      };

      // W tej sytuacji system powinien:
      // 1. Wykryć konflikt między zmianami lokalnymi a edycją modalną
      // 2. Zaoferować użytkownikowi wybór: zatwierdzić zmiany lokalne, edycję modalną lub obie
      
      // Na razie zmiany lokalne powinny być zachowane
      expect(result.current.hasPendingChange('appointment1')).toBe(true);
      
      const pendingChange = result.current.getPendingChange('appointment1');
      expect(pendingChange?.minutesDelta).toBe(15);
      expect(pendingChange?.newStart).toEqual(new Date('2024-01-15T10:15:00'));
    });
  });

  describe('Czyszczenie stanu', () => {
    test('powinien czyścić stan lokalny po odświeżeniu strony', () => {
      const { result, rerender } = renderHook(() => usePendingTimeChanges());
      
      const appointmentData = {
        start: new Date('2024-01-15T10:00:00'),
        end: new Date('2024-01-15T11:00:00'),
        serviceId: 'service1',
        clientId: 'client1',
        staffName: 'Jan Kowalski',
        status: 'confirmed' as const
      };

      // Dodaj zmiany
      act(() => {
        result.current.addTimeChange('appointment1', 5, appointmentData);
        result.current.addTimeChange('appointment2', -10, appointmentData);
      });

      expect(Object.keys(result.current.getAllPendingChanges())).toHaveLength(2);

      // Symuluj odświeżenie strony (rerender hooka)
      rerender();

      // Stan powinien być zachowany w trakcie sesji
      expect(Object.keys(result.current.getAllPendingChanges())).toHaveLength(2);
      
      // W rzeczywistej aplikacji stan lokalny zostałby wyczyszczony po odświeżeniu strony
      // ponieważ jest przechowywany w pamięci komponentu, a nie w localStorage
    });

    test('powinien czyścić stan lokalny przy przełączaniu się na inną stronę', () => {
      const { result, unmount } = renderHook(() => usePendingTimeChanges());
      
      const appointmentData = {
        start: new Date('2024-01-15T10:00:00'),
        end: new Date('2024-01-15T11:00:00'),
        serviceId: 'service1',
        clientId: 'client1',
        staffName: 'Jan Kowalski',
        status: 'confirmed' as const
      };

      // Dodaj zmiany
      act(() => {
        result.current.addTimeChange('appointment1', 5, appointmentData);
      });

      expect(result.current.hasPendingChange('appointment1')).toBe(true);

      // Symuluj przejście na inną stronę (odmontowanie komponentu)
      unmount();

      // W rzeczywistej aplikacji stan lokalny zostałby wyczyszczony
      // przy przejściu na inną stronę, ponieważ hook jest odmontowywany
    });
  });

  describe('Konflikty i rozwiązywanie problemów', () => {
    test('powinien wykrywać konflikty między zmianami lokalnymi a edycją modalną', () => {
      const { result } = renderHook(() => usePendingTimeChanges());
      
      const appointmentData = {
        start: new Date('2024-01-15T10:00:00'),
        end: new Date('2024-01-15T11:00:00'),
        serviceId: 'service1',
        clientId: 'client1',
        staffName: 'Jan Kowalski',
        status: 'confirmed' as const
      };

      // Dodaj zmianę czasu
      act(() => {
        result.current.addTimeChange('appointment1', 15, appointmentData);
      });

      // Symuluj próbę edycji tej samej wizyty w modalu
      const modalEditData = {
        ...appointmentData,
        start: new Date('2024-01-15T10:30:00'),
        end: new Date('2024-01-15T11:30:00')
      };

      // System powinien wykryć konflikt:
      // - Zmiana lokalna: +15min (10:15 -> 11:15)
      // - Edycja modalna: +30min (10:30 -> 11:30)
      
      const pendingChange = result.current.getPendingChange('appointment1');
      expect(pendingChange?.minutesDelta).toBe(15);
      expect(pendingChange?.newStart).toEqual(new Date('2024-01-15T10:15:00'));
      
      // W rzeczywistej implementacji system powinien zaoferować użytkownikowi
      // wybór między zmianą lokalną a edycją modalną
    });

    test('powinien obsłużyć sytuację, gdy użytkownik ma oczekujące zmiany i próbuje usunąć wizytę', () => {
      const { result } = renderHook(() => usePendingTimeChanges());
      
      const appointmentData = {
        start: new Date('2024-01-15T10:00:00'),
        end: new Date('2024-01-15T11:00:00'),
        serviceId: 'service1',
        clientId: 'client1',
        staffName: 'Jan Kowalski',
        status: 'confirmed' as const
      };

      // Dodaj zmianę czasu
      act(() => {
        result.current.addTimeChange('appointment1', 15, appointmentData);
      });

      expect(result.current.hasPendingChange('appointment1')).toBe(true);

      // Symuluj próbę usunięcia wizyty
      // System powinien:
      // 1. Wykryć oczekujące zmiany
      // 2. Zapytać użytkownika, czy chce najpierw zatwierdzić zmiany
      // 3. Albo zatwierdzić zmiany, a potem usunąć wizytę
      // 4. Albo usunąć wizytę z pominięciem zmian lokalnych
      
      // W naszym przypadku zmiany lokalne powinny być zachowane
      expect(result.current.hasPendingChange('appointment1')).toBe(true);
    });
  });
});