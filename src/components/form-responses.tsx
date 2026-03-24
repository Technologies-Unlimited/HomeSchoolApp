"use client";

import { useEffect, useState } from "react";
import type { FormField } from "@/lib/form-types";

interface ResponseRow {
  id: string;
  userName?: string;
  responses: Record<string, string | boolean | number>;
  submittedAt?: string;
}

interface FormResponsesProps {
  formId: string;
  fields: FormField[];
}

export function FormResponses({ formId, fields }: FormResponsesProps) {
  const [rows, setRows] = useState<ResponseRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/forms/by-id/${formId}/responses`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : { responses: [] }))
      .then((data) => setRows(data?.responses ?? []))
      .catch((err) => { if (err?.name !== "AbortError") setRows([]); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [formId]);

  if (loading) {
    return <p className="text-sm text-slate-500">Loading responses...</p>;
  }

  if (rows.length === 0) {
    return <p className="text-sm text-slate-500">No responses yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <th className="px-3 py-2">Name</th>
            <th className="px-3 py-2">Submitted</th>
            {fields.map((field) => (
              <th key={field.id} className="px-3 py-2">
                {field.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-slate-100">
              <td className="px-3 py-2 font-medium text-slate-800">
                {row.userName ?? "—"}
              </td>
              <td className="px-3 py-2 text-slate-500">
                {row.submittedAt
                  ? new Date(row.submittedAt).toLocaleDateString()
                  : "—"}
              </td>
              {fields.map((field) => {
                const value = row.responses?.[field.id];
                let display: string;
                if (typeof value === "boolean") {
                  display = value ? "Yes" : "No";
                } else if (value === undefined || value === null || value === "") {
                  display = "—";
                } else {
                  display = String(value);
                }
                return (
                  <td key={field.id} className="px-3 py-2 text-slate-700">
                    {display}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-xs text-slate-500">
        {rows.length} response{rows.length !== 1 ? "s" : ""}
      </p>
    </div>
  );
}
