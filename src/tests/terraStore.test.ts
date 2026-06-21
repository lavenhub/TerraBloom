import { describe, it, expect, beforeEach } from "vitest";
import { useTerraStore } from "@/store/useTerraStore";
import type { Activity } from "@/store/useTerraStore";

const DEFAULT_SCORE = 55;

function makeActivity(overrides: Partial<Activity> = {}): Activity {
  return {
    id:                  crypto.randomUUID(),
    timestamp:           new Date().toISOString(),
    imageDataUrl:        null,
    note:                "test activity",
    category:            "Food",
    impact:              "neutral",
    carbonEstimate:      1.0,
    sustainabilityScore: 50,
    recommendation:      "",
    environmentalImpact: "",
    ...overrides,
  };
}

describe("useTerraStore — city score computation", () => {
  beforeEach(() => {
    // Reset store to clean state
    useTerraStore.setState({
      currentUserPhone: "test",
      activities:  [],
      cityState:   { treeCount: 50, pollutionLevel: 40, greenness: 50, waterClarity: 60, biodiversity: 50, renewableEnergy: 30, overallScore: DEFAULT_SCORE },
      dayHistory:  {},
    });
  });

  it("starts at default score 55", () => {
    expect(useTerraStore.getState().cityState.overallScore).toBe(DEFAULT_SCORE);
  });

  it("adding a positive activity increases score above default", () => {
    const { addActivity } = useTerraStore.getState();
    addActivity(makeActivity({ sustainabilityScore: 95, impact: "positive" }));
    const score = useTerraStore.getState().cityState.overallScore;
    expect(score).toBeGreaterThan(DEFAULT_SCORE);
  });

  it("adding a negative activity decreases score below default", () => {
    const { addActivity } = useTerraStore.getState();
    addActivity(makeActivity({ sustainabilityScore: 8, impact: "negative" }));
    const score = useTerraStore.getState().cityState.overallScore;
    expect(score).toBeLessThan(DEFAULT_SCORE);
  });

  it("score never exceeds 100", () => {
    const { addActivity } = useTerraStore.getState();
    for (let i = 0; i < 25; i++) {
      addActivity(makeActivity({ sustainabilityScore: 100, impact: "positive" }));
    }
    expect(useTerraStore.getState().cityState.overallScore).toBeLessThanOrEqual(100);
  });

  it("score never goes below 0", () => {
    const { addActivity } = useTerraStore.getState();
    for (let i = 0; i < 25; i++) {
      addActivity(makeActivity({ sustainabilityScore: 0, impact: "negative" }));
    }
    expect(useTerraStore.getState().cityState.overallScore).toBeGreaterThanOrEqual(0);
  });

  it("single upload does not jump to extreme values", () => {
    const { addActivity } = useTerraStore.getState();
    addActivity(makeActivity({ sustainabilityScore: 95 }));
    const score = useTerraStore.getState().cityState.overallScore;
    // Weight for 1 activity ≈ 0.22 → max change ≈ ±9 pts from 55
    expect(score).toBeGreaterThan(40);
    expect(score).toBeLessThan(70);
  });

  it("removing an activity recomputes city state", () => {
    const { addActivity, removeActivity } = useTerraStore.getState();
    const act = makeActivity({ sustainabilityScore: 95, impact: "positive" });
    addActivity(act);
    const scoreAfterAdd = useTerraStore.getState().cityState.overallScore;
    removeActivity(act.id);
    const scoreAfterRemove = useTerraStore.getState().cityState.overallScore;
    expect(scoreAfterAdd).not.toBe(scoreAfterRemove);
  });

  it("adding multiple activities accumulates correctly", () => {
    const { addActivity } = useTerraStore.getState();
    addActivity(makeActivity({ sustainabilityScore: 90 }));
    addActivity(makeActivity({ sustainabilityScore: 90 }));
    addActivity(makeActivity({ sustainabilityScore: 90 }));
    const score = useTerraStore.getState().cityState.overallScore;
    expect(score).toBeGreaterThan(DEFAULT_SCORE + 5);
  });

  it("getCityStateForScore returns correct treeCount", () => {
    const { getCityStateForScore } = useTerraStore.getState();
    const state100 = getCityStateForScore(100);
    const state0   = getCityStateForScore(0);
    expect(state100.treeCount).toBe(100);
    expect(state0.treeCount).toBe(20);
  });

  it("getCityStateForScore overallScore matches input", () => {
    const { getCityStateForScore } = useTerraStore.getState();
    expect(getCityStateForScore(75).overallScore).toBe(75);
    expect(getCityStateForScore(30).overallScore).toBe(30);
  });
});
