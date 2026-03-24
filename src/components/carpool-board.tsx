"use client";

import { useCallback, useEffect, useState } from "react";
import { useCurrentUser } from "@/lib/client";

interface CarpoolRider {
  userId: string;
  userName: string;
  joinedAt: string;
}

interface Carpool {
  _id: string;
  id: string;
  eventId: string;
  driverId: string;
  driverName: string;
  seatsAvailable: number;
  departureLocation: string;
  departureTime: string;
  notes?: string;
  riders: CarpoolRider[];
  createdAt: string;
  updatedAt: string;
}

interface CarpoolBoardProps {
  eventId: string;
}

export function CarpoolBoard({ eventId }: CarpoolBoardProps) {
  const { user, loading: userLoading } = useCurrentUser();
  const [carpools, setCarpools] = useState<Carpool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [seatsAvailable, setSeatsAvailable] = useState("4");
  const [departureLocation, setDepartureLocation] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [notes, setNotes] = useState("");

  const fetchCarpools = useCallback(async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/carpools`);
      if (!response.ok) {
        setError("Failed to load carpools.");
        setLoading(false);
        return;
      }
      const data = await response.json();
      setCarpools(data.carpools ?? []);
    } catch {
      setError("Failed to load carpools.");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchCarpools();
  }, [fetchCarpools]);

  async function handleOfferRide(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const response = await fetch(`/api/events/${eventId}/carpools`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        seatsAvailable: Number(seatsAvailable),
        departureLocation,
        departureTime,
        notes: notes || undefined,
      }),
    });

    setSubmitting(false);

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setError(data?.error ?? "Failed to create carpool offer.");
      return;
    }

    setShowForm(false);
    setSeatsAvailable("4");
    setDepartureLocation("");
    setDepartureTime("");
    setNotes("");
    await fetchCarpools();
  }

  async function handleJoinCarpool(carpoolId: string) {
    setActionLoading(carpoolId);
    setError(null);

    const response = await fetch(`/api/events/${eventId}/carpools/${carpoolId}/join`, {
      method: "POST",
    });

    setActionLoading(null);

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setError(data?.error ?? "Failed to join carpool.");
      return;
    }

    await fetchCarpools();
  }

  async function handleLeaveCarpool(carpoolId: string) {
    setActionLoading(carpoolId);
    setError(null);

    const response = await fetch(`/api/events/${eventId}/carpools/${carpoolId}/join`, {
      method: "DELETE",
    });

    setActionLoading(null);

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setError(data?.error ?? "Failed to leave carpool.");
      return;
    }

    await fetchCarpools();
  }

  async function handleDeleteCarpool(carpoolId: string) {
    if (!confirm("Are you sure you want to remove this carpool offer?")) return;

    setActionLoading(carpoolId);
    setError(null);

    const response = await fetch(`/api/events/${eventId}/carpools/${carpoolId}`, {
      method: "DELETE",
    });

    setActionLoading(null);

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setError(data?.error ?? "Failed to delete carpool.");
      return;
    }

    await fetchCarpools();
  }

  if (userLoading || loading) {
    return <p className="text-sm text-slate-500">Loading carpools...</p>;
  }

  if (!user) {
    return <p className="text-sm text-slate-500">Sign in to view and manage carpools.</p>;
  }

  const userIsAdmin = user.role === "admin" || user.role === "super_admin";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Carpools</h3>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Offer a Ride
          </button>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert" aria-live="polite">
          {error}
        </p>
      )}

      {showForm && (
        <form onSubmit={handleOfferRide} className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
          <h4 className="text-sm font-semibold text-slate-800">Offer a Ride</h4>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">
              Seats Available <span className="ml-1 text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              min={1}
              max={20}
              value={seatsAvailable}
              onChange={(event) => setSeatsAvailable(event.target.value)}
              className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none focus:border-slate-500"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">
              Departure Location <span className="ml-1 text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Walmart parking lot on Main St"
              value={departureLocation}
              onChange={(event) => setDepartureLocation(event.target.value)}
              className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none focus:border-slate-500"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">
              Departure Time <span className="ml-1 text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              required
              value={departureTime}
              onChange={(event) => setDepartureTime(event.target.value)}
              className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none focus:border-slate-500"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">Notes</label>
            <textarea
              placeholder="Any extra details (child seats available, trunk space, etc.)"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={2}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              {submitting ? "Submitting..." : "Post Offer"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {carpools.length === 0 && (
        <p className="text-sm text-slate-500">No carpool offers yet. Be the first to offer a ride!</p>
      )}

      <div className="space-y-3">
        {carpools.map((carpool) => {
          const seatsTaken = carpool.riders?.length ?? 0;
          const seatsRemaining = carpool.seatsAvailable - seatsTaken;
          const isDriver = carpool.driverId === user.id;
          const isRider = carpool.riders?.some((rider) => rider.userId === user.id);
          const isFull = seatsRemaining <= 0;
          const isProcessing = actionLoading === (carpool.id || carpool._id);
          const carpoolIdentifier = carpool.id || carpool._id;

          return (
            <div
              key={carpoolIdentifier}
              className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-900">
                    {carpool.driverName}
                    {isDriver && (
                      <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                        You
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-slate-600">
                    <span className="font-medium">From:</span> {carpool.departureLocation}
                  </p>
                  <p className="text-sm text-slate-600">
                    <span className="font-medium">Departs:</span>{" "}
                    {new Date(carpool.departureTime).toLocaleString()}
                  </p>
                  <p className="text-sm text-slate-600">
                    <span className="font-medium">Seats:</span>{" "}
                    <span className={isFull ? "text-red-600" : "text-green-700"}>
                      {seatsRemaining} of {carpool.seatsAvailable} available
                    </span>
                  </p>
                  {carpool.notes && (
                    <p className="text-sm text-slate-500 italic">{carpool.notes}</p>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  {!isDriver && !isRider && !isFull && (
                    <button
                      onClick={() => handleJoinCarpool(carpoolIdentifier)}
                      disabled={isProcessing}
                      className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                    >
                      {isProcessing ? "..." : "Join"}
                    </button>
                  )}
                  {isRider && (
                    <button
                      onClick={() => handleLeaveCarpool(carpoolIdentifier)}
                      disabled={isProcessing}
                      className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                    >
                      {isProcessing ? "..." : "Leave"}
                    </button>
                  )}
                  {(isDriver || userIsAdmin) && (
                    <button
                      onClick={() => handleDeleteCarpool(carpoolIdentifier)}
                      disabled={isProcessing}
                      className="rounded-full border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                    >
                      {isProcessing ? "..." : "Delete"}
                    </button>
                  )}
                </div>
              </div>

              {carpool.riders && carpool.riders.length > 0 && (
                <div className="mt-3 border-t border-slate-100 pt-2">
                  <p className="text-xs font-medium text-slate-500 mb-1">Riders:</p>
                  <div className="flex flex-wrap gap-1">
                    {carpool.riders.map((rider) => (
                      <span
                        key={rider.userId}
                        className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700"
                      >
                        {rider.userName}
                        {rider.userId === user.id && " (you)"}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
