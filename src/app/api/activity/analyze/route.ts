import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

/**
 * POST /api/activity/analyze
 *
 * Real-time carbon footprint analysis using Groq vision (Llama 4 Scout).
 * The model actually SEES the uploaded image — no keyword matching.
 *
 * Requires: GROQ_API_KEY in .env.local
 * Free key:  https://console.groq.com
 */

// ── Constants ─────────────────────────────────────────────────────
const GROQ_MODEL          = "meta-llama/llama-4-scout-17b-16e-instruct" as const;
const MAX_TOKENS          = 512;
const TEMPERATURE         = 0.1;
/** Max base64 imageDataUrl size: ~10 MB decoded ≈ ~13.5 MB base64 */
const MAX_IMAGE_DATA_LEN  = 14 * 1024 * 1024;
const VALID_MIME_TYPES    = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const VALID_IMPACTS       = new Set(["positive", "neutral", "negative"]);
const VALID_CATEGORIES    = new Set([
  "Food", "Transport", "Energy", "Shopping", "Waste", "Recreation", "Home", "Other",
]);

const SYSTEM_PROMPT = `You are TerraBloom's sustainability AI. Analyze the image (and optional user note) to estimate the carbon footprint of the activity shown.

Return ONLY a valid JSON object — no markdown, no explanation, nothing else:
{
  "category": "one of: Food, Transport, Energy, Shopping, Waste, Recreation, Home, Other",
  "impact": "one of: positive, neutral, negative",
  "carbonEstimate": <number in kg CO2e, realistic float>,
  "sustainabilityScore": <integer 0-100, 100 = most sustainable>,
  "environmentalImpact": "2-3 sentences on the specific environmental impact",
  "recommendation": "1-2 sentences of actionable advice"
}

Carbon reference values:
- Beef burger: 4-6 kg | Chicken meal: 1.5-2.5 kg | Vegan meal: 0.3-1.0 kg
- Coffee/latte: 0.2-0.5 kg | Grocery run: 2-8 kg
- Short-haul flight: 100-250 kg | Long-haul flight: 300-800 kg
- Car journey 30km: 3-6 kg | Metro/bus ride: 0.05-0.25 kg | Cycling: 0 kg
- Monthly electricity bill: 50-200 kg | Plastic bottle: 0.1-0.2 kg
- New clothing: 5-30 kg | Electronics purchase: 100-400 kg

Score guide: 0-20 very harmful | 21-40 harmful | 41-60 neutral | 61-80 good | 81-100 excellent`;

// ── Types ─────────────────────────────────────────────────────────
interface AnalysisResult {
  category:            string;
  impact:              string;
  carbonEstimate:      number;
  sustainabilityScore: number;
  environmentalImpact: string;
  recommendation:      string;
}

// ── Demo fallback (no API key) ────────────────────────────────────
function demoAnalysis(note: string): AnalysisResult {
  const n = note.toLowerCase();
  if (n.includes("cycl") || n.includes("bike") || n.includes("walk"))
    return { category: "Transport", impact: "positive", carbonEstimate: 0, sustainabilityScore: 95, environmentalImpact: "Cycling and walking produce zero direct emissions and reduce road congestion.", recommendation: "Keep it up — every zero-emission trip makes a measurable difference." };
  if (n.includes("metro") || n.includes("bus") || n.includes("train"))
    return { category: "Transport", impact: "positive", carbonEstimate: 0.15, sustainabilityScore: 80, environmentalImpact: "Public transit emits ~45% fewer greenhouse gases per km than a solo car journey.", recommendation: "Great choice. Cycling the last mile reduces your footprint even further." };
  if (n.includes("burger") || n.includes("beef") || n.includes("meat"))
    return { category: "Food", impact: "negative", carbonEstimate: 4.8, sustainabilityScore: 28, environmentalImpact: "Beef generates ~60 kg CO₂e per kg due to livestock methane and land use.", recommendation: "One plant-based swap per week saves ~150 kg CO₂e per year." };
  if (n.includes("flight") || n.includes("plane") || n.includes("fly"))
    return { category: "Transport", impact: "negative", carbonEstimate: 285, sustainabilityScore: 8, environmentalImpact: "Air travel is one of the most carbon-intensive activities per journey.", recommendation: "Trains emit 90% less CO₂ for distances under 600 km." };
  if (n.includes("groceri") || n.includes("vegetabl") || n.includes("vegan") || n.includes("salad"))
    return { category: "Food", impact: "positive", carbonEstimate: 1.1, sustainabilityScore: 74, environmentalImpact: "Plant-based foods have significantly lower carbon footprints than animal products.", recommendation: "Choose local and seasonal produce to reduce transport emissions further." };
  if (n.includes("plastic") || n.includes("bottle"))
    return { category: "Waste", impact: "negative", carbonEstimate: 0.18, sustainabilityScore: 22, environmentalImpact: "Single-use plastics persist for 400+ years. Only 9% of all plastic ever made has been recycled.", recommendation: "A reusable bottle replaces ~156 single-use bottles per year." };
  if (n.includes("car") || n.includes("drive") || n.includes("uber"))
    return { category: "Transport", impact: "negative", carbonEstimate: 3.2, sustainabilityScore: 32, environmentalImpact: "A petrol car emits ~0.12 kg CO₂e per km. Most urban trips could be replaced by transit.", recommendation: "Carpooling or public transit for regular routes cuts this footprint significantly." };
  if (n.includes("electric") || n.includes("bill") || n.includes("energy"))
    return { category: "Energy", impact: "negative", carbonEstimate: 85, sustainabilityScore: 35, environmentalImpact: "Grid electricity still relies significantly on fossil fuels in most regions.", recommendation: "Switch to a renewable energy tariff and use LED lighting to reduce consumption by 20-30%." };
  return { category: "General", impact: "neutral", carbonEstimate: 1.5, sustainabilityScore: 50, environmentalImpact: "This activity has a moderate environmental footprint. Daily choices compound into significant annual impact.", recommendation: "Track more activities to identify the highest-impact areas to improve." };
}

