"use client";

import { useState, useCallback } from "react";
import { updateAppointment, type AppointmentPayload } from "@/lib/appointments-service";

// Interfejs reprezentujący pojedynczą zmianę czasu wizyty
export interface AppointmentTimeChange {
    appointmentId: string;
    minutesDelta: number;
    originalStart: Date;
    originalEnd: Date;
    newStart: Date;
    newEnd: Date;
    serviceId: string;
    clientId: string;
    staffName: string;
    status: 'confirmed' | 'pending' | 'cancelled';
    notes?: string;
    price?: number;
}

// Interfejs reprezentujący wszystkie oczekujące zmiany
export interface PendingTimeChanges {
    [appointmentId: string]: AppointmentTimeChange;
}

export function usePendingTimeChanges() {
    const [pendingChanges, setPendingChanges] = useState<PendingTimeChanges>({});

    // Dodaje zmianę czasu dla wizyty
    const addTimeChange = useCallback((
        appointmentId: string,
        minutesDelta: number,
        originalAppointment: {
            start: Date;
            end: Date;
            serviceId: string;
            clientId: string;
            staffName: string;
            status: 'confirmed' | 'pending' | 'cancelled';
            notes?: string;
            price?: number;
        }
    ) => {
        setPendingChanges(prev => {
            // Jeśli już istnieje zmiana dla tej wizyty, zaktualizuj ją
            if (prev[appointmentId]) {
                const existingChange = prev[appointmentId];
                const newMinutesDelta = existingChange.minutesDelta + minutesDelta;
                const newStart = new Date(existingChange.originalStart.getTime() + newMinutesDelta * 60000);
                const duration = existingChange.originalEnd.getTime() - existingChange.originalStart.getTime();
                const newEnd = new Date(newStart.getTime() + duration);

                return {
                    ...prev,
                    [appointmentId]: {
                        ...existingChange,
                        minutesDelta: newMinutesDelta,
                        newStart,
                        newEnd
                    }
                };
            } else {
                // Tworzymy nową zmianę
                const newStart = new Date(originalAppointment.start.getTime() + minutesDelta * 60000);
                const duration = originalAppointment.end.getTime() - originalAppointment.start.getTime();
                const newEnd = new Date(newStart.getTime() + duration);

                return {
                    ...prev,
                    [appointmentId]: {
                        appointmentId,
                        minutesDelta,
                        originalStart: originalAppointment.start,
                        originalEnd: originalAppointment.end,
                        newStart,
                        newEnd,
                        serviceId: originalAppointment.serviceId,
                        clientId: originalAppointment.clientId,
                        staffName: originalAppointment.staffName,
                        status: originalAppointment.status,
                        notes: originalAppointment.notes,
                        price: originalAppointment.price
                    }
                };
            }
        });
    }, []);

    // Zatwierdza zmianę i aktualizuje bazę danych
    const commitChange = useCallback(async (appointmentId: string) => {
        const change = pendingChanges[appointmentId];
        if (!change) {
            throw new Error(`Brak oczekującej zmiany dla wizyty ${appointmentId}`);
        }

        try {
            // Przygotuj payload do aktualizacji
            const payload: Omit<AppointmentPayload, 'start' | 'end'> & { start: Date; end: Date } = {
                serviceId: change.serviceId,
                clientId: change.clientId,
                staffName: change.staffName,
                start: change.newStart,
                end: change.newEnd,
                status: change.status,
                notes: change.notes,
                price: change.price
            };

            // Aktualizuj wizytę w bazie danych
            await updateAppointment(appointmentId, payload);

            // Usuń oczekującą zmianę po pomyślnej aktualizacji
            setPendingChanges(prev => {
                const newChanges = { ...prev };
                delete newChanges[appointmentId];
                return newChanges;
            });

            return true;
        } catch (error) {
            console.error("Błąd podczas zatwierdzania zmiany czasu wizyty:", error);
            throw error;
        }
    }, [pendingChanges]);

    // Cofa zmianę
    const revertChange = useCallback((appointmentId: string) => {
        setPendingChanges(prev => {
            const newChanges = { ...prev };
            delete newChanges[appointmentId];
            return newChanges;
        });
    }, []);

    // Sprawdza czy są oczekujące zmiany dla danej wizyty
    const hasPendingChange = useCallback((appointmentId: string) => {
        return appointmentId in pendingChanges;
    }, [pendingChanges]);

    // Zwraca oczekującą zmianę dla danej wizyty
    const getPendingChange = useCallback((appointmentId: string) => {
        return pendingChanges[appointmentId] || null;
    }, [pendingChanges]);

    // Zwraca wszystkie oczekujące zmiany
    const getAllPendingChanges = useCallback(() => {
        return pendingChanges;
    }, [pendingChanges]);

    // Zatwierdza wszystkie oczekujące zmiany
    const commitAllChanges = useCallback(async () => {
        const appointmentIds = Object.keys(pendingChanges);
        const results: { appointmentId: string; success: boolean; error?: string }[] = [];

        for (const appointmentId of appointmentIds) {
            try {
                await commitChange(appointmentId);
                results.push({ appointmentId, success: true });
            } catch (error) {
                results.push({ 
                    appointmentId, 
                    success: false, 
                    error: error instanceof Error ? error.message : "Nieznany błąd" 
                });
            }
        }

        return results;
    }, [pendingChanges, commitChange]);

    // Cofa wszystkie oczekujące zmiany
    const revertAllChanges = useCallback(() => {
        setPendingChanges({});
    }, []);

    return {
        pendingChanges,
        addTimeChange,
        commitChange,
        revertChange,
        hasPendingChange,
        getPendingChange,
        getAllPendingChanges,
        commitAllChanges,
        revertAllChanges
    };
}