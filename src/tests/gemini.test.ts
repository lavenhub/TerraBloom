import { describe, it, expect, vi, beforeEach } from "vitest";
import { analyzeActivity } from "@/lib/gemini";

describe("analyzeActivity — API route client", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns structured analysis on success", async () => {
    const mockResponse = {
      category: "Food",
      impact: "negative",
      carbonEstimate: 4.8,
      sustainabilityScore: 28,
      environmentalImpact: "Beef production is carbon intensive.",
      recommendation: "Try a plant-based swap once per week.",
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const result = await analyzeActivity("data:image/png;base64,abc", "ordered a burger");

    expect(result.category).toBe("Food");
    expect(result.impact).toBe("negative");
    expect(result.carbonEstimate).toBe(4.8);
    expect(result.sustainabilityScore).toBe(28);
    expect(result.recommendation).toBeTruthy();
  });

  it("throws when API returns non-ok response", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Analysis failed." }),
    } as Response);

    await expect(analyzeActivity("data:image/png;base64,abc", "test")).rejects.toThrow("Analysis failed.");
  });

  it("clamps sustainabilityScore between 0 and 100", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        category: "General",
        impact: "neutral",
        carbonEstimate: 1,
        sustainabilityScore: 150,
        environmentalImpact: "",
        recommendation: "",
      }),
    } as Response);

    const result = await analyzeActivity("data:image/png;base64,abc", "test");
    expect(result.sustainabilityScore).toBeLessThanOrEqual(100);
    expect(result.sustainabilityScore).toBeGreaterThanOrEqual(0);
  });

  it("handles negative sustainabilityScore by clamping to 0", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        category: "General",
        impact: "negative",
        carbonEstimate: 5,
        sustainabilityScore: -20,
        environmentalImpact: "",
        recommendation: "",
      }),
    } as Response);

    const result = await analyzeActivity("data:image/png;base64,abc", "test");
    expect(result.sustainabilityScore).toBeGreaterThanOrEqual(0);
  });

  it("sends correct POST body to /api/activity/analyze", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ category: "General", impact: "neutral", carbonEstimate: 1, sustainabilityScore: 50, environmentalImpact: "", recommendation: "" }),
    } as Response);

    await analyzeActivity("data:image/jpeg;base64,xyz", "cycled to work");

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/activity/analyze",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
        body: expect.stringContaining("cycled to work"),
      })
    );
  });

  it("uses fallback values for missing fields", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as Response);

    const result = await analyzeActivity("data:image/png;base64,abc", "");
    expect(result.category).toBe("General");
    expect(result.impact).toBe("neutral");
    expect(result.carbonEstimate).toBe(0);
    expect(result.sustainabilityScore).toBe(50);
  });
});
