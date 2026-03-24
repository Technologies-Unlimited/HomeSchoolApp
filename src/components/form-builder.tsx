"use client";

import { useState } from "react";
import { FIELD_TYPES, generateFieldId, type FormField, type FieldType } from "@/lib/form-types";

interface FormBuilderProps {
  initialFields?: FormField[];
  onSave: (fields: FormField[]) => Promise<void>;
  onCancel: () => void;
  saving?: boolean;
}

function emptyField(): FormField {
  return { id: generateFieldId(), label: "", type: "text", required: false };
}

const typeLabels: Record<FieldType, string> = {
  text: "Short text",
  textarea: "Long text",
  number: "Number",
  select: "Dropdown",
  checkbox: "Checkbox",
};

export function FormBuilder({ initialFields, onSave, onCancel, saving }: FormBuilderProps) {
  const [fields, setFields] = useState<FormField[]>(
    initialFields?.length ? initialFields : [emptyField()]
  );

  function updateField(index: number, updates: Partial<FormField>) {
    setFields((prev) => prev.map((field, fieldIndex) => (fieldIndex === index ? { ...field, ...updates } : field)));
  }

  function addField() {
    setFields((prev) => [...prev, emptyField()]);
  }

  function removeField(index: number) {
    setFields((prev) => prev.filter((_, fieldIndex) => fieldIndex !== index));
  }

  function moveField(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= fields.length) return;
    setFields((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function handleOptionsChange(index: number, optionsText: string) {
    const options = optionsText.split("\n").map((option) => option.trim()).filter(Boolean);
    updateField(index, { options });
  }

  async function handleSubmit() {
    const validFields = fields.filter((field) => field.label.trim());
    if (validFields.length === 0) return;
    await onSave(validFields);
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="rounded-xl border border-slate-200 bg-slate-50 p-4"
          >
            <div className="flex items-start gap-3">
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => moveField(index, -1)}
                  disabled={index === 0}
                  className="text-xs text-slate-400 hover:text-slate-600 disabled:opacity-30"
                  aria-label="Move field up"
                >
                  ▲
                </button>
                <button
                  type="button"
                  onClick={() => moveField(index, 1)}
                  disabled={index === fields.length - 1}
                  className="text-xs text-slate-400 hover:text-slate-600 disabled:opacity-30"
                  aria-label="Move field down"
                >
                  ▼
                </button>
              </div>

              <div className="flex-1 space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <input
                    type="text"
                    value={field.label}
                    onChange={(event) => updateField(index, { label: event.target.value })}
                    placeholder="Question label"
                    className="h-9 rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none focus:border-slate-500"
                  />
                  <div className="flex flex-wrap gap-1">
                    {FIELD_TYPES.map((fieldType) => (
                      <button
                        key={fieldType}
                        type="button"
                        onClick={() => updateField(index, { type: fieldType, options: fieldType === "select" ? field.options ?? [""] : undefined })}
                        className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                          field.type === fieldType
                            ? "bg-slate-900 text-white"
                            : "bg-white border border-slate-300 text-slate-600 hover:border-slate-400 hover:text-slate-800"
                        }`}
                      >
                        {typeLabels[fieldType]}
                      </button>
                    ))}
                  </div>
                </div>

                {field.type === "select" && (
                  <div>
                    <p className="mb-1 text-xs text-slate-500">Options (one per line)</p>
                    <textarea
                      value={field.options?.join("\n") ?? ""}
                      onChange={(event) => handleOptionsChange(index, event.target.value)}
                      placeholder={"Option 1\nOption 2\nOption 3"}
                      rows={3}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500"
                    />
                  </div>
                )}

                {field.type !== "checkbox" && (
                  <input
                    type="text"
                    value={field.placeholder ?? ""}
                    onChange={(event) => updateField(index, { placeholder: event.target.value })}
                    placeholder="Placeholder text (optional)"
                    className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none focus:border-slate-500"
                  />
                )}

                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(event) => updateField(index, { required: event.target.checked })}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  Required
                </label>
              </div>

              <button
                type="button"
                onClick={() => removeField(index)}
                disabled={fields.length === 1}
                className="text-xs text-red-500 transition hover:text-red-700 disabled:opacity-30"
                aria-label="Remove field"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addField}
        className="rounded-full border border-dashed border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-400 hover:text-slate-800"
      >
        + Add question
      </button>

      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving || fields.every((field) => !field.label.trim())}
          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save form"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
