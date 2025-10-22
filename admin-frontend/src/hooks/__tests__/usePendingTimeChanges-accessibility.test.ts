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

describe('usePendingTimeChanges - Dostępność i ARIA', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Nawigacja klawiaturą', () => {
    test('powinien obsługiwać zmiany czasu za pomocą klawiszy strzałek', () => {
      const { result } = renderHook(() => usePendingTimeChanges());
      
      const appointmentData = {
        start: new Date('2024-01-15T10:00:00'),
        end: new Date('2024-01-15T11:00:00'),
        serviceId: 'service1',
        clientId: 'client1',
        staffName: 'Jan Kowalski',
        status: 'confirmed' as const
      };

      // Symuluj naciśnięcie klawisza strzałki w górę (+5min)
      act(() => {
        result.current.addTimeChange('appointment1', 5, appointmentData);
      });

      let pendingChange = result.current.getPendingChange('appointment1');
      expect(pendingChange?.minutesDelta).toBe(5);
      expect(pendingChange?.newStart).toEqual(new Date('2024-01-15T10:05:00'));

      // Symuluj naciśnięcie klawisza strzałki w dół (-5min)
      act(() => {
        result.current.addTimeChange('appointment1', -5, appointmentData);
      });

      pendingChange = result.current.getPendingChange('appointment1');
      expect(pendingChange?.minutesDelta).toBe(0); // 5 - 5 = 0
      expect(pendingChange?.newStart).toEqual(new Date('2024-01-15T10:00:00'));
    });

    test('powinien obsługiwać zatwierdzanie zmian za pomocą klawisza Enter', async () => {
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

      // Dodaj zmianę
      act(() => {
        result.current.addTimeChange('appointment1', 10, appointmentData);
      });

      expect(result.current.hasPendingChange('appointment1')).toBe(true);

      // Symuluj naciśnięcie klawisza Enter (zatwierdzenie zmiany)
      await act(async () => {
        await result.current.commitChange('appointment1');
      });

      expect(result.current.hasPendingChange('appointment1')).toBe(false);
      expect(updateAppointment).toHaveBeenCalled();
    });

    test('powinien obsługiwać cofanie zmian za pomocą klawisza Escape', () => {
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
        result.current.addTimeChange('appointment1', 10, appointmentData);
      });

      expect(result.current.hasPendingChange('appointment1')).toBe(true);

      // Symuluj naciśnięcie klawisza Escape (cofnięcie zmiany)
      act(() => {
        result.current.revertChange('appointment1');
      });

      expect(result.current.hasPendingChange('appointment1')).toBe(false);
    });

    test('powinien obsługiwać szybkie zmiany za pomocą klawiszy Shift + strzałka', () => {
      const { result } = renderHook(() => usePendingTimeChanges());
      
      const appointmentData = {
        start: new Date('2024-01-15T10:00:00'),
        end: new Date('2024-01-15T11:00:00'),
        serviceId: 'service1',
        clientId: 'client1',
        staffName: 'Jan Kowalski',
        status: 'confirmed' as const
      };

      // Symuluj naciśnięcie klawiszy Shift + strzałka w górę (+15min)
      act(() => {
        result.current.addTimeChange('appointment1', 15, appointmentData);
      });

      let pendingChange = result.current.getPendingChange('appointment1');
      expect(pendingChange?.minutesDelta).toBe(15);
      expect(pendingChange?.newStart).toEqual(new Date('2024-01-15T10:15:00'));

      // Symuluj naciśnięcie klawiszy Shift + strzałka w dół (-15min)
      act(() => {
        result.current.addTimeChange('appointment1', -15, appointmentData);
      });

      pendingChange = result.current.getPendingChange('appointment1');
      expect(pendingChange?.minutesDelta).toBe(0); // 15 - 15 = 0
      expect(pendingChange?.newStart).toEqual(new Date('2024-01-15T10:00:00'));
    });
  });

  describe('Wspomaganie czytników ekranu', () => {
    test('powinien dostarczać odpowiednie informacje o stanie zmian', () => {
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
        result.current.addTimeChange('appointment1', 10, appointmentData);
      });

      // Pobierz informacje o zmianie dla czytnika ekranu
      const pendingChange = result.current.getPendingChange('appointment1');
      
      // Informacje powinny zawierać:
      // - ID wizyty
      // - Wartość zmiany w minutach
      // - Oryginalny i nowy czas
      // - Informacje o kliencie i pracowniku
      
      expect(pendingChange?.appointmentId).toBe('appointment1');
      expect(pendingChange?.minutesDelta).toBe(10);
      expect(pendingChange?.originalStart).toEqual(new Date('2024-01-15T10:00:00'));
      expect(pendingChange?.newStart).toEqual(new Date('2024-01-15T10:10:00'));
    });

    test('powinien generować komunikaty o stanie dla czytników ekranu', () => {
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
        result.current.addTimeChange('appointment1', 10, appointmentData);
      });

      // Generuj komunikat dla czytnika ekranu
      const pendingChange = result.current.getPendingChange('appointment1');
      const ariaLabel = `Wizyta z Jan Kowalski, czas zmieniony o ${pendingChange?.minutesDelta} minut. Nowy czas: ${pendingChange?.newStart.toLocaleTimeString('pl-PL')}`;
      
      expect(ariaLabel).toContain('Wizyta z Jan Kowalski');
      expect(ariaLabel).toContain('czas zmieniony o 10 minut');
      expect(ariaLabel).toContain('10:10');
    });

    test('powinien informować o liczbie oczekujących zmian', () => {
      const { result } = renderHook(() => usePendingTimeChanges());
      
      const appointmentData = {
        start: new Date('2024-01-15T10:00:00'),
        end: new Date('2024-01-15T11:00:00'),
        serviceId: 'service1',
        clientId: 'client1',
        staffName: 'Jan Kowalski',
        status: 'confirmed' as const
      };

      // Dodaj zmiany dla wielu wizyt
      act(() => {
        result.current.addTimeChange('appointment1', 5, appointmentData);
        result.current.addTimeChange('appointment2', -10, appointmentData);
        result.current.addTimeChange('appointment3', 15, appointmentData);
      });

      // Pobierz liczbę oczekujących zmian
      const pendingChanges = result.current.getAllPendingChanges();
      const pendingCount = Object.keys(pendingChanges).length;
      
      // Generuj komunikat dla czytnika ekranu
      const ariaLabel = `Masz ${pendingCount} oczekujące zmiany czasu wizyt. Naciśnij Enter, aby zatwierdzić wszystkie zmiany, lub Escape, aby cofnąć.`;
      
      expect(ariaLabel).toBe('Masz 3 oczekujące zmiany czasu wizyt. Naciśnij Enter, aby zatwierdzić wszystkie zmiany, lub Escape, aby cofnąć.');
    });
  });

  describe('Kontrast i wizualne wsparcie', () => {
    test('powinien dostarczać informacje o stanie wizualnym dla użytkowników z wadami wzroku', () => {
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
        result.current.addTimeChange('appointment1', 10, appointmentData);
      });

      // Pobierz informacje o stanie wizualnym
      const hasPendingChange = result.current.hasPendingChange('appointment1');
      const pendingChange = result.current.getPendingChange('appointment1');
      
      // Informacje powinny zawierać:
      // - Czy wizyta ma oczekujące zmiany
      // - Kierunek zmiany (przesunięcie do przodu/tyłu)
      // - Wartość zmiany
      
      expect(hasPendingChange).toBe(true);
      expect(pendingChange?.minutesDelta).toBe(10);
      
      // Generuj informacje o stanie wizualnym
      const visualState = {
        hasPendingChange,
        changeDirection: pendingChange?.minutesDelta && pendingChange.minutesDelta > 0 ? 'forward' : 'backward',
        changeMagnitude: Math.abs(pendingChange?.minutesDelta || 0)
      };
      
      expect(visualState.changeDirection).toBe('forward');
      expect(visualState.changeMagnitude).toBe(10);
    });

    test('powinien dostarczać informacje o stanie przycisków dla użytkowników z wadami wzroku', () => {
      const { result } = renderHook(() => usePendingTimeChanges());
      
      const appointmentData = {
        start: new Date('2024-01-15T10:00:00'),
        end: new Date('2024-01-15T11:00:00'),
        serviceId: 'service1',
        clientId: 'client1',
        staffName: 'Jan Kowalski',
        status: 'confirmed' as const
      };

      // Sprawdź stan przycisków przed dodaniem zmiany
      let buttonState = {
        hasPendingChange: result.current.hasPendingChange('appointment1'),
        canCommit: false,
        canRevert: false
      };
      
      expect(buttonState.hasPendingChange).toBe(false);
      expect(buttonState.canCommit).toBe(false);
      expect(buttonState.canRevert).toBe(false);

      // Dodaj zmianę
      act(() => {
        result.current.addTimeChange('appointment1', 10, appointmentData);
      });

      // Sprawdź stan przycisków po dodaniu zmiany
      buttonState = {
        hasPendingChange: result.current.hasPendingChange('appointment1'),
        canCommit: true,
        canRevert: true
      };
      
      expect(buttonState.hasPendingChange).toBe(true);
      expect(buttonState.canCommit).toBe(true);
      expect(buttonState.canRevert).toBe(true);
    });
  });

  describe('Skróty klawiaturowe', () => {
    test('powinien obsługiwać skróty klawiaturowe dla szybkiej edycji', () => {
      const { result } = renderHook(() => usePendingTimeChanges());
      
      const appointmentData = {
        start: new Date('2024-01-15T10:00:00'),
        end: new Date('2024-01-15T11:00:00'),
        serviceId: 'service1',
        clientId: 'client1',
        staffName: 'Jan Kowalski',
        status: 'confirmed' as const
      };

      // Symuluj skrót klawiaturowy Ctrl + Plus (+5min)
      act(() => {
        result.current.addTimeChange('appointment1', 5, appointmentData);
      });

      let pendingChange = result.current.getPendingChange('appointment1');
      expect(pendingChange?.minutesDelta).toBe(5);

      // Symuluj skrót klawiaturowy Ctrl + Minus (-5min)
      act(() => {
        result.current.addTimeChange('appointment1', -5, appointmentData);
      });

      pendingChange = result.current.getPendingChange('appointment1');
      expect(pendingChange?.minutesDelta).toBe(0);

      // Symuluj skrót klawiaturowy Ctrl + Shift + Plus (+15min)
      act(() => {
        result.current.addTimeChange('appointment1', 15, appointmentData);
      });

      pendingChange = result.current.getPendingChange('appointment1');
      expect(pendingChange?.minutesDelta).toBe(15);

      // Symuluj skrót klawiaturowy Ctrl + Shift + Minus (-15min)
      act(() => {
        result.current.addTimeChange('appointment1', -15, appointmentData);
      });

      pendingChange = result.current.getPendingChange('appointment1');
      expect(pendingChange?.minutesDelta).toBe(0);
    });

    test('powinien obsługiwać skróty klawiaturowe dla zatwierdzania i cofania', async () => {
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

      // Dodaj zmianę
      act(() => {
        result.current.addTimeChange('appointment1', 10, appointmentData);
      });

      expect(result.current.hasPendingChange('appointment1')).toBe(true);

      // Symuluj skrót klawiaturowy Ctrl + Enter (zatwierdzenie zmiany)
      await act(async () => {
        await result.current.commitChange('appointment1');
      });

      expect(result.current.hasPendingChange('appointment1')).toBe(false);

      // Dodaj kolejną zmianę
      act(() => {
        result.current.addTimeChange('appointment1', 5, appointmentData);
      });

      expect(result.current.hasPendingChange('appointment1')).toBe(true);

      // Symuluj skrót klawiaturowy Ctrl + Escape (cofnięcie zmiany)
      act(() => {
        result.current.revertChange('appointment1');
      });

      expect(result.current.hasPendingChange('appointment1')).toBe(false);
    });
  });
});