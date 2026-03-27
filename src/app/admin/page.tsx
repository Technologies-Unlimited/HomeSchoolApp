"use client";

import { useEffect, useState, useCallback } from "react";
import { useCurrentUser } from "@/lib/client";
import { Breadcrumb } from "@/components/breadcrumb";
import { PageGuide } from "@/components/page-guide";

interface PendingEvent { id: string; title: string; startDate?: string }
interface PendingMember { id: string; firstName?: string; lastName?: string; email: string; createdAt?: string }
interface UserItem { id: string; email: string; firstName?: string; lastName?: string; role: string; isActive: boolean; emailVerified: boolean; approved: boolean }

const VALID_ROLES = ["user", "admin", "super_admin"];
const PRIORITIES = ["normal", "important", "urgent"] as const;
const priorityStyles: Record<string, string> = { normal: "bg-slate-100 text-slate-700", important: "bg-amber-100 text-amber-800", urgent: "bg-red-100 text-red-800" };


export default function AdminPage() {
  const { user, loading } = useCurrentUser();
  const [tab, setTab] = useState<"overview" | "users" | "announcements" | "activity">("overview");
  const [showInviteForm, setShowInviteForm] = useState(false);
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
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [userStatusFilter, setUserStatusFilter] = useState("all");

  // Announcements state
  const [announcements, setAnnouncements] = useState<{ id: string; title: string; priority: string; visibility?: string; pinned: boolean; publishAt?: string; createdAt: string }[]>([]);
  const [announcementForm, setAnnouncementForm] = useState({ title: "", content: "", priority: "normal" as string, visibility: "members" as string, pinned: false, publishAt: "", emailToMembers: false });
  const [announcementSaving, setAnnouncementSaving] = useState(false);
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<string | null>(null);

  // Activity state
  const [auditEntries, setAuditEntries] = useState<{ id: string; action: string; actorName: string; targetType: string; targetId: string; details: string; hasRevertData: boolean; createdAt: string }[]>([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditPage, setAuditPage] = useState(1);
  const [auditFilter, setAuditFilter] = useState("all");

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

  async function handleResendInvite(inviteId: string) {
    setActionLoading(inviteId); setError(null);
    const r = await fetch(`/api/admin/invite/${inviteId}/resend`, { method: "POST" });
    setActionLoading(null);
    if (r.ok) { showMsg("Invite resent!"); loadInvites(); }
    else { const d = await r.json().catch(() => ({})); setError(d.error || "Failed to resend."); }
  }

  async function handleCancelInvite(inviteId: string) {
    if (!confirm("Cancel this invite?")) return;
    setActionLoading(inviteId); setError(null);
    const r = await fetch(`/api/admin/invite/${inviteId}`, { method: "DELETE" });
    setActionLoading(null);
    if (r.ok) { showMsg("Invite cancelled."); setInvites((prev) => prev.filter((i) => i.id !== inviteId)); }
    else { const d = await r.json().catch(() => ({})); setError(d.error || "Failed to cancel."); }
  }

  useEffect(() => { if (!user || !isAdminUser) return; loadOverview(); }, [user, isAdminUser, loadOverview]);
  useEffect(() => { if (tab === "users" && !usersLoaded) { loadUsers(); loadInvites(); } }, [tab, usersLoaded]);
  useEffect(() => { if (tab === "announcements") loadAnnouncements(); }, [tab]);

  function loadAuditLog(page = 1, filter = "all") {
    const params = new URLSearchParams({ limit: "20", page: String(page) });
    if (filter !== "all") params.set("action", filter);
    fetch(`/api/admin/audit?${params}`).then((r) => r.ok ? r.json() : { entries: [], total: 0 }).then((d) => { setAuditEntries(d?.entries ?? []); setAuditTotal(d?.total ?? 0); }).catch(() => {});
  }

  async function handleRevertAudit(entryId: string) {
    if (!confirm("Revert this action? The previous state will be restored.")) return;
    setActionLoading(entryId); setError(null);
    const r = await fetch("/api/admin/audit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ entryId }) });
    setActionLoading(null);
    if (r.ok) { showMsg("Action reverted."); loadAuditLog(auditPage, auditFilter); }
    else { const d = await r.json().catch(() => ({})); setError(d.error || "Failed to revert."); }
  }

  useEffect(() => { if (tab === "activity") loadAuditLog(auditPage, auditFilter); }, [tab, auditPage, auditFilter]);

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

  // Member deactivation
  async function handleToggleActive(userId: string, currentlyActive: boolean) {
    if (!confirm(currentlyActive ? "Deactivate this member? They will lose access." : "Reactivate this member?")) return;
    setActionLoading(userId);
    const r = await fetch(`/api/admin/users/${userId}/status`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !currentlyActive }) });
    setActionLoading(null);
    if (r.ok) { setUsers((p) => p.map((u) => u.id === userId ? { ...u, isActive: !currentlyActive } : u)); showMsg(currentlyActive ? "Member deactivated." : "Member reactivated."); }
    else setError("Failed to update status.");
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
      setAnnouncementForm({ title: "", content: "", priority: "normal", visibility: "members", pinned: false, publishAt: "", emailToMembers: false });
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

      {/* Tabs — guides are inside each tab */}
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
        {(["overview", "users", "announcements", "activity"] as const).map((tabName) => (
          <button key={tabName} onClick={() => setTab(tabName)} data-active={tab === tabName} className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold capitalize transition ${tab === tabName ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            {tabName}
          </button>
        ))}
      </div>

      {success && <p className="text-sm text-green-600" role="status" aria-live="polite">{success}</p>}
      {error && <p className="text-sm text-red-600" role="alert" aria-live="polite">{error}</p>}

      {/* ─── OVERVIEW TAB ─── */}
      {tab === "overview" && (
        <div className="flex flex-col gap-6">
          <PageGuide pageKey="admin_overview">
            <h2 className="text-lg font-semibold text-slate-900">Overview</h2>
          </PageGuide>
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
        <div className="flex flex-col gap-6">
          <PageGuide pageKey="admin_users">
            <h2 className="text-lg font-semibold text-slate-900">Users</h2>
          </PageGuide>
        <div className="flex flex-wrap items-center gap-3">
          <input type="text" placeholder="Search by name or email..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} className="h-9 flex-1 min-w-[200px] rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none focus:border-slate-500" />
          <select value={userRoleFilter} onChange={(e) => setUserRoleFilter(e.target.value)} className="h-9 rounded-lg border border-slate-300 bg-white px-2 text-xs text-slate-700 outline-none" aria-label="Filter by role">
            <option value="all">All roles</option>
            {VALID_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <select value={userStatusFilter} onChange={(e) => setUserStatusFilter(e.target.value)} className="h-9 rounded-lg border border-slate-300 bg-white px-2 text-xs text-slate-700 outline-none" aria-label="Filter by status">
            <option value="all">All statuses</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="invited">Invited</option>
            <option value="deactivated">Deactivated</option>
          </select>
          <button onClick={() => setShowInviteForm(!showInviteForm)} className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800">
            {showInviteForm ? "Cancel" : "Invite someone"}
          </button>
        </div>

        {/* Inline invite form */}
        {showInviteForm && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid gap-3 sm:grid-cols-2">
              <input type="email" placeholder="Email address" value={inviteForm.email} onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })} className="h-10 rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none focus:border-slate-500 sm:col-span-2" />
              <div className="flex items-center gap-3">
                <p className="text-xs font-medium text-slate-500">Invite as:</p>
                <div className="flex gap-1">
                  <button type="button" onClick={() => setInviteForm({ ...inviteForm, role: "user" })} className={`rounded-full px-3 py-1 text-xs font-semibold transition ${inviteForm.role === "user" ? "bg-slate-900 text-white" : "bg-white border border-slate-300 text-slate-500 hover:text-slate-700"}`}>Member</button>
                  <button type="button" onClick={() => setInviteForm({ ...inviteForm, role: "admin" })} className={`rounded-full px-3 py-1 text-xs font-semibold transition ${inviteForm.role === "admin" ? "bg-slate-900 text-white" : "bg-white border border-slate-300 text-slate-500 hover:text-slate-700"}`}>Admin</button>
                </div>
              </div>
              <textarea placeholder="Personal message (optional)" rows={2} value={inviteForm.message} onChange={(e) => setInviteForm({ ...inviteForm, message: e.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500 sm:col-span-2" />
              <button onClick={() => { handleSendInvite().then(() => setShowInviteForm(false)); }} disabled={inviteSending} className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-60">
                {inviteSending ? "Sending..." : "Send invite"}
              </button>
            </div>
          </div>
        )}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead><tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <th className="px-4 py-3">Name</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Status</th><th className="px-4 py-3"></th>
            </tr></thead>
            <tbody>
              {(() => {
                const showInvited = userStatusFilter === "all" || userStatusFilter === "invited";
                const pendingInvites = showInvited ? invites.filter((inv) => {
                  if (inv.status !== "pending") return false;
                  const searchLower = userSearch.toLowerCase();
                  if (searchLower && !inv.email.toLowerCase().includes(searchLower)) return false;
                  if (userRoleFilter !== "all" && inv.role !== userRoleFilter) return false;
                  return true;
                }) : [];

                const filtered = userStatusFilter === "invited" ? [] : users.filter((userItem) => {
                  const searchLower = userSearch.toLowerCase();
                  if (searchLower && !`${userItem.firstName} ${userItem.lastName} ${userItem.email}`.toLowerCase().includes(searchLower)) return false;
                  if (userRoleFilter !== "all" && userItem.role !== userRoleFilter) return false;
                  if (userStatusFilter === "approved" && !userItem.approved) return false;
                  if (userStatusFilter === "pending" && userItem.approved) return false;
                  if (userStatusFilter === "deactivated" && userItem.isActive !== false) return false;
                  return true;
                });

                if (filtered.length === 0 && pendingInvites.length === 0) return <tr><td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-500">No users match your filters.</td></tr>;

                return (<>{pendingInvites.map((invite) => (
                  <tr key={`inv-${invite.id}`} className="border-b border-slate-100 bg-slate-50/50">
                    <td className="px-4 py-2 font-medium text-slate-400 italic">Pending invite</td>
                    <td className="px-4 py-2 text-slate-600">{invite.email}</td>
                    <td className="px-4 py-2"><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${invite.role === "admin" ? "bg-purple-50 text-purple-700" : "bg-slate-100 text-slate-600"}`}>{invite.role === "admin" ? "Admin" : "Member"}</span></td>
                    <td className="px-4 py-2"><span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">Invited</span></td>
                    <td className="px-4 py-2">
                      <div className="flex gap-2">
                        <button onClick={() => handleResendInvite(invite.id)} disabled={actionLoading === invite.id} className="text-xs font-semibold text-slate-500 hover:text-slate-700 disabled:opacity-60">{actionLoading === invite.id ? "..." : "Resend"}</button>
                        <button onClick={() => handleCancelInvite(invite.id)} disabled={actionLoading === invite.id} className="text-xs font-semibold text-red-500 hover:text-red-700 disabled:opacity-60">Cancel</button>
                      </div>
                    </td>
                  </tr>
                ))}{filtered.map((userItem) => (
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
                  <td className="px-4 py-2">
                    {userItem.id !== user?.id && (
                      <button onClick={() => handleToggleActive(userItem.id, userItem.isActive !== false)} disabled={actionLoading === userItem.id} className={`text-xs font-semibold ${userItem.isActive === false ? "text-green-600 hover:text-green-700" : "text-red-500 hover:text-red-700"} disabled:opacity-60`}>
                        {userItem.isActive === false ? "Reactivate" : "Deactivate"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}</>);
              })()}
            </tbody>
          </table>
        </div>
        </div>
      )}

      {/* ─── ANNOUNCEMENTS TAB ─── */}
      {tab === "announcements" && (
        <div className="flex flex-col gap-6">
          <PageGuide pageKey="admin_announcements">
            <h2 className="text-lg font-semibold text-slate-900">Announcements</h2>
          </PageGuide>
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
                {!editingAnnouncementId && (
                  <label className="flex items-center gap-2 text-sm text-slate-600">
                    <input type="checkbox" checked={announcementForm.emailToMembers} onChange={(e) => setAnnouncementForm({ ...announcementForm, emailToMembers: e.target.checked })} className="h-4 w-4 rounded border-slate-300" />
                    Email to all members
                  </label>
                )}
                <div>
                  <p className="mb-1 text-xs font-medium text-slate-500">Schedule (optional)</p>
                  <input type="datetime-local" value={announcementForm.publishAt} onChange={(e) => setAnnouncementForm({ ...announcementForm, publishAt: e.target.value })} className="h-9 rounded-lg border border-slate-300 px-3 text-xs text-slate-900 outline-none focus:border-slate-500" />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleSaveAnnouncement} disabled={announcementSaving} className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-60">
                  {announcementSaving ? "Saving..." : editingAnnouncementId ? "Update" : announcementForm.publishAt ? "Schedule" : "Publish now"}
                </button>
                {editingAnnouncementId && <button onClick={() => { setEditingAnnouncementId(null); setAnnouncementForm({ title: "", content: "", priority: "normal", visibility: "members", pinned: false, publishAt: "", emailToMembers: false }); }} className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100">Cancel</button>}
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
                  <button onClick={() => { setEditingAnnouncementId(a.id); fetch(`/api/announcements/${a.id}`).then(r => r.json()).then(d => { const ann = d.announcement; setAnnouncementForm({ title: ann.title, content: ann.content, priority: ann.priority, visibility: ann.visibility || "members", pinned: ann.pinned, publishAt: ann.publishAt ? new Date(ann.publishAt).toISOString().slice(0, 16) : "", emailToMembers: false }); }); }} className="text-xs font-semibold text-slate-500 hover:text-slate-700">Edit</button>
                  <button onClick={() => handleDeleteAnnouncement(a.id)} className="text-xs font-semibold text-red-500 hover:text-red-700">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── ACTIVITY TAB ─── */}
      {tab === "activity" && (
        <div className="flex flex-col gap-6">
          <PageGuide pageKey="admin_activity">
            <h2 className="text-lg font-semibold text-slate-900">Activity</h2>
          </PageGuide>

          <div className="flex items-center gap-3">
            <select value={auditFilter} onChange={(e) => { setAuditFilter(e.target.value); setAuditPage(1); }} className="h-9 rounded-lg border border-slate-300 bg-white px-2 text-xs text-slate-700 outline-none" aria-label="Filter by action">
              <option value="all">All actions</option>
              <option value="role_change">Role changes</option>
              <option value="member_approved">Member approvals</option>
              <option value="member_denied">Member denials</option>
              <option value="member_deactivated">Deactivations</option>
              <option value="member_reactivated">Reactivations</option>
              <option value="event_created">Events created</option>
              <option value="event_updated">Events updated</option>
              <option value="event_approved">Events approved</option>
              <option value="event_cancelled">Events cancelled</option>
              <option value="announcement_created">Announcements created</option>
              <option value="announcement_updated">Announcements updated</option>
              <option value="announcement_deleted">Announcements deleted</option>
              <option value="revert">Reverts</option>
            </select>
            <span className="text-xs text-slate-400">{auditTotal} total entries</span>
          </div>

          <div className="grid gap-2">
            {auditEntries.length === 0 ? (
              <p className="text-sm text-slate-500">No activity recorded yet.</p>
            ) : auditEntries.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      entry.action === "role_change" ? "bg-purple-50 text-purple-700" :
                      entry.action.includes("deactivated") || entry.action.includes("denied") || entry.action.includes("cancelled") || entry.action.includes("deleted") ? "bg-red-50 text-red-700" :
                      entry.action.includes("approved") || entry.action.includes("reactivated") || entry.action.includes("created") ? "bg-green-50 text-green-700" :
                      entry.action.includes("updated") ? "bg-blue-50 text-blue-700" :
                      entry.action === "revert" ? "bg-amber-50 text-amber-700" :
                      "bg-slate-100 text-slate-600"
                    }`}>{entry.action.replace(/_/g, " ")}</span>
                    <p className="text-sm text-slate-800 truncate">{entry.details}</p>
                  </div>
                  <p className="text-[11px] text-slate-400">{entry.actorName} — {new Date(entry.createdAt).toLocaleString()}</p>
                </div>
                {entry.hasRevertData && entry.action !== "revert" && (
                  <button onClick={() => handleRevertAudit(entry.id)} disabled={actionLoading === entry.id} className="shrink-0 rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-60">
                    {actionLoading === entry.id ? "..." : "Revert"}
                  </button>
                )}
              </div>
            ))}
          </div>

          {auditTotal > 20 && (
            <div className="flex justify-center gap-2">
              <button onClick={() => setAuditPage((p) => Math.max(1, p - 1))} disabled={auditPage <= 1} className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-40">Previous</button>
              <span className="flex items-center text-xs text-slate-500">Page {auditPage}</span>
              <button onClick={() => setAuditPage((p) => p + 1)} disabled={auditEntries.length < 20} className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-40">Next</button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
