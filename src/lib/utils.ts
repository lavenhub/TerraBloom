/**
 * Shared utility functions for TerraBloom.
 */

/**
 * Generate a consistent avatar color based on a name string.
 * @param name - The full name to hash
 * @returns A hex color string from a predefined green palette
 */
export function avatarColor(name: string): string {
  const palette = ["#22c55e", "#16a34a", "#15803d", "#166534", "#14532d"];
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = name.charCodeAt(i) + ((h << 5) - h);
  }
  return palette[Math.abs(h) % palette.length];
}

/**
 * Extract up to two initials from a name string.
 * @param name - The full name
 * @returns A 1-2 character uppercase string, defaults to "TB"
 */
export function initials(name: string): string {
  return name.trim().split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "TB";
}

/**
 * Get the color corresponding to a sustainability score (0-100).
 * @param score - Sustainability score
 * @returns CSS color value
 */
export function scoreColor(score: number): string {
  if (score >= 70) return "var(--green)";
  if (score >= 40) return "#86efac";
  return "#6b7280";
}

/**
 * Get the color corresponding to an environmental impact level.
 * @param impact - "positive", "neutral", or "negative"
 * @returns CSS color value
 */
export function impactColor(impact: string): string {
  if (impact === "positive") return "var(--green)";
  if (impact === "negative") return "#f87171";
  return "var(--text-dim)";
}
