"use client";

import { useEffect, useState, useCallback } from "react";
import { useCurrentUser } from "@/lib/client";
import { Breadcrumb } from "@/components/breadcrumb";

interface PendingEvent { id: string; title: string; startDate?: string }
interface PendingMember { id: string; firstName?: string; lastName?: string; email: string; createdAt?: string }
interface UserItem { id: string; email: string; firstName?: string; lastName?: string; role: string; isActive: boolean; emailVerified: boolean; approved: boolean }

const VALID_ROLES = ["user", "admin", "super_admin"];
const PRIORITIES = ["normal", "important", "urgent"] as const;
const priorityStyles: Record<string, string> = { normal: "bg-slate-100 text-slate-700", important: "bg-amber-100 text-amber-800", urgent: "bg-red-100 text-red-800" };

export default function AdminPage() {
  const { user, loading } = useCurrentUser();
  const [tab, setTab] = useState<"overview" | "users" | "announcements" | "invites">("overview");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Overview state
  const [pendingEvents, setPendingEvents] = useState<PendingEvent[]>([]);
  const [pendingMembers, setPendingMembers] = useState<PendingMember[]>([]);
  const [notes, setNotes] = useState("");
  const [notesSaving, setNotesSaving] = useState(false);

  // Users state
  const [users, setUsers] = useState<UserItem[]>([]);
  const [usersLoaded, setUsersLoaded] = useState(false);

  // Announcements state
  const [announcements, setAnnouncements] = useState<{ id: string; title: string; priority: string; visibility?: string; pinned: boolean; publishAt?: string; createdAt: string }[]>([]);
  const [announcementForm, setAnnouncementForm] = useState({ title: "", content: "", priority: "normal" as string, visibility: "members" as string, pinned: false, publishAt: "" });
  const [announcementSaving, setAnnouncementSaving] = useState(false);
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<string | null>(null);

  // Invites state
  const [invites, setInvites] = useState<{ id: string; email: string; role: string; status: string; invitedByName: string; createdAt: string }[]>([]);
  const [inviteForm, setInviteForm] = useState({ email: "", role: "user" as string, message: "" });
  const [inviteSending, setInviteSending] = useState(false);

  const isAdminUser = user?.role === "admin" || user?.role === "super_admin";

  function showMsg(message: string) { setSuccess(message); setError(null); setTimeout(() => setSuccess(null), 3000); }

  const loadOverview = useCallback(() => {
    fetch("/api/events/pending").then((r) => r.ok ? r.json() : { events: [] }).then((d) => setPendingEvents(d?.events ?? [])).catch(() => setError("Failed to load pending events."));
    fetch("/api/admin/users?limit=100").then((r) => r.ok ? r.json() : { users: [] }).then((d) => {
      const all = d?.users ?? [];
      setPendingMembers(all.filter((m: Record<string, unknown>) => m.approved === false && m.emailVerified === true));
    }).catch(() => setError("Failed to load users."));
    fetch("/api/admin/notes").then((r) => r.ok ? r.json() : { content: "" }).then((d) => setNotes(d?.content ?? "")).catch(() => {});
  }, []);

  function loadUsers() {
    fetch("/api/admin/users?limit=100").then((r) => r.ok ? r.json() : { users: [] }).then((d) => { setUsers(d?.users ?? []); setUsersLoaded(true); }).catch(() => setUsersLoaded(true));
  }

  function loadAnnouncements() {
    // Fetch all including scheduled (admin sees everything)
    fetch("/api/announcements?limit=50").then((r) => r.ok ? r.json() : { announcements: [] }).then((d) => setAnnouncements(d?.announcements ?? [])).catch(() => {});
  }

  function loadInvites() {
    fetch("/api/admin/invite").then((r) => r.ok ? r.json() : { invites: [] }).then((d) => setInvites(d?.invites ?? [])).catch(() => {});
  }

  async function handleSendInvite() {
    if (!inviteForm.email.trim() || !inviteForm.email.includes("@")) { setError("Valid email required."); return; }
    setInviteSending(true); setError(null);
    const r = await fetch("/api/admin/invite", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(inviteForm) });
    setInviteSending(false);
    if (r.ok) {
      setInviteForm({ email: "", role: "user", message: "" });
      showMsg("Invite sent!");
      loadInvites();
    } else { const d = await r.json().catch(() => ({})); setError(d.error || "Failed to send invite."); }
  }

  useEffect(() => { if (!user || !isAdminUser) return; loadOverview(); }, [user, isAdminUser, loadOverview]);
  useEffect(() => { if (tab === "users" && !usersLoaded) loadUsers(); }, [tab, usersLoaded]);
  useEffect(() => { if (tab === "announcements") loadAnnouncements(); }, [tab]);
  useEffect(() => { if (tab === "invites") loadInvites(); }, [tab]);

  // Event actions
  async function handleApproveEvent(eventId: string) {
    setActionLoading(eventId);
    const r = await fetch(`/api/events/${eventId}/approve`, { method: "POST" });
    setActionLoading(null);
    if (r.ok) { setPendingEvents((p) => p.filter((e) => e.id !== eventId)); showMsg("Event approved."); } else setError("Failed to approve.");
  }
  async function handleRejectEvent(eventId: string) {
    const reason = prompt("Rejection reason (optional):"); if (reason === null) return;
    setActionLoading(eventId);
    const r = await fetch(`/api/events/${eventId}/reject`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason }) });
    setActionLoading(null);
    if (r.ok) { setPendingEvents((p) => p.filter((e) => e.id !== eventId)); showMsg("Event rejected."); } else setError("Failed to reject.");
  }

  // Member actions
  async function handleApproveMember(id: string) {
    setActionLoading(id);
    const r = await fetch(`/api/admin/approve/${id}`, { method: "POST" });
    setActionLoading(null);
    if (r.ok) { setPendingMembers((p) => p.filter((m) => m.id !== id)); showMsg("Member approved."); setUsersLoaded(false); } else setError("Failed to approve.");
  }
  async function handleDenyMember(id: string) {
    if (!confirm("Deny this membership?")) return;
    setActionLoading(id);
    const r = await fetch(`/api/admin/approve/${id}`, { method: "DELETE" });
    setActionLoading(null);
    if (r.ok) { setPendingMembers((p) => p.filter((m) => m.id !== id)); showMsg("Denied."); } else setError("Failed.");
  }

  // User role change
  async function handleRoleChange(userId: string, newRole: string) {
    setActionLoading(userId);
    const r = await fetch(`/api/admin/users/${userId}/role`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role: newRole }) });
    setActionLoading(null);
    if (r.ok) { setUsers((p) => p.map((u) => u.id === userId ? { ...u, role: newRole } : u)); showMsg("Role updated."); } else setError("Failed.");
  }

  // Notes
  async function handleSaveNotes() {
    setNotesSaving(true);
    await fetch("/api/admin/notes", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: notes }) });
    setNotesSaving(false); showMsg("Notes saved.");
  }

  // Announcements
  async function handleSaveAnnouncement() {
    if (!announcementForm.title.trim() || !announcementForm.content.trim()) { setError("Title and content required."); return; }
    setAnnouncementSaving(true); setError(null);
    const url = editingAnnouncementId ? `/api/announcements/${editingAnnouncementId}` : "/api/announcements";
    const method = editingAnnouncementId ? "PATCH" : "POST";
    const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({
      ...announcementForm,
      publishAt: announcementForm.publishAt || null,
    }) });
    setAnnouncementSaving(false);
    if (r.ok) {
      setAnnouncementForm({ title: "", content: "", priority: "normal", visibility: "members", pinned: false, publishAt: "" });
      setEditingAnnouncementId(null);
      showMsg(editingAnnouncementId ? "Updated." : "Published.");
      loadAnnouncements();
    } else { const d = await r.json().catch(() => ({})); setError(d.error || "Failed."); }
  }
  async function handleDeleteAnnouncement(id: string) {
    if (!confirm("Delete this announcement?")) return;
    const r = await fetch(`/api/announcements/${id}`, { method: "DELETE" });
    if (r.ok) loadAnnouncements();
  }


  if (loading) return <p className="text-sm text-slate-500">Loading...</p>;
  if (!user || !isAdminUser) return <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h1 className="text-xl font-semibold text-slate-900">Admin access required</h1></section>;

  return (
    <section className="flex flex-col gap-6">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Admin" }]} />
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Admin dashboard</h1>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
        {(["overview", "users", "announcements", "invites"] as const).map((tabName) => (
          <button key={tabName} onClick={() => setTab(tabName)} className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold capitalize transition ${tab === tabName ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            {tabName}
          </button>
        ))}
      </div>

      {success && <p className="text-sm text-green-600" role="status" aria-live="polite">{success}</p>}
      {error && <p className="text-sm text-red-600" role="alert" aria-live="polite">{error}</p>}

      {/* ─── OVERVIEW TAB ─── */}
      {tab === "overview" && (
        <div className="flex flex-col gap-6">
          {pendingMembers.length > 0 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
              <h2 className="text-sm font-semibold text-slate-900">Pending members ({pendingMembers.length})</h2>
              <div className="mt-3 grid gap-2">
                {pendingMembers.map((m) => (
                  <div key={m.id} className="flex items-center justify-between rounded-lg border border-amber-200 bg-white px-4 py-2">
                    <div><p className="text-sm font-medium text-slate-800">{m.firstName} {m.lastName}</p><p className="text-xs text-slate-500">{m.email}</p></div>
                    <div className="flex gap-2">
                      <button onClick={() => handleApproveMember(m.id)} disabled={actionLoading === m.id} className="rounded-full bg-green-600 px-3 py-1 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-60">{actionLoading === m.id ? "..." : "Approve"}</button>
                      <button onClick={() => handleDenyMember(m.id)} disabled={actionLoading === m.id} className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60">Deny</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900">Event approvals</h2>
              <div className="mt-3 grid gap-2">
                {pendingEvents.length === 0 ? <p className="text-xs text-slate-500">No pending events.</p> : pendingEvents.map((e) => (
                  <div key={e.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                    <div><p className="text-sm font-medium text-slate-800">{e.title}</p>{e.startDate && <p className="text-xs text-slate-500">{new Date(e.startDate).toLocaleDateString()}</p>}</div>
                    <div className="flex gap-2">
                      <button onClick={() => handleApproveEvent(e.id)} disabled={actionLoading === e.id} className="rounded-full bg-green-600 px-3 py-1 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-60">{actionLoading === e.id ? "..." : "Approve"}</button>
                      <button onClick={() => handleRejectEvent(e.id)} disabled={actionLoading === e.id} className="rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60">Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900">Team notes</h2>
              <textarea className="mt-3 h-28 w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 outline-none focus:border-slate-400" placeholder="Admin notes..." value={notes} onChange={(e) => setNotes(e.target.value)} />
              <button onClick={handleSaveNotes} disabled={notesSaving} className="mt-2 rounded-full bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-60">{notesSaving ? "Saving..." : "Save"}</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── USERS TAB ─── */}
      {tab === "users" && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead><tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <th className="px-4 py-3">Name</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Status</th>
            </tr></thead>
            <tbody>
              {users.map((userItem) => (
                <tr key={userItem.id} className="border-b border-slate-100">
                  <td className="px-4 py-2 font-medium text-slate-800">{userItem.firstName} {userItem.lastName}</td>
                  <td className="px-4 py-2 text-slate-600">{userItem.email}</td>
                  <td className="px-4 py-2">
                    <select value={userItem.role} disabled={actionLoading === userItem.id || userItem.id === user?.id} onChange={(e) => handleRoleChange(userItem.id, e.target.value)} className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 outline-none disabled:opacity-50" aria-label="Role">
                      {VALID_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex gap-1">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${userItem.emailVerified ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>{userItem.emailVerified ? "Verified" : "Unverified"}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${userItem.approved ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{userItem.approved ? "Approved" : "Pending"}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── ANNOUNCEMENTS TAB ─── */}
      {tab === "announcements" && (
        <div className="flex flex-col gap-6">
          {/* Create/edit form */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">{editingAnnouncementId ? "Edit announcement" : "New announcement"}</h2>
            <div className="grid gap-3">
              <input type="text" placeholder="Title" value={announcementForm.title} onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })} className="h-10 rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none focus:border-slate-500" />
              <textarea placeholder="Content..." rows={3} value={announcementForm.content} onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500" />
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <p className="mb-1 text-xs font-medium text-slate-500">Priority</p>
                  <div className="flex gap-1">
                    {PRIORITIES.map((p) => (
                      <button key={p} type="button" onClick={() => setAnnouncementForm({ ...announcementForm, priority: p })} className={`rounded-full px-3 py-1 text-xs font-semibold transition ${announcementForm.priority === p ? priorityStyles[p] : "bg-white border border-slate-300 text-slate-500 hover:text-slate-700"}`}>
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-1 text-xs font-medium text-slate-500">Visibility</p>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => setAnnouncementForm({ ...announcementForm, visibility: "public" })} className={`rounded-full px-3 py-1 text-xs font-semibold transition ${announcementForm.visibility === "public" ? "bg-green-100 text-green-800" : "bg-white border border-slate-300 text-slate-500 hover:text-slate-700"}`}>
                      Public
                    </button>
                    <button type="button" onClick={() => setAnnouncementForm({ ...announcementForm, visibility: "members" })} className={`rounded-full px-3 py-1 text-xs font-semibold transition ${announcementForm.visibility === "members" ? "bg-blue-100 text-blue-800" : "bg-white border border-slate-300 text-slate-500 hover:text-slate-700"}`}>
                      Members only
                    </button>
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input type="checkbox" checked={announcementForm.pinned} onChange={(e) => setAnnouncementForm({ ...announcementForm, pinned: e.target.checked })} className="h-4 w-4 rounded border-slate-300" />
                  Pin to top
                </label>
                <div>
                  <p className="mb-1 text-xs font-medium text-slate-500">Schedule (optional)</p>
                  <input type="datetime-local" value={announcementForm.publishAt} onChange={(e) => setAnnouncementForm({ ...announcementForm, publishAt: e.target.value })} className="h-9 rounded-lg border border-slate-300 px-3 text-xs text-slate-900 outline-none focus:border-slate-500" />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleSaveAnnouncement} disabled={announcementSaving} className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-60">
                  {announcementSaving ? "Saving..." : editingAnnouncementId ? "Update" : announcementForm.publishAt ? "Schedule" : "Publish now"}
                </button>
                {editingAnnouncementId && <button onClick={() => { setEditingAnnouncementId(null); setAnnouncementForm({ title: "", content: "", priority: "normal", visibility: "members", pinned: false, publishAt: "" }); }} className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100">Cancel</button>}
              </div>
            </div>
          </div>

          {/* List */}
          <div className="grid gap-3">
            {announcements.length === 0 ? <p className="text-sm text-slate-500">No announcements.</p> : announcements.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${priorityStyles[a.priority] ?? priorityStyles.normal}`}>{a.priority}</span>
                  <p className="text-sm font-medium text-slate-800">{a.title}</p>
                  {a.visibility === "public" ? <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-700">Public</span> : <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">Members</span>}
                  {a.pinned && <span className="text-[10px] text-slate-400">pinned</span>}
                  {a.publishAt && new Date(a.publishAt) > new Date() && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">Scheduled</span>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditingAnnouncementId(a.id); fetch(`/api/announcements/${a.id}`).then(r => r.json()).then(d => { const ann = d.announcement; setAnnouncementForm({ title: ann.title, content: ann.content, priority: ann.priority, visibility: ann.visibility || "members", pinned: ann.pinned, publishAt: ann.publishAt ? new Date(ann.publishAt).toISOString().slice(0, 16) : "" }); }); }} className="text-xs font-semibold text-slate-500 hover:text-slate-700">Edit</button>
                  <button onClick={() => handleDeleteAnnouncement(a.id)} className="text-xs font-semibold text-red-500 hover:text-red-700">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* ─── INVITES TAB ─── */}
      {tab === "invites" && (
        <div className="flex flex-col gap-6">
          {/* Send invite form */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">Send an invite</h2>
            <div className="grid gap-3">
              <input type="email" placeholder="Email address" value={inviteForm.email} onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })} className="h-10 rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none focus:border-slate-500" />
              <div>
                <p className="mb-1 text-xs font-medium text-slate-500">Invite as</p>
                <div className="flex gap-1">
                  <button type="button" onClick={() => setInviteForm({ ...inviteForm, role: "user" })} className={`rounded-full px-3 py-1 text-xs font-semibold transition ${inviteForm.role === "user" ? "bg-slate-900 text-white" : "bg-white border border-slate-300 text-slate-500 hover:text-slate-700"}`}>
                    Member
                  </button>
                  <button type="button" onClick={() => setInviteForm({ ...inviteForm, role: "admin" })} className={`rounded-full px-3 py-1 text-xs font-semibold transition ${inviteForm.role === "admin" ? "bg-slate-900 text-white" : "bg-white border border-slate-300 text-slate-500 hover:text-slate-700"}`}>
                    Admin
                  </button>
                </div>
              </div>
              <textarea placeholder="Personal message (optional)" rows={2} value={inviteForm.message} onChange={(e) => setInviteForm({ ...inviteForm, message: e.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500" />
              <button onClick={handleSendInvite} disabled={inviteSending} className="w-fit rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-60">
                {inviteSending ? "Sending..." : "Send invite"}
              </button>
            </div>
          </div>

          {/* Sent invites list */}
          <div className="grid gap-3">
            <h2 className="text-sm font-semibold text-slate-900">Sent invites</h2>
            {invites.length === 0 ? <p className="text-sm text-slate-500">No invites sent yet.</p> : invites.map((invite) => (
              <div key={invite.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-slate-800">{invite.email}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${invite.role === "admin" ? "bg-purple-50 text-purple-700" : "bg-slate-100 text-slate-600"}`}>{invite.role === "admin" ? "Admin" : "Member"}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${invite.status === "pending" ? "bg-amber-50 text-amber-700" : "bg-green-50 text-green-700"}`}>{invite.status}</span>
                </div>
                <div className="text-xs text-slate-400">
                  {invite.invitedByName} — {new Date(invite.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