/** Sanitise and normalise the raw Groq JSON into a validated AnalysisResult */
function parseGroqResponse(raw: string): AnalysisResult {
  const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  const parsed  = JSON.parse(cleaned) as Record<string, unknown>;

  const category = VALID_CATEGORIES.has(String(parsed.category))
    ? String(parsed.category)
    : "General";

  const impact = VALID_IMPACTS.has(String(parsed.impact))
    ? String(parsed.impact)
    : "neutral";

  const carbonEstimate      = Math.max(0, parseFloat(String(parsed.carbonEstimate)) || 0);
  const sustainabilityScore = Math.min(100, Math.max(0, parseInt(String(parsed.sustainabilityScore), 10) || 50));

  return {
    category,
    impact,
    carbonEstimate,
    sustainabilityScore,
    environmentalImpact: String(parsed.environmentalImpact || ""),
    recommendation:      String(parsed.recommendation      || ""),
  };
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Parse body once — store result to avoid re-consuming stream
  const body = await req.json().catch(() => null) as {
    imageDataUrl?: unknown;
    note?: unknown;
  } | null;

  try {
    if (!body?.imageDataUrl || typeof body.imageDataUrl !== "string") {
      return NextResponse.json({ error: "imageDataUrl is required." }, { status: 400 });
    }

    const { imageDataUrl, note = "" } = body as { imageDataUrl: string; note: string };

    // ── Validate image size ───────────────────────────────────────
    if (imageDataUrl.length > MAX_IMAGE_DATA_LEN) {
      return NextResponse.json({ error: "Image is too large. Maximum size is 10 MB." }, { status: 413 });
    }

    // ── Validate MIME type from data URI ──────────────────────────
    const mimeMatch = imageDataUrl.match(/^data:([^;]+);base64,/);
    if (!mimeMatch || !VALID_MIME_TYPES.has(mimeMatch[1])) {
      return NextResponse.json(
        { error: "Invalid image format. Supported: JPEG, PNG, WebP, GIF." },
        { status: 415 }
      );
    }

    // ── Sanitise note — strip HTML tags, limit length ─────────────
    const sanitisedNote = String(note).replace(/<[^>]*>/g, "").trim().slice(0, 500);

    const apiKey = process.env.GROQ_API_KEY;

    // ── Demo mode ─────────────────────────────────────────────────
    if (!apiKey || apiKey === "your_groq_api_key_here") {
      return NextResponse.json(demoAnalysis(sanitisedNote));
    }

    // ── Real Groq vision analysis ─────────────────────────────────
    const groq = new Groq({ apiKey });

    const userText = sanitisedNote
      ? `Analyze this image. The user described it as: "${sanitisedNote}". Give a carbon footprint analysis.`
      : "Analyze this image and provide a carbon footprint analysis of the activity shown. Be specific about what you see.";

    const response = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: userText },
            { type: "image_url", image_url: { url: imageDataUrl } },
          ],
        },
      ],
      temperature: TEMPERATURE,
      max_tokens:  MAX_TOKENS,
    });

    const raw    = response.choices[0]?.message?.content?.trim() ?? "";
    const result = parseGroqResponse(raw);
    return NextResponse.json(result);

  } catch (err: unknown) {
    // Use demo fallback on JSON parse failure — note was already sanitised above
    if (err instanceof SyntaxError) {
      const sanitisedNote = typeof body?.note === "string"
        ? body.note.replace(/<[^>]*>/g, "").trim().slice(0, 500)
        : "";
      return NextResponse.json(demoAnalysis(sanitisedNote));
    }

    const message = err instanceof Error ? err.message : "Analysis failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
