/**
 * useTerraStore — persisted per logged-in user.
 *
 * The Zustand persist key includes the user's phone number so that
 * two different accounts on the same browser never see each other's
 * activities or city state.
 *
 * Call initForUser(phone) immediately after a successful login.
 * Call resetStore() on logout.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type ImpactLevel = "positive" | "neutral" | "negative";

export interface Activity {
  id: string;
  timestamp: string;        // ISO string
  imageDataUrl: string | null;
  note: string;
  category: string;
  impact: ImpactLevel;
  carbonEstimate: number;   // kg CO2e
  sustainabilityScore: number; // 0-100
  recommendation: string;
  environmentalImpact: string;
}

export interface DaySnapshot {
  date: string;             // YYYY-MM-DD
  activities: Activity[];
  averageScore: number;
  totalCarbon: number;
  cityState: CityState;
}

export interface CityState {
  treeCount: number;        // 0-100
  pollutionLevel: number;   // 0-100
  greenness: number;        // 0-100
  waterClarity: number;     // 0-100
  biodiversity: number;     // 0-100
  renewableEnergy: number;  // 0-100
  overallScore: number;     // 0-100
}

interface TerraState {
  // ── User binding ─────────────────────────────────────────────
  currentUserPhone: string | null;

  // ── Data ─────────────────────────────────────────────────────
  activities: Activity[];
  cityState: CityState;
  dayHistory: Record<string, DaySnapshot>;

  // ── Actions ──────────────────────────────────────────────────
  /** Call after login — loads the correct user's persisted data. */
  initForUser:    (phone: string) => void;
  /** Call on logout — wipes in-memory state (persisted data stays for re-login). */
  resetStore:     () => void;

  addActivity:    (activity: Activity) => void;
  removeActivity: (id: string) => void;
  saveDaySnapshot:(date: string) => void;
  getCityStateForScore: (score: number) => CityState;
}

// ── Defaults ───────────────────────────────────────────────────────
const DEFAULT_CITY: CityState = {
  treeCount: 50, pollutionLevel: 40, greenness: 50,
  waterClarity: 60, biodiversity: 50, renewableEnergy: 30, overallScore: 55,
};

function computeCity(activities: Activity[]): CityState {
  if (activities.length === 0) return DEFAULT_CITY;

  const avg = activities.reduce((s, a) => s + a.sustainabilityScore, 0) / activities.length;
  const n   = activities.length;

  /**
   * RESPONSIVE CITY SCORE
   *
   * Moves quickly toward the activity average but is stabilised
   * by how many activities you have — prevents instant 100 or 0.
   *
   * weight = 1 - e^(-n/4)
   *
   * Activity count → weight → movement
   *  1  → 0.22  → 22% toward avg
   *  2  → 0.39  → 39%
   *  3  → 0.53  → 53%
   *  4  → 0.63  → 63%
   *  5  → 0.71  → 71%
   *  8  → 0.86  → 86%
   * 10  → 0.92  → 92%
   * 15+ → 0.98+ → fully reflects avg
   *
   * Examples with 1 upload:
   *  Cycling  (score 95): 55 + (95−55)×0.22 = 55 + 8.8  = 64   ✓ noticeable
   *  Flight   (score 8):  55 + (8−55)×0.22  = 55 − 10.3 = 45   ✓ visible drop
   *  Burger   (score 28): 55 + (28−55)×0.22 = 55 − 5.9  = 49   ✓ clear drop
   *
   * With 3 good uploads:
   *  avg ~90: 55 + (90−55)×0.53 = 55 + 18.6 = 74               ✓ big growth
   */
  const weight    = 1 - Math.exp(-n / 4);
  const cityScore = Math.round(55 + (avg - 55) * weight);
  const clamped   = Math.min(100, Math.max(0, cityScore));

  const s = clamped / 100;
  return {
    treeCount:       Math.round(20 + s * 80),
    pollutionLevel:  Math.round(100 - s * 90),
    greenness:       Math.round(10 + s * 90),
    waterClarity:    Math.round(20 + s * 80),
    biodiversity:    Math.round(10 + s * 90),
    renewableEnergy: Math.round(s * 100),
    overallScore:    clamped,
  };
}

function cityForScore(score: number): CityState {
  const s = score / 100;
  return {
    treeCount:       Math.round(20 + s * 80),
    pollutionLevel:  Math.round(100 - s * 90),
    greenness:       Math.round(10 + s * 90),
    waterClarity:    Math.round(20 + s * 80),
    biodiversity:    Math.round(10 + s * 90),
    renewableEnergy: Math.round(s * 100),
    overallScore:    Math.round(score),
  };
}

