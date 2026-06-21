/**
 * useUserStore — auth state + user profile.
 *
 * - profileComplete flag — false until setup step is finished
 * - Input sanitisation on all user-supplied strings
 * - Explicit return types on all store actions
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type DietType      = "omnivore" | "vegetarian" | "vegan" | "pescatarian";
export type TransportType = "car" | "public" | "cycle" | "walk" | "mixed";
export type EnergyType    = "grid" | "renewable" | "mixed";

export interface UserProfile {
  name:         string;
  phone:        string;
  email:        string;
  age:          string;
  city:         string;
  country:      string;
  occupation:   string;
  bio:          string;
  diet:         DietType;
  transport:    TransportType;
  energy:       EnergyType;
  weeklyGoal:   number;
  carbonBudget: number;
  avatar:       string;
  joinedAt:     string;
}

interface UserState {
  isLoggedIn:      boolean;
  profileComplete: boolean;
  phone:           string;
  profile:         UserProfile | null;

  setPhone:      (phone: string) => void;
  completeOtp:   (phone: string) => void;
  setProfile:    (profile: UserProfile) => void;
  updateProfile: (partial: Partial<UserProfile>) => void;
  logout:        () => void;
}

// ── Input sanitisation ─────────────────────────────────────────────
/** Strip HTML tags and limit a string to `maxLen` characters. */
function sanitise(value: string, maxLen = 200): string {
  return value.replace(/<[^>]*>/g, "").trim().slice(0, maxLen);
}

function sanitiseProfile(profile: UserProfile): UserProfile {
  return {
    ...profile,
    name:       sanitise(profile.name,       100),
    email:      sanitise(profile.email,      254),
    age:        sanitise(profile.age,         10),
    city:       sanitise(profile.city,       100),
    country:    sanitise(profile.country,    100),
    occupation: sanitise(profile.occupation, 100),
    bio:        sanitise(profile.bio,        500),
  };
}

// ── Store ──────────────────────────────────────────────────────────
export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      isLoggedIn:      false,
      profileComplete: false,
      phone:           "",
      profile:         null,

      setPhone: (phone: string): void =>
        set({ phone: sanitise(phone, 20) }),

      completeOtp: (phone: string): void =>
        set((state) => ({
          isLoggedIn:      true,
          phone:           sanitise(phone, 20),
          profile:         state.profile?.phone === phone ? state.profile : null,
          profileComplete: state.profile?.phone === phone ? state.profileComplete : false,
        })),

      setProfile: (profile: UserProfile): void =>
        set({
          profile:         sanitiseProfile(profile),
          profileComplete: true,
          isLoggedIn:      true,
          phone:           sanitise(profile.phone, 20),
        }),

      updateProfile: (partial: Partial<UserProfile>): void =>
        set((state) => {
          if (!state.profile) return {};
          const merged = { ...state.profile, ...partial };
          return { profile: sanitiseProfile(merged) };
        }),

      logout: (): void =>
        set({
          isLoggedIn:      false,
          profileComplete: false,
          phone:           "",
          profile:         null,
        }),
    }),
    {
      name: "terrabloom-user",
      partialize: (s) => ({
        isLoggedIn:      s.isLoggedIn,
        profileComplete: s.profileComplete,
        phone:           s.phone,
        profile:         s.profile,
      }),
    }
  )
);
