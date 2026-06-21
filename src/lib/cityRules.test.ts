import { describe, it, expect } from "vitest";
import { computeRules, scoreTier } from "./cityRules";

describe("cityRules.ts", () => {
  describe("computeRules", () => {
    it("should compute base metrics for score 0", () => {
      const rules = computeRules(0);
      expect(rules.treeCount).toBe(0);
      expect(rules.hazePresent).toBe(true);
      expect(rules.hazeOpacity).toBe(0.55);
      expect(rules.buildingCount).toBe(6);
      expect(rules.turbineCount).toBe(0);
      expect(rules.score).toBe(0);
    });

    it("should compute metrics for score 100", () => {
      const rules = computeRules(100);
      expect(rules.treeCount).toBe(60);
      expect(rules.hazePresent).toBe(false);
      expect(rules.hazeOpacity).toBe(0);
      expect(rules.buildingCount).toBe(40);
      expect(rules.turbineCount).toBe(10);
      expect(rules.score).toBe(100);
    });

    it("should clamp values properly", () => {
      const rules = computeRules(150); // over max
      expect(rules.treeCount).toBe(60);
      expect(rules.score).toBe(100);

      const underRules = computeRules(-50); // under min
      expect(underRules.treeCount).toBe(0);
      expect(underRules.score).toBe(0);
    });

    it("should map intermediate scores correctly", () => {
      const rules = computeRules(50);
      expect(rules.score).toBe(50);
      expect(rules.treeCount).toBe(30); // 50 * 0.6
      expect(rules.buildingCount).toBe(23); // 6 + 50 * 0.34
    });
  });

  describe("scoreTier", () => {
    it("returns Thriving for >= 80", () => {
      const tier = scoreTier(85);
      expect(tier.label).toBe("Thriving");
      expect(tier.color).toBe("#22c55e");
    });

    it("returns Growing for >= 60 and < 80", () => {
      const tier = scoreTier(65);
      expect(tier.label).toBe("Growing");
    });

    it("returns Struggling for >= 20 and < 40", () => {
      const tier = scoreTier(25);
      expect(tier.label).toBe("Struggling");
    });

    it("returns Critical for < 20", () => {
      const tier = scoreTier(10);
      expect(tier.label).toBe("Critical");
    });
  });
});

