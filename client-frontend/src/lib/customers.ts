import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  type DocumentData,
  type QuerySnapshot,
} from "firebase/firestore"
import { db } from "@/lib/firebase"

export interface Customer {
  id: string
  fullName: string
  phone?: string
  email?: string
  preferences?: {
    preferredStaffId?: string
    preferredTimeSlots?: string[]
    favoriteServices?: string[]
  }
  lastVisit?: Date | null
}

function mapCustomer(doc: DocumentData, id: string): Customer {
  return {
    id,
    fullName: typeof doc.fullName === "string" ? doc.fullName : "",
    phone: typeof doc.phone === "string" ? doc.phone : undefined,
    email: typeof doc.email === "string" ? doc.email : undefined,
    preferences: typeof doc.preferences === "object" && doc.preferences
      ? {
          preferredStaffId:
            typeof doc.preferences.preferredStaffId === "string"
              ? doc.preferences.preferredStaffId
              : undefined,
          preferredTimeSlots: Array.isArray(doc.preferences.preferredTimeSlots)
            ? doc.preferences.preferredTimeSlots
                .filter((slot: unknown): slot is string => typeof slot === "string")
            : undefined,
          favoriteServices: Array.isArray(doc.preferences.favoriteServices)
            ? doc.preferences.favoriteServices
                .filter((serviceId: unknown): serviceId is string => typeof serviceId === "string")
            : undefined,
        }
      : undefined,
    lastVisit:
      typeof doc.lastVisit?.toDate === "function" ? doc.lastVisit.toDate() : undefined,
  }
}

export function subscribeToCustomers(
  onCustomers: (customers: Customer[]) => void,
  onError: (error: Error) => void,
) {
  const customersQuery = query(collection(db, "customers"), orderBy("fullName"))

  return onSnapshot(
    customersQuery,
    (snapshot: QuerySnapshot) => {
      const customers = snapshot.docs.map((docSnapshot) =>
        mapCustomer(docSnapshot.data(), docSnapshot.id),
      )
      onCustomers(customers)
    },
    (error) => {
      onError(error)
    },
  )
}

export async function createQuickCustomer(payload: {
  fullName: string
  phone?: string
  email?: string
}) {
  const docPayload = {
    fullName: payload.fullName,
    phone: payload.phone ?? "",
    email: payload.email ?? "",
    createdAt: serverTimestamp(),
  }

  await addDoc(collection(db, "customers"), docPayload)
}
