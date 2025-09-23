import {
  collection,
  onSnapshot,
  query,
  where,
  type DocumentData,
  type QuerySnapshot,
} from "firebase/firestore"
import { db } from "@/lib/firebase"

export interface BlockRecord {
  id: string
  staffId: string
  startTime: Date
  endTime: Date
  reason?: string
}

function mapBlock(doc: DocumentData, id: string): BlockRecord | null {
  if (typeof doc.staffId !== "string") {
    return null
  }
  const start = typeof doc.startTime?.toDate === "function" ? doc.startTime.toDate() : undefined
  const end = typeof doc.endTime?.toDate === "function" ? doc.endTime.toDate() : undefined
  if (!start || !end) {
    return null
  }
  return {
    id,
    staffId: doc.staffId,
    startTime: start,
    endTime: end,
    reason: typeof doc.reason === "string" ? doc.reason : undefined,
  }
}

export function subscribeToBlocks(
  staffId: string,
  onBlocks: (blocks: BlockRecord[]) => void,
  onError: (error: Error) => void,
) {
  const blocksQuery = query(collection(db, "blocks"), where("staffId", "==", staffId))

  return onSnapshot(
    blocksQuery,
    (snapshot: QuerySnapshot) => {
      const blocks = snapshot.docs
        .map((docSnapshot) => mapBlock(docSnapshot.data(), docSnapshot.id))
        .filter((block): block is BlockRecord => block !== null)
      onBlocks(blocks)
    },
    (error) => {
      onError(error)
    },
  )
}
