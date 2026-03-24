"use client";

import { useEffect, useState } from "react";
import { useCurrentUser } from "@/lib/client";
import { Breadcrumb } from "@/components/breadcrumb";

interface UserItem {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  isActive: boolean;
}

const VALID_ROLES = ["user", "admin", "super_admin"];

export default function AdminUsersPage() {
  const { user, loading } = useCurrentUser();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    fetch("/api/admin/users")
      .then((res) => (res.ok ? res.json() : { users: [] }))
      .then((data) => setUsers(data?.users ?? []))
      .catch(() => setError("Failed to load users."));
  }, [user]);

  async function handleRoleChange(userId: string, newRole: string) {
    setUpdatingId(userId);
    setError(null);
    const response = await fetch(`/api/admin/users/${userId}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    setUpdatingId(null);
    if (response.ok) {
      setUsers((prev) =>
        prev.map((item) => (item.id === userId ? { ...item, role: newRole } : item))
      );
    } else {
      const data = await response.json().catch(() => ({}));
      setError(data?.error ?? "Failed to update role.");
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Loading...</p>;
  }

  const isAdminUser = user?.role === "admin" || user?.role === "super_admin";

  if (!user || !isAdminUser) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Admin access required</h1>
        <p className="mt-2 text-sm text-slate-600">Please sign in with an admin account.</p>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-6">
      <Breadcrumb items={[{ label: "Admin", href: "/admin" }, { label: "User management" }]} />
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          User management
        </h1>
        <p className="text-sm text-slate-600">
          View members and manage their roles.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-slate-500">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100">
                    <td className="px-6 py-3 font-medium text-slate-800">
                      {item.firstName ?? ""} {item.lastName ?? ""}
                    </td>
                    <td className="px-6 py-3 text-slate-600">{item.email}</td>
                    <td className="px-6 py-3">
                      <select
                        value={item.role}
                        disabled={updatingId === item.id || item.id === user.id}
                        onChange={(event) => handleRoleChange(item.id, event.target.value)}
                        className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm text-slate-700 outline-none focus:border-slate-500 disabled:opacity-50"
                        aria-label={`Role for ${item.firstName ?? item.email}`}
                      >
                        {VALID_ROLES.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          item.isActive
                            ? "bg-green-50 text-green-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {item.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {error && (
        <p className="text-sm text-red-600" role="alert" aria-live="polite">
          {error}
        </p>
      )}
    </section>
  );
}
