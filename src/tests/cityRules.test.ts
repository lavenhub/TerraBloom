import { describe, it, expect } from "vitest";
import { computeRules, scoreTier } from "@/lib/cityRules";

describe("computeRules", () => {
  it("clamps score below 0 to 0", () => {
    const r = computeRules(-10);
    expect(r.score).toBe(0);
  });

  it("clamps score above 100 to 100", () => {
    const r = computeRules(150);
    expect(r.score).toBe(100);
  });

  it("score 0 produces no trees", () => {
    expect(computeRules(0).treeCount).toBe(0);
  });

  it("score 100 produces 60 trees", () => {
    expect(computeRules(100).treeCount).toBe(60);
  });

  it("score 0 produces maximum haze (0.55)", () => {
    const r = computeRules(0);
    expect(r.hazePresent).toBe(true);
    expect(r.hazeOpacity).toBeCloseTo(0.55, 2);
  });

  it("score 50 has no haze", () => {
    const r = computeRules(50);
    expect(r.hazeOpacity).toBe(0);
    expect(r.hazePresent).toBe(false);
  });

  it("score 100 has no haze", () => {
    expect(computeRules(100).hazeOpacity).toBe(0);
  });

  it("score 0 produces minimum buildings (6)", () => {
    expect(computeRules(0).buildingCount).toBe(6);
  });

  it("score 100 produces maximum buildings (40)", () => {
    expect(computeRules(100).buildingCount).toBe(40);
  });

  it("turbines only appear at score >= 20", () => {
    expect(computeRules(19).turbineCount).toBe(0);
    expect(computeRules(20).turbineCount).toBeGreaterThan(0);
  });

  it("solar fields only appear at score >= 60", () => {
    expect(computeRules(59).solarFieldCount).toBe(0);
    expect(computeRules(60).solarFieldCount).toBeGreaterThanOrEqual(0);
    expect(computeRules(80).solarFieldCount).toBeGreaterThan(0);
  });

  it("green point light only active at score >= 50", () => {
    expect(computeRules(49).greenLightActive).toBe(false);
    expect(computeRules(50).greenLightActive).toBe(true);
  });

  it("lake appears at score >= 10", () => {
    expect(computeRules(9).lakePresent).toBe(false);
    expect(computeRules(10).lakePresent).toBe(true);
  });

  it("lake radius grows with score", () => {
    const r0  = computeRules(10).lakeRadius;
    const r50 = computeRules(50).lakeRadius;
    const r100 = computeRules(100).lakeRadius;
    expect(r50).toBeGreaterThan(r0);
    expect(r100).toBeGreaterThan(r50);
  });

  it("city spread grows with score", () => {
    expect(computeRules(100).buildingSpread).toBeGreaterThan(computeRules(0).buildingSpread);
  });

  it("biodiversity particles appear at score >= 30", () => {
    expect(computeRules(29).particlesActive).toBe(false);
    expect(computeRules(30).particlesActive).toBe(true);
  });

  it("every +1 score increases tree count by ~0.6", () => {
    const t40 = computeRules(40).treeCount;
    const t41 = computeRules(41).treeCount;
    // floor(41*0.6) - floor(40*0.6) = 24 - 24 = 0 or 1
    expect(t41 - t40).toBeGreaterThanOrEqual(0);
    expect(t41 - t40).toBeLessThanOrEqual(1);
  });

  it("rooftopGardenThreshold is 0 below score 50", () => {
    expect(computeRules(49).rooftopGardenThreshold).toBe(0);
  });

  it("rooftopGardenThreshold reaches 1 at score 100", () => {
    expect(computeRules(100).rooftopGardenThreshold).toBe(1);
  });
});

describe("scoreTier", () => {
  it("returns Critical for score 0", () => {
    expect(scoreTier(0).label).toBe("Critical");
  });

  it("returns Struggling for score 20", () => {
    expect(scoreTier(20).label).toBe("Struggling");
  });

  it("returns Neutral for score 40", () => {
    expect(scoreTier(40).label).toBe("Neutral");
  });

  it("returns Growing for score 60", () => {
    expect(scoreTier(60).label).toBe("Growing");
  });

  it("returns Thriving for score 80", () => {
    expect(scoreTier(80).label).toBe("Thriving");
  });

  it("returns Thriving for score 100", () => {
    expect(scoreTier(100).label).toBe("Thriving");
  });

  it("each tier has a non-empty color", () => {
    [0, 20, 40, 60, 80, 100].forEach((s) => {
      expect(scoreTier(s).color).toBeTruthy();
    });
  });
});
