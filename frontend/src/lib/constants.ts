// src/lib/constants.ts
// ─────────────────────────────────────────────────────────────
// Shared constants used across the entire app
// ─────────────────────────────────────────────────────────────

export const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

export const getToken = (): string | null =>
  localStorage.getItem("accessToken");

export const DAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export const DEFAULT_DAY = {
  enabled: false,
  start_time: "09:00",
  end_time: "17:00",
  slot_duration_minutes: 30,
} as const;