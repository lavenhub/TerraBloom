/**
 * gemini.ts — client-side helper
 *
 * Calls our own server-side API route (/api/activity/analyze) instead of
 * hitting Gemini directly from the browser. This keeps the API key on the
 * server and never exposes it to the client bundle.
 */

import type { Activity } from "@/store/useTerraStore";

export async function analyzeActivity(
  imageDataUrl: string,
  note: string
): Promise<Partial<Activity>> {
  const res = await fetch("/api/activity/analyze", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ imageDataUrl, note }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Analysis failed (${res.status})`);
  }

  const data = await res.json();
  return {
    category:            data.category            || "General",
    impact:              data.impact              || "neutral",
    carbonEstimate:      Number(data.carbonEstimate)    || 0,
    sustainabilityScore: Math.min(100, Math.max(0, Number(data.sustainabilityScore) || 50)),
    environmentalImpact: data.environmentalImpact || "",
    recommendation:      data.recommendation      || "",
  };
}
