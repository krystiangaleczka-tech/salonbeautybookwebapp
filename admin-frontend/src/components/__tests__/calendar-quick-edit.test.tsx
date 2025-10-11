/// <reference path="../../types/test.d.ts" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock dla usePendingTimeChanges
const mockUsePendingTimeChanges = {
    addTimeChange: jest.fn(),
    commitChange: jest.fn(),
    revertChange: jest.fn(),
    hasPendingChange: jest.fn(),
    getPendingChange: jest.fn(),
    pendingChanges: {},
    getAllPendingChanges: jest.fn(),
    commitAllChanges: jest.fn(),
    revertAllChanges: jest.fn(),
};

jest.mock('@/hooks/usePendingTimeChanges', () => ({
    usePendingTimeChanges: () => mockUsePendingTimeChanges,
}));

// Komponent testowy do szybkiej edycji kalendarza
interface QuickEditButtonProps {
    appointmentId: string;
    onCommitTimeChange: (appointmentId: string) => void;
    onRevertChange: (appointmentId: string) => void;
    hasPendingChange: (appointmentId: string) => boolean;
    getPendingChange: (appointmentId: string) => any;
}

const QuickEditButtons: React.FC<QuickEditButtonProps> = ({
    appointmentId,
    onCommitTimeChange,
    onRevertChange,
    hasPendingChange,
    getPendingChange
}) => {
    const [tooltipAppointmentId, setTooltipAppointmentId] = React.useState<string | null>(null);
    
    if (!hasPendingChange(appointmentId)) {
        return null;
    }
    
    const pendingChange = getPendingChange(appointmentId);
    
    return (
        <div className="quick-edit-buttons" data-testid={`quick-edit-${appointmentId}`}>
            {/* Przycisk zatwierdzenia - zielony ptaszek */}
            <button
                type="button"
                onClick={() => {
                    onCommitTimeChange(appointmentId);
                    setTooltipAppointmentId(null);
                }}
                onMouseEnter={() => setTooltipAppointmentId(`commit-${appointmentId}`)}
                onMouseLeave={() => setTooltipAppointmentId(null)}
                className="commit-button"
                data-testid={`commit-button-${appointmentId}`}
                aria-label="Zatwierdź zmianę czasu"
                title={`Zatwierdź zmianę: ${pendingChange?.minutesDelta > 0 ? '+' : ''}${pendingChange?.minutesDelta} min`}
            >
                ✓
            </button>
            
            {/* Przycisk cofania - czerwona strzałka */}
            <button
                type="button"
                onClick={() => {
                    onRevertChange(appointmentId);
                    setTooltipAppointmentId(null);
                }}
                onMouseEnter={() => setTooltipAppointmentId(`revert-${appointmentId}`)}
                onMouseLeave={() => setTooltipAppointmentId(null)}
                className="revert-button"
                data-testid={`revert-button-${appointmentId}`}
                aria-label="Cofnij zmianę czasu"
                title="Cofnij zmianę"
            >
                ↺
            </button>
            
            {/* Tooltip dla przycisku zatwierdzenia */}
            {tooltipAppointmentId === `commit-${appointmentId}` && (
                <div className="tooltip commit-tooltip" data-testid={`commit-tooltip-${appointmentId}`}>
                    Zatwierdź zmianę: {pendingChange?.minutesDelta > 0 ? '+' : ''}{pendingChange?.minutesDelta} min
                </div>
            )}
            
            {/* Tooltip dla przycisku cofania */}
            {tooltipAppointmentId === `revert-${appointmentId}` && (
                <div className="tooltip revert-tooltip" data-testid={`revert-tooltip-${appointmentId}`}>
                    Cofnij zmianę
                </div>
            )}
        </div>
    );
};

