import {
  collection,
  onSnapshot,
  orderBy,
  query,
  type DocumentData,
  type QuerySnapshot,
} from "firebase/firestore"
import { db } from "@/lib/firebase"

export interface StaffWorkingInterval {
  start: string
  end: string
  breaks?: Array<{ start: string; end: string }>
}

export interface StaffRecord {
  id: string
  fullName: string
  email?: string
  phone?: string
  services: string[]
  workingHours: Record<string, StaffWorkingInterval>
  isActive: boolean
}

function mapWorkingHours(value: unknown): Record<string, StaffWorkingInterval> {
  if (typeof value !== "object" || value === null) {
    return {}
  }
  const result: Record<string, StaffWorkingInterval> = {}
  Object.entries(value as Record<string, unknown>).forEach(([day, config]) => {
    if (typeof config !== "object" || config === null) {
      return
    }
    const start = typeof (config as Record<string, unknown>).start === "string" ? (config as Record<string, unknown>).start : undefined
    const end = typeof (config as Record<string, unknown>).end === "string" ? (config as Record<string, unknown>).end : undefined
    if (!start || !end) {
      return
    }
    const breaks = Array.isArray((config as Record<string, unknown>).breaks)
      ? ((config as Record<string, unknown>).breaks as Array<Record<string, unknown>>)
          .map((item) => {
            const breakStart = typeof item.start === "string" ? item.start : undefined
            const breakEnd = typeof item.end === "string" ? item.end : undefined
            if (!breakStart || !breakEnd) {
              return null
            }
            return { start: breakStart, end: breakEnd }
          })
          .filter((item): item is { start: string; end: string } => item !== null)
      : undefined

    result[day] = {
      start,
      end,
      breaks,
    }
  })
  return result
}

function mapStaff(doc: DocumentData, id: string): StaffRecord {
  return {
    id,
    fullName: typeof doc.fullName === "string" ? doc.fullName : "",
    email: typeof doc.email === "string" ? doc.email : undefined,
    phone: typeof doc.phone === "string" ? doc.phone : undefined,
    services: Array.isArray(doc.services)
      ? doc.services.filter((serviceId: unknown): serviceId is string => typeof serviceId === "string")
      : [],
    workingHours: mapWorkingHours(doc.workingHours),
    isActive: doc.isActive !== undefined ? Boolean(doc.isActive) : true,
  }
}

export function subscribeToStaff(
  onStaff: (staff: StaffRecord[]) => void,
  onError: (error: Error) => void,
) {
  const staffQuery = query(collection(db, "staff"), orderBy("fullName"))

  return onSnapshot(
    staffQuery,
    (snapshot: QuerySnapshot) => {
      const staff = snapshot.docs.map((docSnapshot) => mapStaff(docSnapshot.data(), docSnapshot.id))
      onStaff(staff)
    },
    (error) => {
      onError(error)
    },
  )
}
