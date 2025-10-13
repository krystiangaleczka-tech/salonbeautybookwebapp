import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  updateDoc,
  doc,
  onSnapshot,
  addDoc,
  serverTimestamp,
  type DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface Notification {
  id: string;
  type: "appointment" | "cancellation" | "reminder" | "system";
  title: string;
  message: string;
  time: Timestamp;
  read: boolean;
  customerId?: string;
  customerName?: string;
  appointmentId?: string;
  appointmentTime?: Timestamp;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface NotificationPayload {
  type: "appointment" | "cancellation" | "reminder" | "system";
  title: string;
  message: string;
  customerId?: string;
  customerName?: string;
  appointmentId?: string;
  appointmentTime?: Date;
}

const notificationsCollection = collection(db, "notifications");

function mapNotification(docData: DocumentData, id: string): Notification {
  return {
    id,
    type: (docData.type === "appointment" || docData.type === "cancellation" || 
          docData.type === "reminder" || docData.type === "system") 
      ? docData.type 
      : "system",
    title: typeof docData.title === "string" ? docData.title : "",
    message: typeof docData.message === "string" ? docData.message : "",
    time: docData.time instanceof Timestamp ? docData.time : Timestamp.now(),
    read: typeof docData.read === "boolean" ? docData.read : false,
    customerId: typeof docData.customerId === "string" ? docData.customerId : undefined,
    customerName: typeof docData.customerName === "string" ? docData.customerName : undefined,
    appointmentId: typeof docData.appointmentId === "string" ? docData.appointmentId : undefined,
    appointmentTime: docData.appointmentTime instanceof Timestamp ? docData.appointmentTime : undefined,
    createdAt: docData.createdAt instanceof Timestamp ? docData.createdAt : null,
    updatedAt: docData.updatedAt instanceof Timestamp ? docData.updatedAt : null,
  };
}

// Pobieranie powiadomień z real-time updates
export function subscribeToNotifications(
  onNotifications: (notifications: Notification[]) => void,
  onError: (error: Error) => void,
) {
  const notificationsQuery = query(
    notificationsCollection,
    orderBy("time", "desc"),
    limit(50)
  );
  
  return onSnapshot(
    notificationsQuery,
    (snapshot) => {
      const records = snapshot.docs.map((docSnapshot) => 
        mapNotification(docSnapshot.data(), docSnapshot.id)
      );
      onNotifications(records);
    },
    (error) => {
      onError(error);
    },
  );
}

// Pobieranie nieprzeczytanych powiadomień
export async function getUnreadNotifications(): Promise<Notification[]> {
  try {
    const notificationsQuery = query(
      notificationsCollection,
      where("read", "==", false),
      orderBy("time", "desc"),
      limit(20)
    );
    
    const snapshot = await getDocs(notificationsQuery);
    return snapshot.docs.map((doc) => mapNotification(doc.data(), doc.id));
  } catch (error) {
    console.error("Error fetching unread notifications:", error);
    return [];
  }
}

// Oznaczanie powiadomienia jako przeczytane
export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  try {
    const notificationRef = doc(notificationsCollection, notificationId);
    await updateDoc(notificationRef, {
      read: true,
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return false;
  }
}

// Oznaczanie wszystkich powiadomień jako przeczytane
export async function markAllNotificationsAsRead(): Promise<boolean> {
  try {
    const unreadQuery = query(
      notificationsCollection,
      where("read", "==", false)
    );
    
    const snapshot = await getDocs(unreadQuery);
    
    // Aktualizuj wszystkie nieprzeczytane powiadomienia
    const updatePromises = snapshot.docs.map((doc) =>
      updateDoc(doc.ref, {
        read: true,
        updatedAt: serverTimestamp(),
      })
    );
    
    await Promise.all(updatePromises);
    return true;
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return false;
  }
}

// Tworzenie nowego powiadomienia
export async function createNotification(payload: NotificationPayload): Promise<string | null> {
  try {
    const normalized = {
      type: payload.type,
      title: payload.title,
      message: payload.message,
      read: false,
      customerId: payload.customerId || null,
      customerName: payload.customerName || null,
      appointmentId: payload.appointmentId || null,
      appointmentTime: payload.appointmentTime ? Timestamp.fromDate(payload.appointmentTime) : null,
      time: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    const docRef = await addDoc(notificationsCollection, normalized);
    return docRef.id;
  } catch (error) {
    console.error("Error creating notification:", error);
    return null;
  }
}

// Funkcje do generowania powiadomień na podstawie zdarzeń

// Powiadomienie o nowej rezerwacji
export async function createAppointmentNotification(
  appointmentId: string,
  customerName: string,
  appointmentTime: Date
): Promise<string | null> {
  return createNotification({
    type: "appointment",
    title: "Nowa rezerwacja",
    message: `${customerName} zapisała się na wizytę`,
    customerName,
    appointmentId,
    appointmentTime,
  });
}

// Powiadomienie o anulowaniu wizyty
export async function createCancellationNotification(
  appointmentId: string,
  customerName: string,
  appointmentTime: Date
): Promise<string | null> {
  return createNotification({
    type: "cancellation",
    title: "Anulowanie wizyty",
    message: `${customerName} odwołała wizytę`,
    customerName,
    appointmentId,
    appointmentTime,
  });
}

// Powiadomienie przypominające o wizycie
export async function createReminderNotification(
  appointmentId: string,
  customerName: string,
  appointmentTime: Date
): Promise<string | null> {
  return createNotification({
    type: "reminder",
    title: "Przypomnienie o wizycie",
    message: `Wizyta ${customerName} za 30 minut`,
    customerName,
    appointmentId,
    appointmentTime,
  });
}

// Powiadomienie systemowe
export async function createSystemNotification(
  title: string,
  message: string
): Promise<string | null> {
  return createNotification({
    type: "system",
    title,
    message,
  });
}

// Funkcja formatująca czas powiadomienia
export function formatNotificationTime(timestamp: Timestamp): string {
  const now = new Date();
  const notificationTime = timestamp.toDate();
  const diffMs = now.getTime() - notificationTime.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) {
    return "Przed chwilą";
  } else if (diffMinutes < 60) {
    return `${diffMinutes} minut temu`;
  } else if (diffHours < 24) {
    return `${diffHours} godzin temu`;
  } else if (diffDays === 1) {
    return "Wczoraj";
  } else if (diffDays < 7) {
    return `${diffDays} dni temu`;
  } else {
    return notificationTime.toLocaleDateString("pl-PL");
  }
}

// Funkcja formatująca czas wizyty
export function formatAppointmentTime(timestamp: Timestamp): string {
  const appointmentTime = timestamp.toDate();
  return appointmentTime.toLocaleTimeString("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
  });
}