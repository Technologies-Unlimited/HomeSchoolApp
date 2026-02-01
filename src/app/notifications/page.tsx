"use client";

import { useEffect, useState } from "react";

interface NotificationItem {
  id: string;
  message?: string;
  type?: string;
}

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/notifications")
      .then((res) => (res.ok ? res.json() : { notifications: [] }))
      .then((data) => {
        setItems(data?.notifications ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <section className="flex flex-col gap-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          Notifications
        </h1>
        <p className="text-sm text-slate-600">
          Review updates and reminders delivered to your account.
        </p>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <p className="text-sm text-slate-500">Loading notifications...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-slate-500">No notifications yet.</p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <h2 className="text-base font-semibold text-slate-900">
                {item.type ?? "Update"}
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                {item.message ?? "Notification received."}
              </p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
