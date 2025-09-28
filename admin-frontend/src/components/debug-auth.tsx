"use client";

import { useAuth } from "@/hooks/useAuth";
import { auth } from "@/lib/firebase";

export function DebugAuth() {
  const { user, loading } = useAuth();

  return (
    <div className="p-4 border rounded-lg bg-white">
      <h2 className="text-lg font-semibold mb-2">Debug Auth</h2>
      <div className="space-y-2 text-sm">
        <div><strong>Loading:</strong> {loading ? "true" : "false"}</div>
        <div><strong>User:</strong> {user ? JSON.stringify(user.email) : "null"}</div>
        <div><strong>Auth Current User:</strong> {auth.currentUser ? JSON.stringify(auth.currentUser.email) : "null"}</div>
        <div><strong>Auth Ready:</strong> {auth ? "true" : "false"}</div>
      </div>
    </div>
  );
}