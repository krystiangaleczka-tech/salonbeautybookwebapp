import { collection, doc, setDoc, deleteDoc, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "./firebase";
import { isAfter } from "date-fns";

export interface AppointmentFilter {
    search: string;
    dateRange: {
        from: Date | undefined;
        to: Date | undefined;
    };
    employees: string[];
    services: string[];
    statuses: string[];
    customers: string[];
}

export interface FilterPreset {
    id: string;
    name: string;
    filters: AppointmentFilter;
}

const FILTERS_PRESETS_COLLECTION = "filterPresets";

export interface BatchOperation {
    id: string;
    type: "confirm" | "cancel" | "complete" | "delete";
    appointmentIds: string[];
    status: "pending" | "processing" | "completed" | "failed";
    createdAt: Date;
    completedAt?: Date;
    error?: string;
    userId: string;
}

const BATCH_OPERATIONS_COLLECTION = "batchOperations";

// Presety filtrów
export async function saveFilterPreset(userId: string, name: string, filters: AppointmentFilter): Promise<string> {
    try {
        const presetId = doc(collection(db, FILTERS_PRESETS_COLLECTION)).id;
        const preset: FilterPreset & { userId: string; createdAt: Date } = {
            id: presetId,
            name,
            filters,
            userId,
            createdAt: new Date(),
        };

        await setDoc(doc(db, FILTERS_PRESETS_COLLECTION, presetId), preset);
        return presetId;
    } catch (error) {
        console.error("Error saving filter preset:", error);
        throw new Error("Nie udało się zapisać presetu filtrów");
    }
}

export async function getUserFilterPresets(userId: string): Promise<FilterPreset[]> {
    try {
        const q = query(
            collection(db, FILTERS_PRESETS_COLLECTION),
            where("userId", "==", userId),
            orderBy("createdAt", "desc")
        );
        
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.name,
                filters: data.filters,
            } as FilterPreset;
        });
    } catch (error) {
        console.error("Error getting filter presets:", error);
        return [];
    }
}

export async function deleteFilterPreset(presetId: string): Promise<void> {
    try {
        await deleteDoc(doc(db, FILTERS_PRESETS_COLLECTION, presetId));
    } catch (error) {
        console.error("Error deleting filter preset:", error);
        throw new Error("Nie udało się usunąć presetu filtrów");
    }
}

// Batch operations
export async function createBatchOperation(
    userId: string,
    type: BatchOperation["type"],
    appointmentIds: string[]
): Promise<string> {
    try {
        const operationId = doc(collection(db, BATCH_OPERATIONS_COLLECTION)).id;
        const operation: BatchOperation = {
            id: operationId,
            type,
            appointmentIds,
            status: "pending",
            createdAt: new Date(),
            userId,
        };

        await setDoc(doc(db, BATCH_OPERATIONS_COLLECTION, operationId), operation);
        return operationId;
    } catch (error) {
        console.error("Error creating batch operation:", error);
        throw new Error("Nie udało się utworzyć operacji masowej");
    }
}

export async function updateBatchOperation(
    operationId: string,
    updates: Partial<BatchOperation>
): Promise<void> {
    try {
        await setDoc(doc(db, BATCH_OPERATIONS_COLLECTION, operationId), updates, { merge: true });
    } catch (error) {
        console.error("Error updating batch operation:", error);
        throw new Error("Nie udało się zaktualizować operacji masowej");
    }
}

export async function getUserBatchOperations(userId: string): Promise<BatchOperation[]> {
    try {
        const q = query(
            collection(db, BATCH_OPERATIONS_COLLECTION),
            where("userId", "==", userId),
            orderBy("createdAt", "desc")
        );
        
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                type: data.type,
                appointmentIds: data.appointmentIds,
                status: data.status,
                createdAt: data.createdAt?.toDate() || new Date(),
                completedAt: data.completedAt?.toDate(),
                error: data.error,
                userId: data.userId,
            } as BatchOperation;
        });
    } catch (error) {
        console.error("Error getting batch operations:", error);
        return [];
    }
}

