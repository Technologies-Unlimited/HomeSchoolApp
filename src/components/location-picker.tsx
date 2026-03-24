"use client";

import { useEffect, useState } from "react";
import { useCurrentUser } from "@/lib/client";

interface LocationValue {
  name: string;
  address: string;
}

interface SavedLocation {
  id: string;
  name: string;
  address: string;
  category?: string;
  notes?: string;
}

interface LocationPickerProps {
  value: LocationValue;
  onChange: (value: LocationValue) => void;
}

export function LocationPicker({ value, onChange }: LocationPickerProps) {
  const { user } = useCurrentUser();
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const userIsAdmin = user?.role === "admin" || user?.role === "super_admin";

  useEffect(() => {
    fetch("/api/locations")
      .then((response) =>
        response.ok ? response.json() : { locations: [] }
      )
      .then((data) => {
        setSavedLocations(data?.locations ?? []);
        setLoadingLocations(false);
      })
      .catch(() => setLoadingLocations(false));
  }, []);

  function handleSelectLocation(location: SavedLocation) {
    onChange({ name: location.name, address: location.address });
    setShowDropdown(false);
  }

  async function handleSaveLocation() {
    if (!value.name.trim() || !value.address.trim()) {
      setSaveMessage("Name and address are required to save.");
      return;
    }

    setSaving(true);
    setSaveMessage("");

    try {
      const response = await fetch("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: value.name.trim(),
          address: value.address.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSavedLocations((previous) => [
          ...previous,
          data.location,
        ]);
        setSaveMessage("Location saved!");
      } else {
        const errorData = await response.json();
        setSaveMessage(errorData.error || "Failed to save location.");
      }
    } catch {
      setSaveMessage("Failed to save location.");
    } finally {
      setSaving(false);
    }
  }

  const locationAlreadySaved = savedLocations.some(
    (location) =>
      location.name.toLowerCase() === value.name.trim().toLowerCase() &&
      location.address.toLowerCase() === value.address.trim().toLowerCase()
  );

  const showSaveButton =
    userIsAdmin &&
    value.name.trim() &&
    value.address.trim() &&
    !locationAlreadySaved;

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowDropdown(!showDropdown)}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-left text-sm text-slate-700 transition hover:border-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
        >
          {loadingLocations
            ? "Loading saved locations..."
            : savedLocations.length === 0
              ? "No saved locations — enter manually below"
              : "Choose a saved location..."}
        </button>

        {showDropdown && savedLocations.length > 0 && (
          <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
            {savedLocations.map((location) => (
              <button
                key={location.id}
                type="button"
                onClick={() => handleSelectLocation(location)}
                className="flex w-full flex-col gap-0.5 px-4 py-3 text-left transition hover:bg-slate-50"
              >
                <span className="text-sm font-medium text-slate-900">
                  {location.name}
                </span>
                <span className="text-xs text-slate-500">
                  {location.address}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-slate-700">
          Location name
        </label>
        <input
          type="text"
          value={value.name}
          onChange={(event) =>
            onChange({ ...value, name: event.target.value })
          }
          placeholder="e.g. Central Park Pavilion"
          className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-slate-700">
          Address
        </label>
        <input
          type="text"
          value={value.address}
          onChange={(event) =>
            onChange({ ...value, address: event.target.value })
          }
          placeholder="e.g. 123 Main St, Springfield, IL"
          className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
        />
      </div>

      {showSaveButton && (
        <button
          type="button"
          onClick={handleSaveLocation}
          disabled={saving}
          className="self-start rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save this location"}
        </button>
      )}

      {saveMessage && (
        <p className="text-xs text-slate-500">{saveMessage}</p>
      )}
    </div>
  );
}
