/**
 * ═══════════════════════════════════════════════════════════════════
 *  TERRABLOOM CITY RULEBOOK  v2.0
 *  Every rule is deterministic and per-score-unit.
 * ═══════════════════════════════════════════════════════════════════
 *
 *  SCORE SCALE: 0 → 100
 *  Score comes from the rolling average of all sustainability scores.
 *
 *  ── TIERS ───────────────────────────────────────────────────────
 *   0–19   : CRITICAL   — dying city, heavy smog, no trees
 *  20–39   : STRUGGLING — some life, polluted air, sparse greenery
 *  40–59   : NEUTRAL    — balanced city, moderate everything
 *  60–79   : GROWING    — healthy city, many trees, clean air
 *  80–100  : THRIVING   — lush mega-city, zero pollution, full grid
 *
 *  ── PER-UNIT RULES (what changes for each +1 score point) ────────
 *
 *  TREES
 *    Base count  : 0 at score 0
 *    Max count   : 60 at score 100
 *    Formula     : floor(score × 0.6)            → +0.6 trees per point
 *    Min size    : 0.4  Max size: 1.2
 *    Colour      : HSL(0.33, 0.4+s×0.4, 0.2+s×0.25)  s=score/100
 *
 *  BUILDINGS
 *    Base count  : 6 at score 0 (ruins/shacks)
 *    Max count   : 40 at score 100
 *    Formula     : 6 + floor(score × 0.34)       → +0.34 buildings per point
 *    Height range: score 0 → max 1.2u | score 100 → max 6.0u
 *    Height max  : 1.2 + (score/100) × 4.8       → +0.048u per point
 *    Width range : 0.25 + (score/100) × 0.35     → +0.0035u per point
 *    Colour      : clean white-green (high) → grimy brown-grey (low)
 *      HSL hue   : 0.08 + (score/100) × 0.08     (brown→green-white)
 *      Saturation: 0.05 + (score/100) × 0.15
 *      Lightness : 0.18 + (score/100) × 0.30
 *    Rooftop garden : appears when score ≥ 50 AND building index mod logic
 *    Solar panels   : appears when score ≥ 40 AND renewableEnergy > threshold
 *
 *  WIND TURBINES
 *    Count  : 0 at score 0,  max 10 at score 100
 *    Formula: floor(score × 0.10)               → +0.10 turbines per point
 *    Appear only when score ≥ 20
 *    Speed  : 0.008 + (score/100) × 0.022       → faster when greener
 *
 *  SOLAR FIELDS (ground-level panels, score ≥ 60)
 *    Count  : floor((score − 60) × 0.15)        → max 6 at score 100
 *
 *  POLLUTION HAZE
 *    Opacity: max(0, (50 − score) / 50) × 0.55  → fully opaque at 0, gone at 50
 *    Colour : RGB(0.32, 0.28, 0.22) → grey-brown
 *    Present: always when score < 50
 *
 *  AIR CLARITY (fog layer above city)
 *    Density: max(0, (60 − score) / 60) × 0.40  → dense at 0, clear at 60
 *    Colour : near-black with brown tint
 *
 *  LAKE
 *    Appears  : score ≥ 10
 *    Size     : 0.4 + (score/100) × 1.6         → +0.016 radius per point
 *    Clarity  : HSL(0.55, 0.3+(s×0.5), 0.15+(s×0.25))
 *    Ripple   : emissiveIntensity = 0.05 + s×0.15
 *
 *  GROUND GREENERY
 *    Colour HSL hue : 0.22 + (score/100) × 0.11  → yellow-brown → deep green
 *    Saturation     : 0.10 + (score/100) × 0.55
 *    Lightness      : 0.06 + (score/100) × 0.14
 *
 *  CITY BOUNDARY / SPREAD
 *    Building spread radius: 4 + (score/100) × 8  → city grows from 4u to 12u
 *    Tree spread radius    : 5 + (score/100) × 9  → 5u to 14u
 *
 *  ROADS
 *    Always present (4 main roads in a grid)
 *    Road colour: darkens with pollution
 *      HSL(0, 0, 0.08 + (score/100) × 0.06)
 *
 *  BIODIVERSITY PARTICLES
 *    Count  : 0 at score 0, max 40 at score 100
 *    Formula: floor(score × 0.40)
 *    Active : score ≥ 30
 *    Colour : #22c55e at high, #86efac at mid, none below 30
 *
 *  LIGHTING
 *    Ambient intensity   : 0.2 + (score/100) × 0.4
 *    Sun intensity       : 0.6 + (score/100) × 0.8
 *    Sun colour          : HSL(0.12, 0.4+(s×0.3), 0.6+(s×0.2))  warm at high
 *    Green point light   : only when score ≥ 50, intensity = (score-50)/50
 *
 *  CLOUDS
 *    Opacity: 0.05 + (score/100) × 0.20   → cleaner sky = more visible white clouds
 *    Count  : 1 at low, 3 at high
 * ═══════════════════════════════════════════════════════════════════
 */

export interface CityRules {
  score: number;           // 0–100

