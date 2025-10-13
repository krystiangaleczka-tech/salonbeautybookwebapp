"use client";

import { useState, useEffect } from "react";
import { X, Bell, Check, Clock, Calendar, User } from "lucide-react";
import {
  subscribeToNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  formatNotificationTime,
  formatAppointmentTime,
  type Notification,
} from "@/lib/notifications-service";

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const getNotificationIcon = (type: Notification["type"]) => {
  switch (type) {
    case "appointment":
      return Calendar;
    case "cancellation":
      return X;
    case "reminder":
      return Clock;
    case "system":
      return Bell;
    default:
      return Bell;
  }
};

const getNotificationColor = (type: Notification["type"]) => {
  switch (type) {
    case "appointment":
      return "text-primary bg-primary/10";
    case "cancellation":
      return "text-destructive bg-destructive/10";
    case "reminder":
      return "text-chart-4 bg-chart-4/10";
    case "system":
      return "text-chart-5 bg-chart-5/10";
    default:
      return "text-muted-foreground bg-muted";
  }
};

export default function NotificationsModal({ isOpen, onClose }: NotificationsModalProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    
    const unsubscribe = subscribeToNotifications(
      (data) => {
        setNotifications(data);
        setLoading(false);
      },
      (error) => {
        console.error("Error subscribing to notifications:", error);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [isOpen]);

  const handleMarkAsRead = async (id: string) => {
    const success = await markNotificationAsRead(id);
    if (success) {
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id 
            ? { ...notification, read: true }
            : notification
        )
      );
    }
  };

  const handleMarkAllAsRead = async () => {
    const success = await markAllNotificationsAsRead();
    if (success) {
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-background shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Powiadomienia</h2>
              {unreadCount > 0 && (
                <p className="text-sm text-muted-foreground">{unreadCount} nieprzeczytane</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {notifications.length > 0 ? (
            <div className="divide-y divide-border">
              {notifications.map((notification) => {
                const Icon = getNotificationIcon(notification.type);
                const iconColor = getNotificationColor(notification.type);
                
                return (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-muted/50 transition-colors ${
                      !notification.read ? "bg-muted/20" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconColor}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-medium text-foreground text-sm">
                              {notification.title}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs text-muted-foreground">
                                {formatNotificationTime(notification.time)}
                              </span>
                              {notification.appointmentTime && (
                                <>
                                  <span className="text-xs text-muted-foreground">•</span>
                                  <span className="text-xs text-muted-foreground">
                                    {formatAppointmentTime(notification.appointmentTime)}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          {!notification.read && (
                            <button
                              type="button"
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="flex-shrink-0 rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                              title="Oznacz jako przeczytane"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : loading ? (
            <div className="p-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mx-auto mb-4">
                <Bell className="h-6 w-6 text-muted-foreground animate-pulse" />
              </div>
              <p className="text-muted-foreground">Ładowanie powiadomień...</p>
            </div>
          ) : (
            <div className="p-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mx-auto mb-4">
                <Bell className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">Brak powiadomień</p>
            </div>
          )}
        </div>

        {unreadCount > 0 && (
          <div className="p-4 border-t border-border">
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              className="w-full rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              Oznacz wszystkie jako przeczytane
            </button>
          </div>
        )}
      </div>
    </div>
  );
}