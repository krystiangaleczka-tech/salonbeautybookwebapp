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

export interface Customer {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  notes?: string;
  blacklisted?: boolean;
  lastVisit?: Timestamp | null;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface CustomerPayload {
  fullName: string;
  phone: string;
  email?: string;
  notes?: string;
  blacklisted?: boolean;
  lastVisit?: Date | null;
}

const customersCollection = collection(db, "customers");

function mapCustomer(docData: DocumentData, id: string): Customer {
  return {
    id,
    fullName: typeof docData.fullName === "string" ? docData.fullName : "",
    phone: typeof docData.phone === "string" ? docData.phone : "",
    email: typeof docData.email === "string" ? docData.email : "",
    notes: typeof docData.notes === "string" ? docData.notes : "",
    blacklisted: typeof docData.blacklisted === "boolean" ? docData.blacklisted : false,
    lastVisit: docData.lastVisit instanceof Timestamp ? docData.lastVisit : null,
    createdAt: docData.createdAt instanceof Timestamp ? docData.createdAt : null,
    updatedAt: docData.updatedAt instanceof Timestamp ? docData.updatedAt : null,
  };
}

export function subscribeToCustomers(
  onCustomers: (customers: Customer[]) => void,
  onError: (error: Error) => void,
) {
  const customersQuery = query(customersCollection, orderBy("fullName"));

  return onSnapshot(
    customersQuery,
    (snapshot) => {
      const customers = snapshot.docs.map((docSnapshot) => mapCustomer(docSnapshot.data(), docSnapshot.id));
      onCustomers(customers);
    },
    (error) => {
      onError(error);
    },
  );
}

export async function createCustomer(payload: CustomerPayload) {
  await addDoc(customersCollection, {
    fullName: payload.fullName,
    phone: payload.phone,
    email: payload.email ?? "",
    notes: payload.notes ?? "",
    blacklisted: Boolean(payload.blacklisted),
    lastVisit: payload.lastVisit ? Timestamp.fromDate(payload.lastVisit) : null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateCustomer(id: string, payload: CustomerPayload) {
  const ref = doc(customersCollection, id);
  await updateDoc(ref, {
    fullName: payload.fullName,
    phone: payload.phone,
    email: payload.email ?? "",
    notes: payload.notes ?? "",
    blacklisted: Boolean(payload.blacklisted),
    lastVisit: payload.lastVisit ? Timestamp.fromDate(payload.lastVisit) : null,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteCustomer(id: string) {
  const ref = doc(customersCollection, id);
  await deleteDoc(ref);
}
