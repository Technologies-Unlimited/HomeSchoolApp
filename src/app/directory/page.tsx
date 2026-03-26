"use client";

import { useEffect, useState, useCallback } from "react";
import { useCurrentUser } from "@/lib/client";
import { Breadcrumb } from "@/components/breadcrumb";
import { PageGuide } from "@/components/page-guide";

interface DirectoryEntry {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  children?: { firstName: string; age?: number }[];
}

interface DirectoryPreferences {
  directoryOptIn: boolean;
  shareEmail: boolean;
  sharePhone: boolean;
}

export default function DirectoryPage() {
  const { user, loading: userLoading } = useCurrentUser();
  const [families, setFamilies] = useState<DirectoryEntry[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [preferences, setPreferences] = useState<DirectoryPreferences>({
    directoryOptIn: false,
    shareEmail: false,
    sharePhone: false,
  });
  const [preferencesLoading, setPreferencesLoading] = useState(true);
  const [savingPreferences, setSavingPreferences] = useState(false);

  const entriesPerPage = 50;

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchText);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchText]);

  // Fetch directory entries
  const fetchFamilies = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: String(entriesPerPage),
    });
    if (debouncedSearch) {
      params.set("search", debouncedSearch);
    }
    fetch(`/api/directory?${params}`)
      .then((res) => (res.ok ? res.json() : { families: [], total: 0 }))
      .then((data) => {
        setFamilies(data?.families ?? []);
        setTotalCount(data?.total ?? 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [page, debouncedSearch]);

  useEffect(() => {
    if (!userLoading && user) {
      fetchFamilies();
    }
  }, [userLoading, user, fetchFamilies]);

  // Fetch preferences
  useEffect(() => {
    if (!userLoading && user) {
      fetch("/api/directory/preferences")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) {
            setPreferences({
              directoryOptIn: data.directoryOptIn ?? false,
              shareEmail: data.shareEmail ?? false,
              sharePhone: data.sharePhone ?? false,
            });
          }
          setPreferencesLoading(false);
        })
        .catch(() => setPreferencesLoading(false));
    }
  }, [userLoading, user]);

  function updatePreference(field: keyof DirectoryPreferences, value: boolean) {
    const updatedPreferences = { ...preferences, [field]: value };
    setPreferences(updatedPreferences);
    setSavingPreferences(true);
    fetch("/api/directory/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    })
      .then((res) => {
        if (!res.ok) {
          setPreferences(preferences);
        } else if (field === "directoryOptIn") {
          fetchFamilies();
        }
      })
      .catch(() => setPreferences(preferences))
      .finally(() => setSavingPreferences(false));
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / entriesPerPage));

  if (userLoading) {
    return (
      <section className="flex flex-col gap-6">
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Directory" }]} />
        <p className="text-sm text-slate-500">Loading...</p>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="flex flex-col gap-6">
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Directory" }]} />
        <p className="text-sm text-slate-500">Please log in to view the family directory.</p>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-6">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Directory" }]} />
      <PageGuide pageKey="directory">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Family Directory</h1>
      </PageGuide>

      {/* Opt-in banner */}
      {!preferencesLoading && !preferences.directoryOptIn && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-amber-900">
              You are not listed in the directory
            </p>
            <p className="text-xs text-amber-700">
              Toggle the switch to make your family visible to other members.
            </p>
          </div>
          <button
            type="button"
            disabled={savingPreferences}
            onClick={() => updatePreference("directoryOptIn", true)}
            className="rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:opacity-50"
          >
            Join directory
          </button>
        </div>
      )}

      {/* Visibility settings */}
      {!preferencesLoading && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Your visibility settings
          </h2>
          <div className="flex flex-col gap-4">
            <ToggleRow
              label="Listed in directory"
              description="Other members can see your name in the family directory."
              checked={preferences.directoryOptIn}
              disabled={savingPreferences}
              onChange={(value) => updatePreference("directoryOptIn", value)}
            />
            <ToggleRow
              label="Share email address"
              description="Your email will be visible on your directory card."
              checked={preferences.shareEmail}
              disabled={savingPreferences || !preferences.directoryOptIn}
              onChange={(value) => updatePreference("shareEmail", value)}
            />
            <ToggleRow
              label="Share phone number"
              description="Your phone number will be visible on your directory card."
              checked={preferences.sharePhone}
              disabled={savingPreferences || !preferences.directoryOptIn}
              onChange={(value) => updatePreference("sharePhone", value)}
            />
          </div>
        </div>
      )}

      {/* Search */}
      <div>
        <input
          type="text"
          placeholder="Search by name..."
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
        />
      </div>

      {/* Directory grid */}
      {loading ? (
        <p className="text-sm text-slate-500">Loading directory...</p>
      ) : families.length === 0 ? (
        <p className="text-sm text-slate-500">
          {debouncedSearch
            ? "No families match your search."
            : "No families have joined the directory yet."}
        </p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {families.map((family) => (
              <div
                key={family.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
                  {(family.firstName?.[0] ?? "").toUpperCase()}
                  {(family.lastName?.[0] ?? "").toUpperCase()}
                </div>
                <h3 className="text-base font-semibold text-slate-900">
                  {family.firstName} {family.lastName}
                </h3>
                <div className="mt-2 flex flex-col gap-1">
                  {family.email && (
                    <p className="text-sm text-slate-600">
                      <span className="font-medium text-slate-500">Email:</span>{" "}
                      <a
                        href={`mailto:${family.email}`}
                        className="text-slate-700 underline decoration-slate-300 transition hover:decoration-slate-500"
                      >
                        {family.email}
                      </a>
                    </p>
                  )}
                  {family.phone && (
                    <p className="text-sm text-slate-600">
                      <span className="font-medium text-slate-500">Phone:</span>{" "}
                      <a
                        href={`tel:${family.phone}`}
                        className="text-slate-700 underline decoration-slate-300 transition hover:decoration-slate-500"
                      >
                        {family.phone}
                      </a>
                    </p>
                  )}
                  {!family.email && !family.phone && (
                    <p className="text-xs text-slate-400">No contact info shared</p>
                  )}
                  {family.children && family.children.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {family.children.map((child: { firstName: string; age?: number }, childIndex: number) => (
                        <span key={childIndex} className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                          {child.firstName}{child.age !== undefined ? `, ${child.age}` : ""}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm text-slate-600">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-slate-800">{label}</p>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 ${
          checked ? "bg-slate-900" : "bg-slate-300"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}
