export const DIETARY_OPTIONS = [
  { value: "nut-free", label: "Nut-free" },
  { value: "gluten-free", label: "Gluten-free" },
  { value: "dairy-free", label: "Dairy-free" },
  { value: "egg-free", label: "Egg-free" },
  { value: "soy-free", label: "Soy-free" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "kosher", label: "Kosher" },
  { value: "halal", label: "Halal" },
] as const;

export type DietaryOption = (typeof DIETARY_OPTIONS)[number]["value"];
