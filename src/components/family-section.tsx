"use client";

import { useEffect, useState } from "react";
import { useCurrentUser } from "@/lib/client";
import { DIETARY_OPTIONS } from "@/lib/dietary-options";
import { GRADE_OPTIONS } from "@/lib/grade-options";

interface ChildProfile {
  _id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  grade?: string;
  allergies?: string;
  dietaryNeeds?: string[];
  medicalNotes?: string;
  notes?: string;
}

interface LinkedMember {
  id: string;
  name: string;
  email: string;
  isOwner: boolean;
}

interface FamilyProfile {
  id: string;
  emergencyContact: string;
  medicalNotes: string;
  children: ChildProfile[];
  linkedMembers?: LinkedMember[];
}

interface ChildFormData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  grade: string;
  dietaryNeeds: string[];
  allergies: string;
  medicalNotes: string;
  notes: string;
}

const emptyChildForm: ChildFormData = { firstName: "", lastName: "", dateOfBirth: "", grade: "", dietaryNeeds: [], allergies: "", medicalNotes: "", notes: "" };

function calculateAge(dateOfBirth: string): number {
  return Math.floor((Date.now() - new Date(dateOfBirth).getTime()) / 31557600000);
}

const inputClass = "h-10 rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none focus:border-slate-500";

function ChildForm({ form, setForm, onSave, onCancel, saving, submitLabel }: {
  form: ChildFormData;
  setForm: (form: ChildFormData) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  submitLabel: string;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <input type="text" placeholder="First name *" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className={inputClass} />
      <input type="text" placeholder="Last name *" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className={inputClass} />
      <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
        Date of birth
        <input type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} className={inputClass} />
      </label>
      <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
        Grade
        <select value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} className={`${inputClass} bg-white`}>
          {GRADE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </label>
      <div className="sm:col-span-2 space-y-2">
        <p className="text-xs font-medium text-slate-500">Dietary needs & allergies</p>
        <div className="flex flex-wrap gap-1.5">
          {DIETARY_OPTIONS.map((option) => {
            const selected = form.dietaryNeeds.includes(option.value);
            return (
              <button key={option.value} type="button" onClick={() => setForm({ ...form, dietaryNeeds: selected ? form.dietaryNeeds.filter((d) => d !== option.value) : [...form.dietaryNeeds, option.value] })} className={`rounded-full px-3 py-1 text-xs font-semibold transition ${selected ? "bg-red-100 text-red-800" : "bg-slate-100 text-slate-500 hover:text-slate-700"}`}>
                {option.label}
              </button>
            );
          })}
        </div>
        <input type="text" placeholder="Other allergies (e.g. shellfish, sesame)" value={form.allergies} onChange={(e) => setForm({ ...form, allergies: e.target.value })} className={`${inputClass} w-full`} />
      </div>
      <textarea placeholder="Medical notes" value={form.medicalNotes} onChange={(e) => setForm({ ...form, medicalNotes: e.target.value })} rows={2} className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500 sm:col-span-2" />
      <textarea placeholder="Other notes (anything else we should know)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500 sm:col-span-2" />
      <div className="flex gap-2 sm:col-span-2">
        <button type="button" onClick={onSave} disabled={saving} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50">{saving ? "Saving..." : submitLabel}</button>
        <button type="button" onClick={onCancel} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">Cancel</button>
      </div>
    </div>
  );
}