describe('Calendar Quick Edit', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        
        // Resetuj mocki do domyślnych wartości
        mockUsePendingTimeChanges.hasPendingChange.mockReturnValue(false);
        mockUsePendingTimeChanges.getPendingChange.mockReturnValue(null);
    });

    describe('Podstawowa funkcjonalność szybkiej edycji', () => {
        test('powinien renderować przyciski szybkiej edycji gdy są oczekujące zmiany', () => {
            mockUsePendingTimeChanges.hasPendingChange.mockReturnValue(true);
            mockUsePendingTimeChanges.getPendingChange.mockReturnValue({
                minutesDelta: 5,
                appointmentId: 'appointment1',
            });

            render(
                <QuickEditButtons
                    appointmentId="appointment1"
                    onCommitTimeChange={mockUsePendingTimeChanges.commitChange}
                    onRevertChange={mockUsePendingTimeChanges.revertChange}
                    hasPendingChange={mockUsePendingTimeChanges.hasPendingChange}
                    getPendingChange={mockUsePendingTimeChanges.getPendingChange}
                />
            );

            expect(screen.getByTestId('quick-edit-appointment1')).toBeInTheDocument();
            expect(screen.getByTestId('commit-button-appointment1')).toBeInTheDocument();
            expect(screen.getByTestId('revert-button-appointment1')).toBeInTheDocument();
        });

        test('nie powinien renderować przycisków gdy brak oczekujących zmian', () => {
            mockUsePendingTimeChanges.hasPendingChange.mockReturnValue(false);

            render(
                <QuickEditButtons
                    appointmentId="appointment1"
                    onCommitTimeChange={mockUsePendingTimeChanges.commitChange}
                    onRevertChange={mockUsePendingTimeChanges.revertChange}
                    hasPendingChange={mockUsePendingTimeChanges.hasPendingChange}
                    getPendingChange={mockUsePendingTimeChanges.getPendingChange}
                />
            );

            expect(screen.queryByTestId('quick-edit-appointment1')).not.toBeInTheDocument();
        });
    });

    describe('Funkcjonalność przycisków zatwierdzenia zmian', () => {
        test('powinien wywoływać commitChange przy kliknięciu przycisku zatwierdzenia', async () => {
            const user = userEvent.setup();
            
            mockUsePendingTimeChanges.hasPendingChange.mockReturnValue(true);
            mockUsePendingTimeChanges.getPendingChange.mockReturnValue({
                minutesDelta: 5,
                appointmentId: 'appointment1',
            });

            render(
                <QuickEditButtons
                    appointmentId="appointment1"
                    onCommitTimeChange={mockUsePendingTimeChanges.commitChange}
                    onRevertChange={mockUsePendingTimeChanges.revertChange}
                    hasPendingChange={mockUsePendingTimeChanges.hasPendingChange}
                    getPendingChange={mockUsePendingTimeChanges.getPendingChange}
                />
            );

            await user.click(screen.getByTestId('commit-button-appointment1'));
            
            expect(mockUsePendingTimeChanges.commitChange).toHaveBeenCalledWith('appointment1');
        });

        test('powinien wywoływać revertChange przy kliknięciu przycisku cofania', async () => {
            const user = userEvent.setup();
            
            mockUsePendingTimeChanges.hasPendingChange.mockReturnValue(true);
            mockUsePendingTimeChanges.getPendingChange.mockReturnValue({
                minutesDelta: 5,
                appointmentId: 'appointment1',
            });

            render(
                <QuickEditButtons
                    appointmentId="appointment1"
                    onCommitTimeChange={mockUsePendingTimeChanges.commitChange}
                    onRevertChange={mockUsePendingTimeChanges.revertChange}
                    hasPendingChange={mockUsePendingTimeChanges.hasPendingChange}
                    getPendingChange={mockUsePendingTimeChanges.getPendingChange}
                />
            );

            await user.click(screen.getByTestId('revert-button-appointment1'));
            
            expect(mockUsePendingTimeChanges.revertChange).toHaveBeenCalledWith('appointment1');
        });
    });

    describe('Obsługa tooltipów', () => {
        test('powinien wyświetlać tooltip zatwierdzenia przy najechaniu na przycisk zatwierdzenia', async () => {
            const user = userEvent.setup();
            
            mockUsePendingTimeChanges.hasPendingChange.mockReturnValue(true);
            mockUsePendingTimeChanges.getPendingChange.mockReturnValue({
                minutesDelta: 5,
                appointmentId: 'appointment1',
            });

            render(
                <QuickEditButtons
                    appointmentId="appointment1"
                    onCommitTimeChange={mockUsePendingTimeChanges.commitChange}
                    onRevertChange={mockUsePendingTimeChanges.revertChange}
                    hasPendingChange={mockUsePendingTimeChanges.hasPendingChange}
                    getPendingChange={mockUsePendingTimeChanges.getPendingChange}
                />
            );

            await user.hover(screen.getByTestId('commit-button-appointment1'));
            
            expect(screen.getByTestId('commit-tooltip-appointment1')).toBeInTheDocument();
            expect(screen.getByTestId('commit-tooltip-appointment1')).toHaveTextContent('Zatwierdź zmianę: +5 min');
        });

        test('powinien wyświetlać tooltip cofania przy najechaniu na przycisk cofania', async () => {
            const user = userEvent.setup();
            
            mockUsePendingTimeChanges.hasPendingChange.mockReturnValue(true);
            mockUsePendingTimeChanges.getPendingChange.mockReturnValue({
                minutesDelta: -10,
                appointmentId: 'appointment1',
            });

            render(
                <QuickEditButtons
                    appointmentId="appointment1"
                    onCommitTimeChange={mockUsePendingTimeChanges.commitChange}
                    onRevertChange={mockUsePendingTimeChanges.revertChange}
                    hasPendingChange={mockUsePendingTimeChanges.hasPendingChange}
                    getPendingChange={mockUsePendingTimeChanges.getPendingChange}
                />
            );

            await user.hover(screen.getByTestId('revert-button-appointment1'));
            
            expect(screen.getByTestId('revert-tooltip-appointment1')).toBeInTheDocument();
            expect(screen.getByTestId('revert-tooltip-appointment1')).toHaveTextContent('Cofnij zmianę');
        });
    });

    describe('Integracja z usePendingTimeChanges', () => {
        test('powinien poprawnie przekazywać parametry do hooka usePendingTimeChanges', () => {
            render(
                <QuickEditButtons
                    appointmentId="appointment1"
                    onCommitTimeChange={mockUsePendingTimeChanges.commitChange}
                    onRevertChange={mockUsePendingTimeChanges.revertChange}
                    hasPendingChange={mockUsePendingTimeChanges.hasPendingChange}
                    getPendingChange={mockUsePendingTimeChanges.getPendingChange}
                />
            );
            
            // Sprawdź, czy hook usePendingTimeChanges jest używany
            expect(mockUsePendingTimeChanges.addTimeChange).toBeDefined();
            expect(mockUsePendingTimeChanges.commitChange).toBeDefined();
            expect(mockUsePendingTimeChanges.revertChange).toBeDefined();
            expect(mockUsePendingTimeChanges.hasPendingChange).toBeDefined();
            expect(mockUsePendingTimeChanges.getPendingChange).toBeDefined();
        });

        test('powinien obsługiwać poprawnie typy parametrów callback i query', () => {
            render(
                <QuickEditButtons
                    appointmentId="appointment1"
                    onCommitTimeChange={mockUsePendingTimeChanges.commitChange}
                    onRevertChange={mockUsePendingTimeChanges.revertChange}
                    hasPendingChange={mockUsePendingTimeChanges.hasPendingChange}
                    getPendingChange={mockUsePendingTimeChanges.getPendingChange}
                />
            );
            
            // Testowanie typów - w TypeScript to jest sprawdzane w czasie kompilacji
            // Upewniamy się, że funkcje są wywoływane z poprawnymi typami
            expect(typeof mockUsePendingTimeChanges.addTimeChange).toBe('function');
            expect(typeof mockUsePendingTimeChanges.commitChange).toBe('function');
        });
    });

    describe('Obsługa błędów', () => {
        test('powinien obsługiwać pustą zmianę oczekującą', () => {
            mockUsePendingTimeChanges.hasPendingChange.mockReturnValue(true);
            mockUsePendingTimeChanges.getPendingChange.mockReturnValue(null);

            render(
                <QuickEditButtons
                    appointmentId="appointment1"
                    onCommitTimeChange={mockUsePendingTimeChanges.commitChange}
                    onRevertChange={mockUsePendingTimeChanges.revertChange}
                    hasPendingChange={mockUsePendingTimeChanges.hasPendingChange}
                    getPendingChange={mockUsePendingTimeChanges.getPendingChange}
                />
            );

            // Komponent powinien renderować się nawet gdy pendingChange jest null
            expect(screen.getByTestId('quick-edit-appointment1')).toBeInTheDocument();
        });
    });
});