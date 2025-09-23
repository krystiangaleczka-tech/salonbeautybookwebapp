import {
  collection,
  onSnapshot,
  orderBy,
  query,
  type DocumentData,
  type QuerySnapshot,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { ToneKey } from "@/lib/tone"

export interface ServiceRecord {
  id: string
  name: string
  category?: string
  durationMin: number
  price?: number | null
  bufferAfterMin?: number | null
  noParallel: boolean
  tone: ToneKey
  description?: string
}

const fallbackTone: ToneKey = "primary"

function parseTone(value: unknown): ToneKey {
  const tones: ToneKey[] = ["primary", "chart3", "chart4", "chart5", "accent", "destructive"]
  if (typeof value === "string" && tones.includes(value as ToneKey)) {
    return value as ToneKey
  }
  return fallbackTone
}

function normalizeNumber(value: unknown, fallback = 0) {
  const numeric = typeof value === "number" ? value : Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

function normalizeOptionalNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null
  }
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

function mapService(doc: DocumentData, id: string): ServiceRecord {
  return {
    id,
    name: typeof doc.name === "string" ? doc.name : "",
    category: typeof doc.category === "string" ? doc.category : undefined,
    durationMin: normalizeNumber(doc.durationMin ?? doc.duration ?? 0, 60),
    price: normalizeOptionalNumber(doc.price),
    bufferAfterMin: normalizeOptionalNumber(doc.bufferAfterMin),
    noParallel: Boolean(doc.noParallel ?? false),
    tone: parseTone(doc.tone),
    description: typeof doc.description === "string" ? doc.description : undefined,
  }
}

export function subscribeToServices(
  onServices: (services: ServiceRecord[]) => void,
  onError: (error: Error) => void,
) {
  const servicesQuery = query(collection(db, "services"), orderBy("name"))

  return onSnapshot(
    servicesQuery,
    (snapshot: QuerySnapshot) => {
      const services = snapshot.docs.map((docSnapshot) =>
        mapService(docSnapshot.data(), docSnapshot.id),
      )
      onServices(services)
    },
    (error) => {
      onError(error)
    },
  )
}
