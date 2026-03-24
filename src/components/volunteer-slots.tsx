"use client";

import { useCallback, useEffect, useState } from "react";
import { useCurrentUser } from "@/lib/client";

interface Volunteer {
  userId: string;
  userName: string;
  signedUpAt: string;
}

interface VolunteerSlot {
  id: string;
  role: string;
  description?: string;
  spotsNeeded: number;
  volunteers: Volunteer[];
}

interface VolunteerSlotsProps {
  eventId: string;
  canManage: boolean;
}

export function VolunteerSlots({ eventId, canManage }: VolunteerSlotsProps) {
  const { user } = useCurrentUser();
  const [slots, setSlots] = useState<VolunteerSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formRole, setFormRole] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formSpotsNeeded, setFormSpotsNeeded] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const fetchSlots = useCallback(async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/volunteers`);
      if (!response.ok) {
        throw new Error("Failed to load volunteer slots");
      }
      const data = await response.json();
      setSlots(data.slots);
      setError(null);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Failed to load volunteer slots");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  async function handleAddSlot(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!formRole.trim() || formSpotsNeeded < 1) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/events/${eventId}/volunteers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: formRole.trim(),
          description: formDescription.trim() || undefined,
          spotsNeeded: formSpotsNeeded,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create slot");
      }

      setFormRole("");
      setFormDescription("");
      setFormSpotsNeeded(1);
      setShowAddForm(false);
      await fetchSlots();
    } catch (addError) {
      setError(addError instanceof Error ? addError.message : "Failed to create slot");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSignUp(slotId: string) {
    setActionInProgress(slotId);
    try {
      const response = await fetch(
        `/api/events/${eventId}/volunteers/${slotId}/signup`,
        { method: "POST" }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to sign up");
      }

      await fetchSlots();
    } catch (signUpError) {
      setError(signUpError instanceof Error ? signUpError.message : "Failed to sign up");
    } finally {
      setActionInProgress(null);
    }
  }

  async function handleLeave(slotId: string, userId?: string) {
    setActionInProgress(slotId);
    try {
      const queryParam = userId ? `?userId=${userId}` : "";
      const response = await fetch(
        `/api/events/${eventId}/volunteers/${slotId}/signup${queryParam}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to leave slot");
      }

      await fetchSlots();
    } catch (leaveError) {
      setError(leaveError instanceof Error ? leaveError.message : "Failed to leave slot");
    } finally {
      setActionInProgress(null);
    }
  }

  if (loading) {
    return (
      <div className="py-6 text-center text-sm text-slate-500">
        Loading volunteer slots...
      </div>
    );
  }

  const isUserAdmin = user?.role === "admin" || user?.role === "super_admin";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">
          Volunteer Slots
        </h3>
        {canManage && !showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
          >
            Add Slot
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 font-medium underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {canManage && showAddForm && (
        <form
          onSubmit={handleAddSlot}
          className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3"
        >
          <div>
            <label
              htmlFor="volunteer-role"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Role
            </label>
            <input
              id="volunteer-role"
              type="text"
              value={formRole}
              onChange={(event) => setFormRole(event.target.value)}
              placeholder="e.g. Setup Crew, Snack Provider"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              required
            />
          </div>
          <div>
            <label
              htmlFor="volunteer-description"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Description (optional)
            </label>
            <input
              id="volunteer-description"
              type="text"
              value={formDescription}
              onChange={(event) => setFormDescription(event.target.value)}
              placeholder="Brief description of what this role involves"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            />
          </div>
          <div>
            <label
              htmlFor="volunteer-spots"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Spots Needed
            </label>
            <input
              id="volunteer-spots"
              type="number"
              min={1}
              value={formSpotsNeeded}
              onChange={(event) =>
                setFormSpotsNeeded(parseInt(event.target.value, 10) || 1)
              }
              className="w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              required
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              {submitting ? "Creating..." : "Create Slot"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setFormRole("");
                setFormDescription("");
                setFormSpotsNeeded(1);
              }}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {slots.length === 0 && !showAddForm && (
        <p className="py-4 text-center text-sm text-slate-500">
          No volunteer slots yet.
        </p>
      )}

      <div className="space-y-3">
        {slots.map((slot) => {
          const isFull = slot.volunteers.length >= slot.spotsNeeded;
          const isUserSignedUp = slot.volunteers.some(
            (volunteer) => volunteer.userId === user?.id
          );

          return (
            <div
              key={slot.id}
              className="rounded-lg border border-slate-200 bg-white p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-slate-900">{slot.role}</h4>
                    {isFull && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                        Full
                      </span>
                    )}
                  </div>
                  {slot.description && (
                    <p className="mt-1 text-sm text-slate-600">
                      {slot.description}
                    </p>
                  )}
                  <p className="mt-1 text-sm text-slate-500">
                    {slot.volunteers.length} / {slot.spotsNeeded} spots filled
                  </p>
                </div>
                <div>
                  {user && !isUserSignedUp && !isFull && (
                    <button
                      onClick={() => handleSignUp(slot.id)}
                      disabled={actionInProgress === slot.id}
                      className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 transition-colors"
                    >
                      {actionInProgress === slot.id
                        ? "Signing up..."
                        : "Sign Up"}
                    </button>
                  )}
                  {user && isUserSignedUp && (
                    <button
                      onClick={() => handleLeave(slot.id)}
                      disabled={actionInProgress === slot.id}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                    >
                      {actionInProgress === slot.id ? "Leaving..." : "Leave"}
                    </button>
                  )}
                </div>
              </div>

              {slot.volunteers.length > 0 && (
                <div className="mt-3 border-t border-slate-100 pt-3">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                    Volunteers
                  </p>
                  <ul className="space-y-1">
                    {slot.volunteers.map((volunteer) => (
                      <li
                        key={volunteer.userId}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-slate-700">
                          {volunteer.userName}
                        </span>
                        {isUserAdmin && volunteer.userId !== user?.id && (
                          <button
                            onClick={() =>
                              handleLeave(slot.id, volunteer.userId)
                            }
                            disabled={actionInProgress === slot.id}
                            className="text-xs text-red-600 hover:text-red-800 disabled:opacity-50"
                          >
                            Remove
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
