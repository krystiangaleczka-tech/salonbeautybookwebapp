import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  type DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface Appointment {
  id: string;
  serviceId: string;
  clientId: string;
  staffName: string;
  start: Timestamp;
  end: Timestamp;
  status: 'confirmed' | 'pending' | 'cancelled';
  notes?: string;
  price?: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  mainCalendarEventId?: string; // ID wydarzenia w głównym kalendarzu Google
  employeeCalendarEventId?: string; // ID wydarzenia w kalendarzu pracownika Google
}

export interface AppointmentPayload {
  serviceId: string;
  clientId: string;
  staffName: string;
  start: Date;
  end: Date;
  status?: 'confirmed' | 'pending' | 'cancelled';
  notes?: string;
  price?: number;
  mainCalendarEventId?: string; // ID wydarzenia w głównym kalendarzu Google
  employeeCalendarEventId?: string; // ID wydarzenia w kalendarzu pracownika Google
}

const appointmentsCollection = collection(db, "appointments");

function mapAppointment(docData: DocumentData, id: string): Appointment {
  return {
    id,
    serviceId: typeof docData.serviceId === "string" ? docData.serviceId : "",
    clientId: typeof docData.clientId === "string" ? docData.clientId : "",
    staffName: typeof docData.staffName === "string" ? docData.staffName : "",
    start: docData.start instanceof Timestamp ? docData.start : Timestamp.now(),
    end: docData.end instanceof Timestamp ? docData.end : Timestamp.now(),
    status: (docData.status === "confirmed" || docData.status === "pending" || docData.status === "cancelled")
      ? docData.status
      : "pending",
    notes: typeof docData.notes === "string" ? docData.notes : undefined,
    price: typeof docData.price === "number" ? docData.price : undefined,
    createdAt: docData.createdAt instanceof Timestamp ? docData.createdAt : null,
    updatedAt: docData.updatedAt instanceof Timestamp ? docData.updatedAt : null,
    mainCalendarEventId: typeof docData.mainCalendarEventId === "string" ? docData.mainCalendarEventId : undefined,
    employeeCalendarEventId: typeof docData.employeeCalendarEventId === "string" ? docData.employeeCalendarEventId : undefined,
  };
}

export function subscribeToAppointments(
  onAppointments: (appointments: Appointment[]) => void,
  onError: (error: Error) => void,
) {
  const appointmentsQuery = query(appointmentsCollection, orderBy("start"));
  return onSnapshot(
    appointmentsQuery,
    (snapshot) => {
      const records = snapshot.docs.map((docSnapshot) => mapAppointment(docSnapshot.data(), docSnapshot.id));
      onAppointments(records);
    },
    (error) => {
      onError(error);
    },
  );
}

// ✅ NOWY KOD (jednorazowy fetch) - zastępuje problematyczne onSnapshot
export async function getAppointments(): Promise<Appointment[]> {
  const appointmentsQuery = query(appointmentsCollection, orderBy("start"));
  const snapshot = await getDocs(appointmentsQuery);
  return snapshot.docs.map((docSnapshot) => mapAppointment(docSnapshot.data(), docSnapshot.id));
}

function normalizePayload(payload: AppointmentPayload) {
  return {
    serviceId: payload.serviceId,
    clientId: payload.clientId,
    staffName: payload.staffName,
    start: Timestamp.fromDate(payload.start),
    end: Timestamp.fromDate(payload.end),
    status: payload.status ?? "pending",
    notes: payload.notes ?? "",
    price: payload.price ?? null,
    mainCalendarEventId: payload.mainCalendarEventId ?? null,
    employeeCalendarEventId: payload.employeeCalendarEventId ?? null,
  };
}

export async function createAppointment(payload: AppointmentPayload): Promise<{ id: string }> {
  const normalized = normalizePayload(payload);
  const docRef = await addDoc(appointmentsCollection, {
    ...normalized,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { id: docRef.id };
}

export async function updateAppointment(
  id: string,
  payload: Omit<AppointmentPayload, 'start' | 'end'> & {
    start: Date;
    end: Date;
    mainCalendarEventId?: string;
    employeeCalendarEventId?: string;
  }
) {
  const ref = doc(appointmentsCollection, id);
  
  const updateData: any = {
    serviceId: payload.serviceId,
    clientId: payload.clientId,
    staffName: payload.staffName,
    start: Timestamp.fromDate(payload.start),
    end: Timestamp.fromDate(payload.end),
    status: payload.status ?? "pending",
    notes: payload.notes ?? "",
    price: payload.price ?? null,
    updatedAt: serverTimestamp(),
  };
  
  // ✅ TYLKO aktualizuj mainCalendarEventId jeśli jest explicite podane
  if (payload.mainCalendarEventId !== undefined) {
    updateData.mainCalendarEventId = payload.mainCalendarEventId;
  }
  
  // ✅ TYLKO aktualizuj employeeCalendarEventId jeśli jest explicite podane
  if (payload.employeeCalendarEventId !== undefined) {
    updateData.employeeCalendarEventId = payload.employeeCalendarEventId;
  }
  
  await updateDoc(ref, updateData);
}

export async function deleteAppointment(id: string) {
  const ref = doc(appointmentsCollection, id);
  await deleteDoc(ref);
}

// Funkcja do aktualizacji pól Google Calendar Event IDs
export async function updateGoogleCalendarEventIds(
  id: string,
  { mainCalendarEventId, employeeCalendarEventId }: {
    mainCalendarEventId?: string;
    employeeCalendarEventId?: string;
  }
) {
  const ref = doc(appointmentsCollection, id);
  const updateData: any = {
    updatedAt: serverTimestamp(),
  };
  
  if (mainCalendarEventId !== undefined) {
    updateData.mainCalendarEventId = mainCalendarEventId;
  }
  
  if (employeeCalendarEventId !== undefined) {
    updateData.employeeCalendarEventId = employeeCalendarEventId;
  }
  
  await updateDoc(ref, updateData);
}

// Funkcja do aktualizacji tylko pola Google Calendar Event ID (dla kompatybilności wstecznej)
export async function updateGoogleCalendarEventId(id: string, googleCalendarEventId: string) {
  return updateGoogleCalendarEventIds(id, { mainCalendarEventId: googleCalendarEventId });
}

// Funkcja do obliczania efektywnego czasu zakończenia wizyty z uwzględnieniem buforów
export function calculateEffectiveEndTime(
  baseEndTime: Date,
  employee: { personalBuffers: Record<string, number>; defaultBuffer: number },
  serviceId: string
): Date {
  const buffer = employee.personalBuffers[serviceId] || employee.defaultBuffer || 0;
  return new Date(baseEndTime.getTime() + buffer * 60000);
}