// ── Per-user storage key ────────────────────────────────────────────
function storageKey(phone: string) {
  // Sanitise phone to a safe localStorage key
  return `terrabloom-data-${phone.replace(/\+/g, "").replace(/\s/g, "")}`;
}

// ── Store factory ───────────────────────────────────────────────────
export const useTerraStore = create<TerraState>()(
  persist(
    (set, get) => ({
      currentUserPhone: null,
      activities:  [],
      cityState:   DEFAULT_CITY,
      dayHistory:  {},

      initForUser: (phone) => {
        // If we're already loaded for this user, do nothing
        if (get().currentUserPhone === phone) return;

        // Attempt to load from localStorage for this specific user
        const key  = storageKey(phone);
        const raw  = typeof window !== "undefined" ? localStorage.getItem(key) : null;
        if (raw) {
          try {
            const saved = JSON.parse(raw) as Partial<TerraState>;
            set({
              currentUserPhone: phone,
              activities:  saved.activities  ?? [],
              cityState:   saved.cityState   ?? DEFAULT_CITY,
              dayHistory:  saved.dayHistory  ?? {},
            });
            return;
          } catch { /* fall through to fresh state */ }
        }

        // Fresh account — start clean
        set({ currentUserPhone: phone, activities: [], cityState: DEFAULT_CITY, dayHistory: {} });
      },

      resetStore: () =>
        set({ currentUserPhone: null, activities: [], cityState: DEFAULT_CITY, dayHistory: {} }),

      addActivity: (activity) => {
        set((state) => {
          const next = [activity, ...state.activities];
          const city = computeCity(next);
          // Persist immediately under user-specific key
          if (state.currentUserPhone) {
            const key = storageKey(state.currentUserPhone);
            localStorage.setItem(key, JSON.stringify({ activities: next, cityState: city, dayHistory: state.dayHistory }));
          }
          return { activities: next, cityState: city };
        });
        const today = new Date().toISOString().split("T")[0];
        setTimeout(() => get().saveDaySnapshot(today), 50);
      },

      removeActivity: (id) => {
        set((state) => {
          const next = state.activities.filter((a) => a.id !== id);
          const city = computeCity(next);
          if (state.currentUserPhone) {
            const key = storageKey(state.currentUserPhone);
            localStorage.setItem(key, JSON.stringify({ activities: next, cityState: city, dayHistory: state.dayHistory }));
          }
          return { activities: next, cityState: city };
        });
      },

      saveDaySnapshot: (date) => {
        const { activities, cityState, currentUserPhone, dayHistory } = get();
        const dayActs = activities.filter((a) => a.timestamp.split("T")[0] === date);
        const avg     = dayActs.length ? dayActs.reduce((s, a) => s + a.sustainabilityScore, 0) / dayActs.length : 0;
        const carbon  = dayActs.reduce((s, a) => s + a.carbonEstimate, 0);

        const newHistory = {
          ...dayHistory,
          [date]: {
            date, activities: dayActs,
            averageScore: Math.round(avg),
            totalCarbon:  Math.round(carbon * 10) / 10,
            cityState,
          },
        };

        set({ dayHistory: newHistory });

        if (currentUserPhone) {
          const key = storageKey(currentUserPhone);
          localStorage.setItem(key, JSON.stringify({ activities, cityState, dayHistory: newHistory }));
        }
      },

      getCityStateForScore: cityForScore,
    }),
    {
      // This persist layer just stores currentUserPhone so we know
      // which user was last active and can re-hydrate on page reload.
      name: "terrabloom-meta",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ currentUserPhone: s.currentUserPhone }),
      onRehydrateStorage: () => (state) => {
        if (state?.currentUserPhone) {
          // Reload user data on hydration (page refresh)
          const key = storageKey(state.currentUserPhone);
          const raw = typeof window !== "undefined" ? localStorage.getItem(key) : null;
          if (raw) {
            try {
              const saved = JSON.parse(raw) as Partial<TerraState>;
              state.activities  = saved.activities  ?? [];
              state.cityState   = saved.cityState   ?? DEFAULT_CITY;
              state.dayHistory  = saved.dayHistory  ?? {};
            } catch { /* use defaults */ }
          }
        }
      },
    }
  )
);
