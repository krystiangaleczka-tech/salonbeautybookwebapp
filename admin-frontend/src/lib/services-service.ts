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
import type { ToneKey } from "@/lib/dashboard-theme";

export interface ServiceRecord {
  id: string;
  name: string;
  category?: string;
  durationMin: number;
  price?: number | null;
  noParallel: boolean;
  bufferAfterMin?: number | null;
  tone: ToneKey;
  description?: string;
  weeklyBookings?: number;
  quarterlyBookings?: number;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface ServicePayload {
  name: string;
  category?: string | null;
  durationMin: number;
  price?: number | null;
  noParallel?: boolean;
  bufferAfterMin?: number | null;
  tone?: ToneKey;
  description?: string | null;
  weeklyBookings?: number | null;
  quarterlyBookings?: number | null;
}

const servicesCollection = collection(db, "services");

function parseTone(value: unknown): ToneKey {
  const tones: ToneKey[] = ["primary", "chart3", "chart4", "chart5", "accent", "destructive"];
  if (typeof value === "string" && tones.includes(value as ToneKey)) {
    return value as ToneKey;
  }
  return "primary";
}

function ensureNumber(value: unknown, fallback = 0): number {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function ensureNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function mapService(docData: DocumentData, id: string): ServiceRecord {
  return {
    id,
    name: typeof docData.name === "string" ? docData.name : "",
    category: typeof docData.category === "string" ? docData.category : undefined,
    durationMin: ensureNumber(docData.durationMin ?? docData.duration ?? 0),
    price: ensureNullableNumber(docData.price),
    noParallel: Boolean(docData.noParallel ?? false),
    bufferAfterMin: ensureNullableNumber(docData.bufferAfterMin),
    tone: parseTone(docData.tone),
    description: typeof docData.description === "string" ? docData.description : undefined,
    weeklyBookings: ensureNumber(docData.weeklyBookings ?? 0),
    quarterlyBookings: ensureNumber(docData.quarterlyBookings ?? 0),
    createdAt: docData.createdAt instanceof Timestamp ? docData.createdAt : null,
    updatedAt: docData.updatedAt instanceof Timestamp ? docData.updatedAt : null,
  };
}

export function subscribeToServices(
  onServices: (services: ServiceRecord[]) => void,
  onError: (error: Error) => void,
) {
  const servicesQuery = query(servicesCollection, orderBy("name"));
  return onSnapshot(
    servicesQuery,
    (snapshot) => {
      const records = snapshot.docs.map((docSnapshot) => mapService(docSnapshot.data(), docSnapshot.id));
      onServices(records);
    },
    (error) => {
      onError(error);
    },
  );
}

function normalizePayload(payload: ServicePayload) {
  return {
    name: payload.name,
    category: payload.category?.trim() || "",
    durationMin: payload.durationMin,
    duration: `${payload.durationMin} min`,
    price: payload.price ?? null,
    noParallel: Boolean(payload.noParallel ?? false),
    bufferAfterMin: payload.bufferAfterMin ?? null,
    tone: parseTone(payload.tone),
    description: payload.description?.trim() || "",
    weeklyBookings: payload.weeklyBookings ?? 0,
    quarterlyBookings: payload.quarterlyBookings ?? 0,
  };
}

export async function createService(payload: ServicePayload) {
  const normalized = normalizePayload(payload);
  await addDoc(servicesCollection, {
    ...normalized,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateService(id: string, payload: ServicePayload) {
  const ref = doc(servicesCollection, id);
  const normalized = normalizePayload(payload);
  await updateDoc(ref, {
    ...normalized,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteService(id: string) {
  const ref = doc(servicesCollection, id);
  await deleteDoc(ref);
}
