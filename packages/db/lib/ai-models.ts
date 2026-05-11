export const MODELS = {
  craft: "claude-opus-4-7",
  working: "claude-sonnet-4-6",
  classify: "claude-haiku-4-5",
} as const;

export type ModelTier = keyof typeof MODELS;
