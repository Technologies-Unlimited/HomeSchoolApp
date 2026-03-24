"use client";

import { useState, type FormEvent } from "react";
import type { FormField } from "@/lib/form-types";

interface FormRendererProps {
  formId: string;
  fields: FormField[];
  onSubmitted: () => void;
  disabled?: boolean;
}

export function FormRenderer({ formId, fields, onSubmitted, disabled }: FormRendererProps) {
  const [values, setValues] = useState<Record<string, string | boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  function updateValue(fieldId: string, value: string | boolean) {
    setValues((prev) => ({ ...prev, [fieldId]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const responses: Record<string, string | boolean> = {};
    for (const field of fields) {
      responses[field.id] = values[field.id] ?? (field.type === "checkbox" ? false : "");
    }

    const response = await fetch(`/api/forms/by-id/${formId}/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ responses }),
    });

    setSubmitting(false);

    if (!response.ok) {
      setError("Failed to submit form.");
      return;
    }

    setSubmitted(true);
    onSubmitted();
  }

  if (submitted) {
    return (
      <p className="text-sm text-green-600" role="status">
        Response submitted successfully.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {fields.map((field) => (
        <div key={field.id} className="space-y-1">
          <label className="block text-sm font-medium text-slate-700">
            {field.label}
            {field.required && <span className="ml-1 text-red-500">*</span>}
          </label>

          {field.type === "text" && (
            <input
              type="text"
              required={field.required}
              disabled={disabled}
              placeholder={field.placeholder}
              value={(values[field.id] as string) ?? ""}
              onChange={(event) => updateValue(field.id, event.target.value)}
              className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none focus:border-slate-500 disabled:opacity-50"
            />
          )}

          {field.type === "textarea" && (
            <textarea
              required={field.required}
              disabled={disabled}
              placeholder={field.placeholder}
              value={(values[field.id] as string) ?? ""}
              onChange={(event) => updateValue(field.id, event.target.value)}
              rows={3}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500 disabled:opacity-50"
            />
          )}

          {field.type === "number" && (
            <input
              type="number"
              required={field.required}
              disabled={disabled}
              placeholder={field.placeholder}
              value={(values[field.id] as string) ?? ""}
              onChange={(event) => updateValue(field.id, event.target.value)}
              className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none focus:border-slate-500 disabled:opacity-50"
            />
          )}

          {field.type === "select" && (
            <select
              required={field.required}
              disabled={disabled}
              value={(values[field.id] as string) ?? ""}
              onChange={(event) => updateValue(field.id, event.target.value)}
              className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-500 disabled:opacity-50"
            >
              <option value="">{field.placeholder || "Select..."}</option>
              {field.options?.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          )}

          {field.type === "checkbox" && (
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                disabled={disabled}
                checked={Boolean(values[field.id])}
                onChange={(event) => updateValue(field.id, event.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
              {field.placeholder || "Yes"}
            </label>
          )}
        </div>
      ))}

      {error && (
        <p className="text-sm text-red-600" role="alert" aria-live="polite">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting || disabled}
        className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
      >
        {submitting ? "Submitting..." : "Submit"}
      </button>
    </form>
  );
}
