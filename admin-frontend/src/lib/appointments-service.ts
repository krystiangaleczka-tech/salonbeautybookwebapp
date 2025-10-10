import {
  addDoc,
  collection,
  deleteDoc,
  doc,
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
  };
}

export async function createAppointment(payload: AppointmentPayload) {
  const normalized = normalizePayload(payload);
  await addDoc(appointmentsCollection, {
    ...normalized,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateAppointment(id: string, payload: Omit<AppointmentPayload, 'start' | 'end'> & { start: Date; end: Date }) {
  const ref = doc(appointmentsCollection, id);
  await updateDoc(ref, {
    ...payload,
    start: Timestamp.fromDate(payload.start),
    end: Timestamp.fromDate(payload.end),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteAppointment(id: string) {
  const ref = doc(appointmentsCollection, id);
  await deleteDoc(ref);
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