  // Trees
  treeCount: number;       // 0–60
  treeMinScale: number;
  treeMaxScale: number;
  treeColorH: number;
  treeColorS: number;
  treeColorL: number;

  // Buildings
  buildingCount: number;   // 6–40
  buildingMaxHeight: number;
  buildingSpread: number;  // radius
  buildingColorH: number;
  buildingColorS: number;
  buildingColorL: number;
  rooftopGardenThreshold: number; // fraction of buildings with gardens
  solarPanelThreshold: number;

  // Turbines & solar
  turbineCount: number;    // 0–10
  turbineSpeed: number;
  solarFieldCount: number; // 0–6

  // Pollution haze
  hazeOpacity: number;     // 0–0.55
  hazePresent: boolean;

  // Air clarity (fog)
  fogDensity: number;      // 0–0.40

  // Lake
  lakePresent: boolean;
  lakeRadius: number;
  lakeClarityH: number;
  lakeClarityS: number;
  lakeClarityL: number;

  // Ground
  groundH: number;
  groundS: number;
  groundL: number;

  // City spread
  treeSpread: number;

  // Biodiversity
  particleCount: number;   // 0–40
  particlesActive: boolean;

  // Lighting
  ambientIntensity: number;
  sunIntensity: number;
  greenLightActive: boolean;
  greenLightIntensity: number;

  // Roads
  roadLightness: number;

  // Clouds
  cloudOpacity: number;
  cloudCount: number;
}

/** Compute all city rendering parameters from a single score value */
export function computeRules(rawScore: number): CityRules {
  const score = Math.min(100, Math.max(0, rawScore)); // clamp first
  const s = score / 100; // 0.0 – 1.0

  return {
    score,

    // ── Trees ────────────────────────────────────────────────
    treeCount:        Math.floor(score * 0.6),
    treeMinScale:     0.4 + s * 0.3,
    treeMaxScale:     0.7 + s * 0.5,
    treeColorH:       0.33,
    treeColorS:       0.40 + s * 0.40,
    treeColorL:       0.20 + s * 0.25,

    // ── Buildings ────────────────────────────────────────────
    buildingCount:    6 + Math.floor(score * 0.34),
    buildingMaxHeight:1.2 + s * 4.8,
    buildingSpread:   4  + s * 8,
    buildingColorH:   0.08 + s * 0.08,
    buildingColorS:   0.05 + s * 0.15,
    buildingColorL:   0.18 + s * 0.30,
    rooftopGardenThreshold: score >= 50 ? (score - 50) / 50 : 0,
    solarPanelThreshold:    score >= 40 ? (score - 40) / 60 : 0,

    // ── Turbines & Solar ─────────────────────────────────────
    turbineCount:     score >= 20 ? Math.floor(score * 0.10) : 0,
    turbineSpeed:     0.008 + s * 0.022,
    solarFieldCount:  score >= 60 ? Math.floor((score - 60) * 0.15) : 0,

    // ── Pollution haze ────────────────────────────────────────
    hazePresent:      score < 50,
    hazeOpacity:      score < 50 ? ((50 - score) / 50) * 0.55 : 0,

    // ── Air fog ───────────────────────────────────────────────
    fogDensity:       score < 60 ? ((60 - score) / 60) * 0.40 : 0,

    // ── Lake ─────────────────────────────────────────────────
    lakePresent:      score >= 10,
    lakeRadius:       0.4 + s * 1.6,
    lakeClarityH:     0.55,
    lakeClarityS:     0.30 + s * 0.50,
    lakeClarityL:     0.15 + s * 0.25,

    // ── Ground ───────────────────────────────────────────────
    groundH:          0.22 + s * 0.11,
    groundS:          0.10 + s * 0.55,
    groundL:          0.06 + s * 0.14,

    // ── Spread ───────────────────────────────────────────────
    treeSpread:       5 + s * 9,

    // ── Biodiversity particles ────────────────────────────────
    particleCount:    score >= 30 ? Math.floor(score * 0.40) : 0,
    particlesActive:  score >= 30,

    // ── Lighting ─────────────────────────────────────────────
    ambientIntensity: 0.20 + s * 0.40,
    sunIntensity:     0.60 + s * 0.80,
    greenLightActive: score >= 50,
    greenLightIntensity: score >= 50 ? (score - 50) / 50 * 0.6 : 0,

    // ── Roads ────────────────────────────────────────────────
    roadLightness:    0.08 + s * 0.06,

    // ── Clouds ───────────────────────────────────────────────
    cloudOpacity:     0.05 + s * 0.20,
    cloudCount:       score < 33 ? 1 : score < 66 ? 2 : 3,
  };
}

/** Human-readable tier label */
export function scoreTier(score: number): { label: string; color: string } {
  if (score >= 80) return { label: "Thriving",   color: "#22c55e" };
  if (score >= 60) return { label: "Growing",    color: "#86efac" };
  if (score >= 40) return { label: "Neutral",    color: "#a3a3a3" };
  if (score >= 20) return { label: "Struggling", color: "#fbbf24" };
  return             { label: "Critical",    color: "#f87171" };
}
