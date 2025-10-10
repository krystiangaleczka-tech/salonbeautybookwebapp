import { renderHook, act } from '@testing-library/react';
import { usePendingTimeChanges } from '../usePendingTimeChanges';

// Mock dla appointments-service
jest.mock('@/lib/appointments-service', () => ({
  updateAppointment: jest.fn(),
}));

describe('usePendingTimeChanges - Wydajność i wycieki pamięci', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Wydajność', () => {
    test('powinien wydajnie obsłużyć dużą liczbę zmian bez spowolnienia', () => {
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
      
      // Dodaj 1000 zmian
      act(() => {
        for (let i = 0; i < 1000; i++) {
          result.current.addTimeChange(`appointment${i}`, i % 60 - 30, baseAppointmentData);
        }
      });
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      // Sprawdź, czy operacja zajęła rozsądny czas (mniej niż 500ms)
      expect(executionTime).toBeLessThan(500);
      expect(Object.keys(result.current.getAllPendingChanges())).toHaveLength(1000);
    });

    test('powinien wydajnie obsłużyć wielokrotne zmiany dla tej samej wizyty', () => {
      const { result } = renderHook(() => usePendingTimeChanges());
      
      const appointmentData = {
        start: new Date('2024-01-15T10:00:00'),
        end: new Date('2024-01-15T11:00:00'),
        serviceId: 'service1',
        clientId: 'client1',
        staffName: 'Jan Kowalski',
        status: 'confirmed' as const
      };

      const startTime = performance.now();
      
      // Dodaj 500 zmian dla tej samej wizyty
      act(() => {
        for (let i = 0; i < 500; i++) {
          const delta = i % 2 === 0 ? 1 : -1; // Naprzemienne +1min i -1min
          result.current.addTimeChange('appointment1', delta, appointmentData);
        }
      });
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      // Sprawdź, czy operacja zajęła rozsądny czas (mniej niż 100ms)
      expect(executionTime).toBeLessThan(100);
      
      // Sprawdź, czy końcowa delta jest poprawna
      const pendingChange = result.current.getPendingChange('appointment1');
      expect(pendingChange?.minutesDelta).toBe(0); // Powinno być 0 (równa liczba +1 i -1)
    });

    test('powinien wydajnie czyszczyć stan przy wielu zmianach', () => {
      const { result } = renderHook(() => usePendingTimeChanges());
      
      const baseAppointmentData = {
        start: new Date('2024-01-15T10:00:00'),
        end: new Date('2024-01-15T11:00:00'),
        serviceId: 'service1',
        clientId: 'client1',
        staffName: 'Jan Kowalski',
        status: 'confirmed' as const
      };

      // Dodaj 500 zmian
      act(() => {
        for (let i = 0; i < 500; i++) {
          result.current.addTimeChange(`appointment${i}`, 5, baseAppointmentData);
        }
      });

      const startTime = performance.now();
      
      // Cofnij wszystkie zmiany
      act(() => {
        result.current.revertAllChanges();
      });
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      // Sprawdź, czy operacja zajęła rozsądny czas (mniej niż 50ms)
      expect(executionTime).toBeLessThan(50);
      expect(Object.keys(result.current.getAllPendingChanges())).toHaveLength(0);
    });

    test('powinien wydajnie sprawdzać stan przy wielu wizytach', () => {
      const { result } = renderHook(() => usePendingTimeChanges());
      
      const baseAppointmentData = {
        start: new Date('2024-01-15T10:00:00'),
        end: new Date('2024-01-15T11:00:00'),
        serviceId: 'service1',
        clientId: 'client1',
        staffName: 'Jan Kowalski',
        status: 'confirmed' as const
      };

      // Dodaj 1000 zmian
      act(() => {
        for (let i = 0; i < 1000; i++) {
          result.current.addTimeChange(`appointment${i}`, 5, baseAppointmentData);
        }
      });

      const startTime = performance.now();
      
      // Sprawdź stan dla losowych wizyt
      for (let i = 0; i < 100; i++) {
        const randomId = `appointment${Math.floor(Math.random() * 1000)}`;
        result.current.hasPendingChange(randomId);
        result.current.getPendingChange(randomId);
      }
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      // Sprawdź, czy operacja zajęła rozsądny czas (mniej niż 10ms)
      expect(executionTime).toBeLessThan(10);
    });
  });

  describe('Wycieki pamięci', () => {
    test('nie powinien tworzyć wycieków pamięci przy wielokrotnych dodawaniu i usuwaniu zmian', () => {
      const { result, rerender, unmount } = renderHook(() => usePendingTimeChanges());
      
      const baseAppointmentData = {
        start: new Date('2024-01-15T10:00:00'),
        end: new Date('2024-01-15T11:00:00'),
        serviceId: 'service1',
        clientId: 'client1',
        staffName: 'Jan Kowalski',
        status: 'confirmed' as const
      };

      // Powtórz cykl dodawania i usuwania zmian
      for (let cycle = 0; cycle < 10; cycle++) {
        // Dodaj zmiany
        act(() => {
          for (let i = 0; i < 100; i++) {
            result.current.addTimeChange(`appointment${cycle}_${i}`, 5, baseAppointmentData);
          }
        });

        // Usuń zmiany
        act(() => {
          for (let i = 0; i < 100; i++) {
            result.current.revertChange(`appointment${cycle}_${i}`);
          }
        });

        // Sprawdź, czy stan został wyczyszczony
        expect(Object.keys(result.current.getAllPendingChanges()).filter(
          key => key.startsWith(`appointment${cycle}_`)
        )).toHaveLength(0);
      }

      // Sprawdź, czy końcowy stan jest pusty
      expect(Object.keys(result.current.getAllPendingChanges())).toHaveLength(0);
      
      // Odmontuj hook i sprawdź, czy nie ma wycieków
      unmount();
    });

    test('nie powinien tworzyć wycieków pamięci przy wielokrotnym renderowaniu', () => {
      const { result, rerender, unmount } = renderHook(() => usePendingTimeChanges());
      
      const baseAppointmentData = {
        start: new Date('2024-01-15T10:00:00'),
        end: new Date('2024-01-15T11:00:00'),
        serviceId: 'service1',
        clientId: 'client1',
        staffName: 'Jan Kowalski',
        status: 'confirmed' as const
      };

      // Dodaj zmiany
      act(() => {
        for (let i = 0; i < 50; i++) {
          result.current.addTimeChange(`appointment${i}`, 5, baseAppointmentData);
        }
      });

      // Wykonaj wielokrotne renderowania
      for (let i = 0; i < 10; i++) {
        rerender();
        
        // Sprawdź, czy stan jest zachowany
        expect(Object.keys(result.current.getAllPendingChanges())).toHaveLength(50);
      }

      // Odmontuj hook i sprawdź, czy nie ma wycieków
      unmount();
    });

    test('nie powinien tworzyć wycieków pamięci przy wielokrotnym przełączaniu dni', () => {
      const { result, unmount } = renderHook(() => usePendingTimeChanges());
      
      const baseAppointmentData = {
        start: new Date('2024-01-15T10:00:00'),
        end: new Date('2024-01-15T11:00:00'),
        serviceId: 'service1',
        clientId: 'client1',
        staffName: 'Jan Kowalski',
        status: 'confirmed' as const
      };

      // Dodaj zmiany dla różnych dni
      for (let day = 0; day < 7; day++) {
        act(() => {
          for (let i = 0; i < 20; i++) {
            result.current.addTimeChange(`day${day}_appointment${i}`, 5, baseAppointmentData);
          }
        });

        // Cofnij zmiany dla bieżącego dnia
        act(() => {
          for (let i = 0; i < 20; i++) {
            result.current.revertChange(`day${day}_appointment${i}`);
          }
        });
      }

      // Sprawdź, czy końcowy stan jest pusty
      expect(Object.keys(result.current.getAllPendingChanges())).toHaveLength(0);
      
      // Odmontuj hook i sprawdź, czy nie ma wycieków
      unmount();
    });
  });

  describe('Optymalizacja stanu', () => {
    test('powinien efektywnie zarządzać stanem przy dużej liczbie wizyt', () => {
      const { result } = renderHook(() => usePendingTimeChanges());
      
      const baseAppointmentData = {
        start: new Date('2024-01-15T10:00:00'),
        end: new Date('2024-01-15T11:00:00'),
        serviceId: 'service1',
        clientId: 'client1',
        staffName: 'Jan Kowalski',
        status: 'confirmed' as const
      };

      // Dodaj 100 zmian
      act(() => {
        for (let i = 0; i < 100; i++) {
          result.current.addTimeChange(`appointment${i}`, 5, baseAppointmentData);
        }
      });

      // Sprawdź, czy getAllPendingChanges zwraca poprawną liczbę zmian
      expect(Object.keys(result.current.getAllPendingChanges())).toHaveLength(100);
      
      // Sprawdź, czy hasPendingChange działa poprawnie
      expect(result.current.hasPendingChange('appointment0')).toBe(true);
      expect(result.current.hasPendingChange('appointment99')).toBe(true);
      expect(result.current.hasPendingChange('appointment100')).toBe(false);
      
      // Sprawdź, czy getPendingChange działa poprawnie
      const change = result.current.getPendingChange('appointment50');
      expect(change?.appointmentId).toBe('appointment50');
      expect(change?.minutesDelta).toBe(5);
    });

    test('powinien efektywnie aktualizować stan przy wielokrotnych zmianach tej samej wizyty', () => {
      const { result } = renderHook(() => usePendingTimeChanges());
      
      const appointmentData = {
        start: new Date('2024-01-15T10:00:00'),
        end: new Date('2024-01-15T11:00:00'),
        serviceId: 'service1',
        clientId: 'client1',
        staffName: 'Jan Kowalski',
        status: 'confirmed' as const
      };

      // Dodaj 100 zmian dla tej samej wizyty
      act(() => {
        for (let i = 0; i < 100; i++) {
          result.current.addTimeChange('appointment1', 1, appointmentData);
        }
      });

      // Sprawdź, czy stan zawiera tylko jedną zmianę
      expect(Object.keys(result.current.getAllPendingChanges())).toHaveLength(1);
      
      // Sprawdź, czy delta jest poprawna
      const change = result.current.getPendingChange('appointment1');
      expect(change?.minutesDelta).toBe(100);
      
      // Cofnij zmianę
      act(() => {
        result.current.revertChange('appointment1');
      });
      
      // Sprawdź, czy stan jest pusty
      expect(Object.keys(result.current.getAllPendingChanges())).toHaveLength(0);
    });
  });
});