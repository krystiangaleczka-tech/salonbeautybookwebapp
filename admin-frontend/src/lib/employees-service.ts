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
  role: string;
  email: string;
  phone?: string;
  isActive: boolean;
  services?: string[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface EmployeePayload {
  name: string;
  role: string;
  email: string;
  phone?: string;
  isActive?: boolean;
  services?: string[];
}

const employeesCollection = collection(db, "employees");

function mapEmployee(docData: DocumentData, id: string): Employee {
  return {
    id,
    name: typeof docData.name === "string" ? docData.name : "",
    role: typeof docData.role === "string" ? docData.role : "",
    email: typeof docData.email === "string" ? docData.email : "",
    phone: typeof docData.phone === "string" ? docData.phone : undefined,
    isActive: typeof docData.isActive === "boolean" ? docData.isActive : true,
    services: Array.isArray(docData.services) ? docData.services as string[] : [],
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
  return {
    name: payload.name,
    role: payload.role,
    email: payload.email,
    phone: payload.phone ?? "",
    isActive: payload.isActive ?? true,
    services: payload.services ?? [],
  };
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