// Funkcje pomocnicze do wykonywania operacji masowych
export async function executeBatchOperation(
    operationId: string,
    appointments: any[],
    onUpdateAppointment: (appointmentId: string, updates: any) => Promise<void>,
    onDeleteAppointment: (appointmentId: string) => Promise<void>
): Promise<void> {
    try {
        // Pobierz szczegóły operacji
        const operationDoc = await getDocs(query(
            collection(db, BATCH_OPERATIONS_COLLECTION),
            where("id", "==", operationId)
        ));
        
        if (operationDoc.empty) {
            throw new Error("Operacja nie znaleziona");
        }
        
        const operation = operationDoc.docs[0].data() as BatchOperation;
        
        // Zaktualizuj status na "processing"
        await updateBatchOperation(operationId, { status: "processing" });
        
        const results = [];
        
        for (const appointmentId of operation.appointmentIds) {
            try {
                const appointment = appointments.find(apt => apt.id === appointmentId);
                if (!appointment) {
                    throw new Error(`Wizyta ${appointmentId} nie znaleziona`);
                }
                
                switch (operation.type) {
                    case "confirm":
                        await onUpdateAppointment(appointmentId, { status: "confirmed" });
                        break;
                    case "cancel":
                        await onUpdateAppointment(appointmentId, { status: "cancelled" });
                        break;
                    case "complete":
                        await onUpdateAppointment(appointmentId, { status: "completed" });
                        break;
                    case "delete":
                        await onDeleteAppointment(appointmentId);
                        break;
                }
                
                results.push({ appointmentId, success: true });
            } catch (error) {
                console.error(`Error processing appointment ${appointmentId}:`, error);
                results.push({ 
                    appointmentId, 
                    success: false, 
                    error: error instanceof Error ? error.message : "Unknown error" 
                });
            }
        }
        
        // Sprawdź czy wszystkie operacje się powiodły
        const allSuccessful = results.every(r => r.success);
        
        if (allSuccessful) {
            await updateBatchOperation(operationId, { 
                status: "completed", 
                completedAt: new Date() 
            });
        } else {
            const failedCount = results.filter(r => !r.success).length;
            await updateBatchOperation(operationId, { 
                status: "failed", 
                completedAt: new Date(),
                error: `${failedCount} z ${operation.appointmentIds.length} operacji nie powiodło się`
            });
        }
    } catch (error) {
        console.error("Error executing batch operation:", error);
        await updateBatchOperation(operationId, { 
            status: "failed", 
            completedAt: new Date(),
            error: error instanceof Error ? error.message : "Unknown error"
        });
        throw error;
    }
}

// Walidacja filtrów
export function validateFilters(filters: AppointmentFilter): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Sprawdź zakres dat
    if (filters.dateRange.from && filters.dateRange.to) {
        if (isAfter(filters.dateRange.from, filters.dateRange.to)) {
            errors.push("Data początkowa nie może być późniejsza niż data końcowa");
        }
    }
    
    // Sprawdź czy wybrano jakieś filtry (oprócz search)
    const hasFilters = 
        filters.dateRange.from ||
        filters.dateRange.to ||
        filters.employees.length > 0 ||
        filters.services.length > 0 ||
        filters.statuses.length > 0 ||
        filters.customers.length > 0;
    
    if (!hasFilters && !filters.search) {
        errors.push("Wybierz co najmniej jeden filtr lub wprowadź tekst wyszukiwania");
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

// Funkcja do generowania nazwy presetu na podstawie filtrów
export function generatePresetName(filters: AppointmentFilter): string {
    const parts: string[] = [];
    
    if (filters.dateRange.from || filters.dateRange.to) {
        parts.push("Zakres dat");
    }
    
    if (filters.employees.length > 0) {
        parts.push(`${filters.employees.length} pracowników`);
    }
    
    if (filters.services.length > 0) {
        parts.push(`${filters.services.length} usług`);
    }
    
    if (filters.statuses.length > 0) {
        parts.push(`${filters.statuses.length} statusów`);
    }
    
    if (filters.customers.length > 0) {
        parts.push(`${filters.customers.length} klientów`);
    }
    
    if (filters.search) {
        parts.push("Wyszukiwanie");
    }
    
    return parts.length > 0 ? parts.join(", ") : "Wszystkie filtry";
}