import { describe, it, expect, beforeEach } from "vitest";
import { useUserStore } from "@/store/useUserStore";
import type { UserProfile } from "@/store/useUserStore";

function makeProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    name:         "Test User",
    phone:        "+919876543210",
    email:        "test@example.com",
    age:          "25",
    city:         "Mumbai",
    country:      "India",
    occupation:   "Developer",
    bio:          "Testing",
    diet:         "omnivore",
    transport:    "public",
    energy:       "grid",
    weeklyGoal:   65,
    carbonBudget: 20,
    avatar:       "#22c55e",
    joinedAt:     new Date().toISOString(),
    ...overrides,
  };
}

describe("useUserStore", () => {
  beforeEach(() => {
    useUserStore.setState({
      isLoggedIn: false, profileComplete: false,
      phone: "", profile: null,
    });
  });

  it("starts logged out", () => {
    expect(useUserStore.getState().isLoggedIn).toBe(false);
  });

  it("completeOtp marks as logged in", () => {
    useUserStore.getState().completeOtp("+919876543210");
    expect(useUserStore.getState().isLoggedIn).toBe(true);
  });

  it("setProfile marks profileComplete and isLoggedIn", () => {
    useUserStore.getState().setProfile(makeProfile());
    const state = useUserStore.getState();
    expect(state.profileComplete).toBe(true);
    expect(state.isLoggedIn).toBe(true);
  });

  it("logout clears all auth state", () => {
    useUserStore.getState().setProfile(makeProfile());
    useUserStore.getState().logout();
    const state = useUserStore.getState();
    expect(state.isLoggedIn).toBe(false);
    expect(state.profileComplete).toBe(false);
    expect(state.profile).toBeNull();
    expect(state.phone).toBe("");
  });

  it("sanitises HTML tags from name on setProfile", () => {
    useUserStore.getState().setProfile(makeProfile({ name: "<script>alert(1)</script>Lavish" }));
    expect(useUserStore.getState().profile?.name).not.toContain("<script>");
    expect(useUserStore.getState().profile?.name).toContain("Lavish");
  });

  it("sanitises HTML tags from bio on setProfile", () => {
    useUserStore.getState().setProfile(makeProfile({ bio: "Hello <img src=x onerror=alert(1)> world" }));
    expect(useUserStore.getState().profile?.bio).not.toContain("<img");
    expect(useUserStore.getState().profile?.bio).toContain("world");
  });

  it("truncates name longer than 100 chars", () => {
    const longName = "A".repeat(200);
    useUserStore.getState().setProfile(makeProfile({ name: longName }));
    expect((useUserStore.getState().profile?.name ?? "").length).toBeLessThanOrEqual(100);
  });

  it("updateProfile merges partial changes", () => {
    useUserStore.getState().setProfile(makeProfile());
    useUserStore.getState().updateProfile({ city: "Delhi" });
    expect(useUserStore.getState().profile?.city).toBe("Delhi");
    expect(useUserStore.getState().profile?.name).toBe("Test User");
  });

  it("updateProfile does nothing when not logged in", () => {
    useUserStore.getState().updateProfile({ city: "Delhi" });
    expect(useUserStore.getState().profile).toBeNull();
  });
});
