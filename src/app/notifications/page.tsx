"use client";

import { useEffect, useState } from "react";
import { useCurrentUser } from "@/lib/client";
import { Breadcrumb } from "@/components/breadcrumb";

interface NotificationItem { id: string; message?: string; type?: string; createdAt?: string }
interface Preferences { emailEnabled: boolean; reminder1Day: boolean; reminder1Week: boolean; reminder2Weeks: boolean; reminder1Month: boolean; reminderCustomDays: number | null }

const defaultPrefs: Preferences = { emailEnabled: true, reminder1Day: true, reminder1Week: true, reminder2Weeks: false, reminder1Month: false, reminderCustomDays: null };

export default function NotificationsPage() {
  const { user } = useCurrentUser();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"notifications" | "preferences">("notifications");
  const [prefs, setPrefs] = useState<Preferences>(defaultPrefs);
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/notifications")
      .then((res) => (res.ok ? res.json() : { notifications: [] }))
      .then((data) => { setItems(data?.notifications ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (tab === "preferences" && !prefsLoaded) {
      fetch("/api/notifications/preferences")
        .then((res) => (res.ok ? res.json() : { preferences: defaultPrefs }))
        .then((data) => { setPrefs(data?.preferences ?? defaultPrefs); setPrefsLoaded(true); })
        .catch(() => setPrefsLoaded(true));
    }
  }, [tab, prefsLoaded]);

  async function handleSavePrefs() {
    setSaving(true); setSaved(false);
    await fetch("/api/notifications/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(prefs),
    });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (val: boolean) => void }) {
    return (
      <label className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
        <span className="text-sm text-slate-700">{label}</span>
        <button type="button" onClick={() => onChange(!checked)} className={`relative h-6 w-11 rounded-full transition ${checked ? "bg-slate-900" : "bg-slate-300"}`} role="switch" aria-checked={checked}>
          <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? "left-[22px]" : "left-0.5"}`} />
        </button>
      </label>
    );
  }

  return (
    <section className="flex flex-col gap-6">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Notifications" }]} />
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Notifications</h1>

      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 w-fit">
        <button onClick={() => setTab("notifications")} className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${tab === "notifications" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>Inbox</button>
        <button onClick={() => setTab("preferences")} className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${tab === "preferences" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>Preferences</button>
      </div>

      {tab === "notifications" && (
        <div className="grid gap-4">
          {loading ? <p className="text-sm text-slate-500">Loading...</p> :
            items.length === 0 ? <p className="text-sm text-slate-500">No notifications yet.</p> :
            items.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{item.type ?? "Update"}</p>
                <p className="mt-1 text-sm text-slate-700">{item.message ?? "Notification received."}</p>
                {item.createdAt && <p className="mt-2 text-[10px] text-slate-400">{new Date(item.createdAt).toLocaleString()}</p>}
              </div>
            ))
          }
        </div>
      )}

      {tab === "preferences" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Email reminder preferences</h2>
          {!prefsLoaded ? <p className="text-sm text-slate-500">Loading...</p> : (
            <div className="space-y-3">
              <Toggle label="Email notifications enabled" checked={prefs.emailEnabled} onChange={(val) => setPrefs({ ...prefs, emailEnabled: val })} />
              <div className={prefs.emailEnabled ? "" : "opacity-50 pointer-events-none"}>
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-400 px-1">Event reminders</p>
                <div className="space-y-2">
                  <Toggle label="1 day before" checked={prefs.reminder1Day} onChange={(val) => setPrefs({ ...prefs, reminder1Day: val })} />
                  <Toggle label="1 week before" checked={prefs.reminder1Week} onChange={(val) => setPrefs({ ...prefs, reminder1Week: val })} />
                  <Toggle label="2 weeks before" checked={prefs.reminder2Weeks} onChange={(val) => setPrefs({ ...prefs, reminder2Weeks: val })} />
                  <Toggle label="1 month before" checked={prefs.reminder1Month} onChange={(val) => setPrefs({ ...prefs, reminder1Month: val })} />
                </div>
                <div className="mt-3">
                  <label className="flex items-center gap-3 rounded-lg bg-slate-50 px-4 py-3">
                    <span className="text-sm text-slate-700">Custom reminder (days before)</span>
                    <input type="number" min={1} max={365} value={prefs.reminderCustomDays ?? ""} onChange={(e) => setPrefs({ ...prefs, reminderCustomDays: e.target.value ? parseInt(e.target.value) : null })} placeholder="—" className="h-8 w-16 rounded-lg border border-slate-300 px-2 text-center text-sm text-slate-900 outline-none focus:border-slate-500" />
                  </label>
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button onClick={handleSavePrefs} disabled={saving} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60">{saving ? "Saving..." : "Save preferences"}</button>
                {saved && <span className="text-sm text-green-600">Saved!</span>}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
