export const FIELD_TYPES = ["text", "textarea", "number", "select", "checkbox"] as const;
export type FieldType = (typeof FIELD_TYPES)[number];

export interface FormField {
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
  options?: string[];
  placeholder?: string;
}

export interface FormData {
  id: string;
  eventId: string;
  creatorId?: string;
  formType?: string;
  isActive?: boolean;
  fields: FormField[];
}

export interface FormResponseItem {
  id: string;
  userId?: string;
  responses: Record<string, string | boolean | number>;
  submittedAt?: string;
}

export function generateFieldId(): string {
  return Math.random().toString(36).slice(2, 10);
}
