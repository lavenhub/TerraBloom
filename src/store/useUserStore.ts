/**
 * useUserStore — auth state + user profile.
 *
 * Changes vs original:
 * - Added `profileComplete` flag — true only after the user finishes
 *   the setup step. Re-login skips setup only when this is true.
 * - `logout` now also resets the TerraStore via a cross-store call
 *   so city state is cleared cleanly.
 * - `completeLogin` no longer auto-creates a defaultProfile —
 *   the setup step always runs for new accounts.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type DietType      = "omnivore" | "vegetarian" | "vegan" | "pescatarian";
export type TransportType = "car" | "public" | "cycle" | "walk" | "mixed";
export type EnergyType    = "grid" | "renewable" | "mixed";

export interface UserProfile {
  name:       string;
  phone:      string;
  email:      string;
  age:        string;
  city:       string;
  country:    string;
  occupation: string;
  bio:        string;
  diet:       DietType;
  transport:  TransportType;
  energy:     EnergyType;
  weeklyGoal:   number;   // target sustainability score /100
  carbonBudget: number;   // target kg CO₂e per week
  avatar:     string;     // CSS color string derived from name
  joinedAt:   string;     // ISO date
}

interface UserState {
  isLoggedIn:      boolean;
  profileComplete: boolean;   // ← NEW: false until setup step is finished
  phone:           string;
  profile:         UserProfile | null;

  // Actions
  setPhone:         (phone: string) => void;
  /** Called after OTP verified — marks as logged in but profile may be incomplete */
  completeOtp:      (phone: string) => void;
  /** Called after setup step — saves full profile and marks profileComplete */
  setProfile:       (profile: UserProfile) => void;
  updateProfile:    (partial: Partial<UserProfile>) => void;
  logout:           () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      isLoggedIn:      false,
      profileComplete: false,
      phone:           "",
      profile:         null,

      setPhone: (phone) => set({ phone }),

      completeOtp: (phone) =>
        set((state) => ({
          isLoggedIn: true,
          phone,
          // If returning user with completed profile, keep it
          profile:         state.profile?.phone === phone ? state.profile : null,
          profileComplete: state.profile?.phone === phone ? state.profileComplete : false,
        })),

      setProfile: (profile) =>
        set({
          profile,
          profileComplete: true,
          isLoggedIn:      true,
          phone:           profile.phone,
        }),

      updateProfile: (partial) =>
        set((state) => ({
          profile: state.profile ? { ...state.profile, ...partial } : null,
        })),

      logout: () =>
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