export function FamilySection() {
  const { user, loading: userLoading } = useCurrentUser();
  const [family, setFamily] = useState<FamilyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [editingFamily, setEditingFamily] = useState(false);
  const [familyForm, setFamilyForm] = useState({ emergencyContact: "", medicalNotes: "" });
  const [savingFamily, setSavingFamily] = useState(false);

  const [showAddChild, setShowAddChild] = useState(false);
  const [childForm, setChildForm] = useState<ChildFormData>(emptyChildForm);
  const [savingChild, setSavingChild] = useState(false);

  const [editingChildId, setEditingChildId] = useState<string | null>(null);
  const [editChildForm, setEditChildForm] = useState<ChildFormData>(emptyChildForm);
  const [savingEditChild, setSavingEditChild] = useState(false);

  const [showLinkSpouse, setShowLinkSpouse] = useState(false);
  const [spouseEmail, setSpouseEmail] = useState("");
  const [linkingSpouse, setLinkingSpouse] = useState(false);
  const [invites, setInvites] = useState<{ id: string; fromUserName: string; fromUserEmail: string; toUserName: string; toUserEmail: string; direction: string }[]>([]);
  const [respondingInviteId, setRespondingInviteId] = useState<string | null>(null);

  function loadFamily() {
    fetch("/api/family")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.family) {
          setFamily(data.family);
          setFamilyForm({ emergencyContact: data.family.emergencyContact || "", medicalNotes: data.family.medicalNotes || "" });
        }
        setLoading(false);
      })
      .catch(() => { setError("Failed to load family profile."); setLoading(false); });
  }

  function loadInvites() {
    fetch("/api/family/link")
      .then((res) => (res.ok ? res.json() : { invites: [] }))
      .then((data) => setInvites(data?.invites ?? []))
      .catch(() => {});
  }

  useEffect(() => {
    if (userLoading || !user) { setLoading(false); return; }
    loadFamily();
    loadInvites();
  }, [user, userLoading]);

  function showSuccessMessage(message: string) {
    setSuccess(message);
    setError("");
    setTimeout(() => setSuccess(""), 3000);
  }

  async function handleSaveFamily() {
    setSavingFamily(true); setError("");
    const response = await fetch("/api/family", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(familyForm) });
    setSavingFamily(false);
    if (response.ok) { const data = await response.json(); setFamily(data.family); setEditingFamily(false); showSuccessMessage("Saved."); }
    else { const data = await response.json().catch(() => ({})); setError(data.error || "Failed to save."); }
  }

  async function handleAddChild() {
    if (!childForm.firstName.trim() || !childForm.lastName.trim()) { setError("First and last name are required."); return; }
    if (!childForm.dateOfBirth) { setError("Date of birth is required."); return; }
    setSavingChild(true); setError("");
    const response = await fetch("/api/family/children", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ firstName: childForm.firstName, lastName: childForm.lastName, dateOfBirth: childForm.dateOfBirth, grade: childForm.grade || undefined, dietaryNeeds: childForm.dietaryNeeds.length > 0 ? childForm.dietaryNeeds : undefined, allergies: childForm.allergies || undefined, medicalNotes: childForm.medicalNotes || undefined, notes: childForm.notes || undefined }) });
    setSavingChild(false);
    if (response.ok) { const data = await response.json(); setFamily(data.family); setChildForm(emptyChildForm); setShowAddChild(false); }
    else { const data = await response.json().catch(() => ({})); setError(data.error || "Failed to add child."); }
  }

  async function handleSaveEditChild() {
    if (!editingChildId) return;
    setSavingEditChild(true); setError("");
    const response = await fetch(`/api/family/children/${editingChildId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ firstName: editChildForm.firstName, lastName: editChildForm.lastName, dateOfBirth: editChildForm.dateOfBirth, grade: editChildForm.grade || undefined, dietaryNeeds: editChildForm.dietaryNeeds, allergies: editChildForm.allergies || undefined, medicalNotes: editChildForm.medicalNotes || undefined, notes: editChildForm.notes || undefined }) });
    setSavingEditChild(false);
    if (response.ok) { const data = await response.json(); setFamily(data.family); setEditingChildId(null); }
    else { const data = await response.json().catch(() => ({})); setError(data.error || "Failed to update child."); }
  }

  async function handleDeleteChild(childId: string) {
    if (!confirm("Remove this child?")) return;
    setError("");
    const response = await fetch(`/api/family/children/${childId}`, { method: "DELETE" });
    if (response.ok) { const data = await response.json(); setFamily(data.family); }
    else { setError("Failed to remove child."); }
  }

  async function handleLinkSpouse() {
    if (!spouseEmail.trim()) { setError("Enter your spouse's email."); return; }
    setLinkingSpouse(true); setError("");
    const response = await fetch("/api/family/link", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: spouseEmail.trim() }) });
    setLinkingSpouse(false);
    if (response.ok) {
      setSpouseEmail(""); setShowLinkSpouse(false);
      showSuccessMessage("Invite sent! They'll need to accept it from their profile.");
      loadInvites();
    } else {
      const data = await response.json().catch(() => ({}));
      setError(data.error || "Failed to send invite.");
    }
  }

  async function handleRespondInvite(inviteId: string, action: "accept" | "decline") {
    setRespondingInviteId(inviteId); setError("");
    const response = await fetch(`/api/family/link/${inviteId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
    setRespondingInviteId(null);
    if (response.ok) {
      showSuccessMessage(action === "accept" ? "Invite accepted! You now share the same family profile." : "Invite declined.");
      loadInvites();
      if (action === "accept") loadFamily();
    } else {
      const data = await response.json().catch(() => ({}));
      setError(data.error || `Failed to ${action} invite.`);
    }
  }

  async function handleCancelInvite(inviteId: string) {
    setError("");
    const response = await fetch(`/api/family/link/${inviteId}`, { method: "DELETE" });
    if (response.ok) { showSuccessMessage("Invite cancelled."); loadInvites(); }
    else { setError("Failed to cancel invite."); }
  }

  async function handleUnlinkUser(unlinkUserId: string) {
    if (!confirm("Unlink this account from your family?")) return;
    setError("");
    const response = await fetch("/api/family/link", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: unlinkUserId }) });
    if (response.ok) { showSuccessMessage("Account unlinked."); loadFamily(); }
    else { setError("Failed to unlink account."); }
  }

  if (loading) return <p className="text-sm text-slate-500">Loading family info...</p>;

  return (
    <div className="flex flex-col gap-5">
      {error && <p className="text-sm text-red-600" role="alert" aria-live="polite">{error}</p>}
      {success && <p className="text-sm text-green-600" role="status" aria-live="polite">{success}</p>}

      {/* Linked accounts (spouse/partner) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-sm font-semibold text-slate-900">Linked accounts</h3>
          {!showLinkSpouse && (
            <button type="button" onClick={() => setShowLinkSpouse(true)} className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800">
              Link spouse/partner
            </button>
          )}
        </div>
        {showLinkSpouse && (
          <div className="mt-3 flex gap-2">
            <input
              type="email"
              placeholder="Spouse's email address"
              value={spouseEmail}
              onChange={(e) => setSpouseEmail(e.target.value)}
              className={`flex-1 ${inputClass}`}
            />
            <button type="button" onClick={handleLinkSpouse} disabled={linkingSpouse} className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50">
              {linkingSpouse ? "Linking..." : "Link"}
            </button>
            <button type="button" onClick={() => { setShowLinkSpouse(false); setSpouseEmail(""); }} className="rounded-full border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100">Cancel</button>
          </div>
        )}
        {family?.linkedMembers && family.linkedMembers.length > 0 && (
          <div className="mt-3 space-y-2">
            {family.linkedMembers.map((member) => (
              <div key={member.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-slate-900">{member.name}</p>
                  <p className="text-xs text-slate-500">{member.email}{member.isOwner ? " (owner)" : ""}</p>
                </div>
                {!member.isOwner && member.id !== user?.id && (
                  <button type="button" onClick={() => handleUnlinkUser(member.id)} className="text-xs font-semibold text-red-500 hover:text-red-700">Unlink</button>
                )}
              </div>
            ))}
          </div>
        )}
        {(!family?.linkedMembers || family.linkedMembers.length <= 1) && !showLinkSpouse && invites.length === 0 && (
          <p className="mt-2 text-xs text-slate-500">Link a spouse or partner so they can view and manage the same children and family info.</p>
        )}

        {/* Pending invites */}
        {invites.length > 0 && (
          <div className="mt-3 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Pending invites</p>
            {invites.map((invite) => (
              <div key={invite.id} className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                <div>
                  {invite.direction === "sent" ? (
                    <p className="text-sm text-slate-700">Invite sent to <span className="font-medium">{invite.toUserName}</span> ({invite.toUserEmail})</p>
                  ) : (
                    <p className="text-sm text-slate-700"><span className="font-medium">{invite.fromUserName}</span> ({invite.fromUserEmail}) wants to link accounts with you</p>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  {invite.direction === "received" ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleRespondInvite(invite.id, "accept")}
                        disabled={respondingInviteId === invite.id}
                        className="rounded-full bg-green-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
                      >
                        {respondingInviteId === invite.id ? "..." : "Accept"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRespondInvite(invite.id, "decline")}
                        disabled={respondingInviteId === invite.id}
                        className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
                      >
                        Decline
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleCancelInvite(invite.id)}
                      className="text-xs font-semibold text-red-500 hover:text-red-700"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Emergency contact & medical */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-sm font-semibold text-slate-900">Emergency Contact & Medical</h3>
          {!editingFamily && <button type="button" onClick={() => setEditingFamily(true)} className="text-xs font-semibold text-slate-500 transition hover:text-slate-700">Edit</button>}
        </div>
        {editingFamily ? (
          <div className="mt-3 grid gap-3">
            <input type="text" placeholder="Emergency contact (name, phone, relationship)" value={familyForm.emergencyContact} onChange={(e) => setFamilyForm({ ...familyForm, emergencyContact: e.target.value })} className={inputClass} />
            <textarea placeholder="Family medical notes" value={familyForm.medicalNotes} onChange={(e) => setFamilyForm({ ...familyForm, medicalNotes: e.target.value })} rows={2} className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500" />
            <div className="flex gap-2">
              <button type="button" onClick={handleSaveFamily} disabled={savingFamily} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50">{savingFamily ? "Saving..." : "Save"}</button>
              <button type="button" onClick={() => setEditingFamily(false)} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">Cancel</button>
            </div>
          </div>
        ) : (
          <div className="mt-3 space-y-2 text-sm">
            <div><span className="text-xs font-medium uppercase tracking-wide text-slate-400">Emergency contact</span><p className="text-slate-700">{family?.emergencyContact || "Not set"}</p></div>
            <div><span className="text-xs font-medium uppercase tracking-wide text-slate-400">Medical notes</span><p className="text-slate-700">{family?.medicalNotes || "None"}</p></div>
          </div>
        )}
      </div>

      {/* Children */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Children</h3>
        {!showAddChild && <button type="button" onClick={() => setShowAddChild(true)} className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800">Add child</button>}
      </div>

      {showAddChild && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <ChildForm form={childForm} setForm={setChildForm} onSave={handleAddChild} onCancel={() => { setShowAddChild(false); setChildForm(emptyChildForm); }} saving={savingChild} submitLabel="Add child" />
        </div>
      )}

      {family?.children && family.children.length > 0 ? (
        <div className="grid gap-3">
          {family.children.map((child) => (
            <div key={child._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              {editingChildId === child._id ? (
                <ChildForm form={editChildForm} setForm={setEditChildForm} onSave={handleSaveEditChild} onCancel={() => setEditingChildId(null)} saving={savingEditChild} submitLabel="Save" />
              ) : (
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-900">{child.firstName} {child.lastName}</p>
                    <p className="text-xs text-slate-500">Age {calculateAge(child.dateOfBirth)}{child.grade ? ` \u2022 ${child.grade}` : ""}</p>
                    {child.dietaryNeeds && child.dietaryNeeds.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {child.dietaryNeeds.map((need: string) => {
                          const option = DIETARY_OPTIONS.find((o) => o.value === need);
                          return <span key={need} className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700">{option?.label ?? need}</span>;
                        })}
                      </div>
                    )}
                    {child.allergies && <p className="text-xs text-red-600">Other allergies: {child.allergies}</p>}
                    {child.medicalNotes && <p className="text-xs text-slate-500">Medical: {child.medicalNotes}</p>}
                    {child.notes && <p className="text-xs text-slate-500">Notes: {child.notes}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => { setEditingChildId(child._id); setEditChildForm({ firstName: child.firstName, lastName: child.lastName, dateOfBirth: child.dateOfBirth?.slice(0, 10) || "", grade: child.grade || "", dietaryNeeds: child.dietaryNeeds ?? [], allergies: child.allergies || "", medicalNotes: child.medicalNotes || "", notes: child.notes || "" }); }} className="text-xs font-semibold text-slate-500 hover:text-slate-700">Edit</button>
                    <button type="button" onClick={() => handleDeleteChild(child._id)} className="text-xs font-semibold text-red-500 hover:text-red-700">Remove</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : !showAddChild && (
        <p className="text-sm text-slate-500">No children added yet.</p>
      )}
    </div>
  );
}
