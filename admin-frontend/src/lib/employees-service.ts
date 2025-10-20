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

export interface Employee {
  id: string;
  name: string;
  email: string;
  userRole: 'owner' | 'employee' | 'tester'; // rola użytkownika w systemie
  isActive: boolean;
  phone?: string;
  services?: string[];
  // Bufory czasowe per pracownik (zostaną usunięte w przyszłości)
  personalBuffers: Record<string, number>; // serviceId -> bufferMinutes
  defaultBuffer: number; // domyślny buffer w minutach
  // Pola wielopracownicze
  googleCalendarEmail?: string; // osobisty email Google Calendar
  workingHours?: WorkingHours[]; // osobiste godziny pracy
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface WorkingHours {
  dayOfWeek: number; // 0 = niedziela, 1 = poniedziałek, etc.
  startTime: string; // "09:00"
  endTime: string; // "17:00"
  isActive: boolean;
}

export interface EmployeePayload {
  name: string;
  email: string;
  phone?: string;
  isActive?: boolean;
  services?: string[];
  // Bufory czasowe per pracownik (zostaną usunięte w przyszłości)
  personalBuffers?: Record<string, number>;
  defaultBuffer?: number;
  // Pola wielopracownicze
  googleCalendarEmail?: string;
  userRole?: 'owner' | 'employee' | 'tester';
  workingHours?: WorkingHours[];
}

const employeesCollection = collection(db, "employees");

function mapEmployee(docData: DocumentData, id: string): Employee {
  return {
    id,
    name: typeof docData.name === "string" ? docData.name : "",
    email: typeof docData.email === "string" ? docData.email : "",
    userRole: typeof docData.userRole === "string" && ['owner', 'employee', 'tester'].includes(docData.userRole)
      ? docData.userRole as 'owner' | 'employee' | 'tester'
      : 'employee', // domyślnie employee
    isActive: typeof docData.isActive === "boolean" ? docData.isActive : true,
    phone: typeof docData.phone === "string" ? docData.phone : undefined,
    services: Array.isArray(docData.services) ? docData.services as string[] : [],
    // Bufory czasowe - domyślne wartości dla kompatybilności wstecznej
    personalBuffers: typeof docData.personalBuffers === "object" && docData.personalBuffers !== null
      ? docData.personalBuffers as Record<string, number>
      : {},
    defaultBuffer: typeof docData.defaultBuffer === "number" ? docData.defaultBuffer : 0,
    // Pola wielopracownicze - domyślne wartości
    googleCalendarEmail: typeof docData.googleCalendarEmail === "string" ? docData.googleCalendarEmail : undefined,
    workingHours: Array.isArray(docData.workingHours) ? docData.workingHours as WorkingHours[] : [],
    createdAt: docData.createdAt instanceof Timestamp ? docData.createdAt : null,
    updatedAt: docData.updatedAt instanceof Timestamp ? docData.updatedAt : null,
  };
}

export function subscribeToEmployees(
  onEmployees: (employees: Employee[]) => void,
  onError: (error: Error) => void,
) {
  const employeesQuery = query(employeesCollection, orderBy("name"));
  return onSnapshot(
    employeesQuery,
    (snapshot) => {
      const records = snapshot.docs.map((docSnapshot) => mapEmployee(docSnapshot.data(), docSnapshot.id));
      onEmployees(records);
    },
    (error) => {
      onError(error);
    },
  );
}

function normalizePayload(payload: EmployeePayload) {
  const normalized: any = {
    name: payload.name,
    email: payload.email,
    phone: payload.phone ?? "",
    isActive: payload.isActive ?? true,
    services: payload.services ?? [],
    // Bufory czasowe - domyślne wartości dla kompatybilności wstecznej
    personalBuffers: payload.personalBuffers ?? {},
    defaultBuffer: payload.defaultBuffer ?? 0,
    // Pola wielopracownicze - domyślne wartości
    userRole: payload.userRole ?? 'employee',
    workingHours: payload.workingHours ?? [],
  };
  
  // Dodaj googleCalendarEmail tylko jeśli ma wartość
  if (payload.googleCalendarEmail && payload.googleCalendarEmail.trim() !== "") {
    normalized.googleCalendarEmail = payload.googleCalendarEmail;
  }
  
  return normalized;
}

export async function createEmployee(payload: EmployeePayload) {
  const normalized = normalizePayload(payload);
  await addDoc(employeesCollection, {
    ...normalized,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateEmployee(id: string, payload: EmployeePayload) {
  const ref = doc(employeesCollection, id);
  const normalized = normalizePayload(payload);
  await updateDoc(ref, {
    ...normalized,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteEmployee(id: string) {
  const ref = doc(employeesCollection, id);
  await deleteDoc(ref);
}

// Funkcja do aktualizacji buforów czasowych pracownika
export async function updateEmployeeBuffers(
  employeeId: string, 
  buffers: { personalBuffers?: Record<string, number>; defaultBuffer?: number }
) {
  const ref = doc(employeesCollection, employeeId);
  await updateDoc(ref, {
    ...buffers,
    updatedAt: serverTimestamp(),
  });
}