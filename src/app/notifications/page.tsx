"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/lib/client";
import { Breadcrumb } from "@/components/breadcrumb";
import { PageGuide } from "@/components/page-guide";

interface NotificationItem { id: string; message: string; type: string; linkUrl?: string; read: boolean; createdAt: string }
interface Preferences {
  emailEnabled: boolean;
  reminder1Day: boolean; reminder1Week: boolean; reminder2Weeks: boolean; reminder1Month: boolean; reminderCustomDays: number | null;
  notifyEventApproved: boolean; notifyEventRejected: boolean; notifyEventRsvp: boolean;
  notifyEventComment: boolean; notifyCommentReply: boolean; notifyWaitlistPromoted: boolean; notifyAnnouncement: boolean;
}

const defaultPrefs: Preferences = {
  emailEnabled: true,
  reminder1Day: true, reminder1Week: true, reminder2Weeks: false, reminder1Month: false, reminderCustomDays: null,
  notifyEventApproved: true, notifyEventRejected: true, notifyEventRsvp: true,
  notifyEventComment: true, notifyCommentReply: true, notifyWaitlistPromoted: true, notifyAnnouncement: true,
};

const typeLabels: Record<string, string> = {
  event_approved: "Event Approved",
  event_rejected: "Event Returned",
  event_rsvp: "New RSVP",
  event_comment: "Comment",
  comment_reply: "Reply",
  waitlist_promoted: "Waitlist",
  account_approved: "Welcome",
  announcement: "Announcement",
};

const typeColors: Record<string, string> = {
  event_approved: "bg-green-50 text-green-700",
  event_rejected: "bg-red-50 text-red-700",
  event_rsvp: "bg-blue-50 text-blue-700",
  event_comment: "bg-slate-100 text-slate-600",
  comment_reply: "bg-slate-100 text-slate-600",
  waitlist_promoted: "bg-green-50 text-green-700",
  account_approved: "bg-green-50 text-green-700",
  announcement: "bg-indigo-50 text-indigo-700",
};

export default function NotificationsPage() {
  const { user } = useCurrentUser();
  const router = useRouter();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"notifications" | "preferences">("notifications");
  const [prefs, setPrefs] = useState<Preferences>(defaultPrefs);
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/notifications?limit=50")
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

  async function handleMarkAllRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
    setItems((prev) => prev.map((item) => ({ ...item, read: true })));
  }

  async function handleClickNotification(item: NotificationItem) {
    if (!item.read) {
      fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: item.id }),
      });
      setItems((prev) => prev.map((n) => n.id === item.id ? { ...n, read: true } : n));
    }
    if (item.linkUrl) {
      router.push(item.linkUrl);
    }
  }

  const unreadCount = items.filter((i) => !i.read).length;

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
      <PageGuide pageKey="notifications">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Notifications</h1>
      </PageGuide>

      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1 w-fit">
          <button onClick={() => setTab("notifications")} data-active={tab === "notifications"} className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${tab === "notifications" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>
            Inbox{unreadCount > 0 ? ` (${unreadCount})` : ""}
          </button>
          <button onClick={() => setTab("preferences")} data-active={tab === "preferences"} className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${tab === "preferences" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>Preferences</button>
        </div>
        {tab === "notifications" && unreadCount > 0 && (
          <button onClick={handleMarkAllRead} className="text-xs font-semibold text-slate-500 hover:text-slate-700">
            Mark all as read
          </button>
        )}
      </div>

      {tab === "notifications" && (
        <div className="grid gap-2">
          {loading ? <p className="text-sm text-slate-500">Loading...</p> :
            items.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                <p className="text-sm text-slate-500">No notifications yet.</p>
                <p className="mt-1 text-xs text-slate-400">You'll see updates here when things happen in the community.</p>
              </div>
            ) :
            items.map((item) => (
              <button
                key={item.id}
                onClick={() => handleClickNotification(item)}
                className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-left transition hover:shadow-sm ${
                  item.read
                    ? "border-slate-100 bg-white"
                    : "border-blue-200 bg-blue-50/50"
                }`}
              >
                {!item.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${typeColors[item.type] ?? "bg-slate-100 text-slate-600"}`}>
                      {typeLabels[item.type] ?? item.type}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(item.createdAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className={`text-sm ${item.read ? "text-slate-500" : "text-slate-800 font-medium"}`}>{item.message}</p>
                </div>
                {item.linkUrl && (
                  <svg className="mt-1 h-4 w-4 shrink-0 text-slate-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                )}
              </button>
            ))
          }
        </div>
      )}

      {tab === "preferences" && (
        <div className="flex flex-col gap-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">In-app notifications</h2>
          <p className="text-xs text-slate-500 mb-3">Choose which notifications appear in your inbox.</p>
          {!prefsLoaded ? <p className="text-sm text-slate-500">Loading...</p> : (
            <div className="space-y-2">
              <Toggle label="Event approved or published" checked={prefs.notifyEventApproved} onChange={(val) => setPrefs({ ...prefs, notifyEventApproved: val })} />
              <Toggle label="Event sent back for revision" checked={prefs.notifyEventRejected} onChange={(val) => setPrefs({ ...prefs, notifyEventRejected: val })} />
              <Toggle label="Someone RSVPs to my event" checked={prefs.notifyEventRsvp} onChange={(val) => setPrefs({ ...prefs, notifyEventRsvp: val })} />
              <Toggle label="Comments on my event" checked={prefs.notifyEventComment} onChange={(val) => setPrefs({ ...prefs, notifyEventComment: val })} />
              <Toggle label="Replies to my comments" checked={prefs.notifyCommentReply} onChange={(val) => setPrefs({ ...prefs, notifyCommentReply: val })} />
              <Toggle label="Promoted off waitlist" checked={prefs.notifyWaitlistPromoted} onChange={(val) => setPrefs({ ...prefs, notifyWaitlistPromoted: val })} />
              <Toggle label="New announcements" checked={prefs.notifyAnnouncement} onChange={(val) => setPrefs({ ...prefs, notifyAnnouncement: val })} />
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Email reminders</h2>
          <p className="text-xs text-slate-500 mb-3">Get emailed before events you've RSVP'd to.</p>
          {!prefsLoaded ? <p className="text-sm text-slate-500">Loading...</p> : (
            <div className="space-y-3">
              <Toggle label="Email notifications enabled" checked={prefs.emailEnabled} onChange={(val) => setPrefs({ ...prefs, emailEnabled: val })} />
              <div className={prefs.emailEnabled ? "" : "opacity-50 pointer-events-none"}>
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-400 px-1">Remind me before events</p>
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
            </div>
          )}
        </div>

        {prefsLoaded && (
          <div className="flex items-center gap-3">
            <button onClick={handleSavePrefs} disabled={saving} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60">{saving ? "Saving..." : "Save preferences"}</button>
            {saved && <span className="text-sm text-green-600">Saved!</span>}
          </div>
        )}
        </div>
      )}
    </section>
  );
}
