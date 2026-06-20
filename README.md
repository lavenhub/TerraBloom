# TerraBloom

![TerraBloom Hero](public/screenshots/hero.png)

> AI sustainability platform where your daily choices shape a living 3D city. Log any activity — food, travel, energy — and Groq Vision AI estimates the carbon footprint in real time. Good choices grow trees and clear the air. Bad ones bring smog and decay.

**Live →** [terrabloom-zeta.vercel.app](https://terrabloom-zeta.vercel.app)

---

## Features

- **Carbon Log** — Upload any photo. Groq Llama 4 Vision AI identifies the activity and estimates its carbon footprint in real time
- **Living 3D City** — A procedurally generated city with a 20-parameter rulebook. Every score point changes trees, buildings, turbines, pollution haze, lake clarity, and city size
- **History Calendar** — Every logged activity stored day by day with impact scores
- **Future Simulation** — Side-by-side 3D comparison of your current city vs an improved one
- **Profile** — Lifestyle preferences, weekly goals, carbon budget tracker
- **Auth** — Phone + OTP login, 3-step account setup

## City Score Rulebook

| Score | City State | Trees | Buildings | Pollution |
|-------|-----------|-------|-----------|-----------|
| 0–19 | Critical | 0–11 | 6–12 | 55% haze |
| 20–39 | Struggling | 12–23 | 12–19 | 27–55% |
| 40–59 | Neutral | 24–35 | 19–26 | 0–22% |
| 60–79 | Growing | 36–47 | 26–33 | Clear |
| 80–100 | Thriving | 48–60 | 33–40 | Clear + solar |

## Stack

- **Framework** — Next.js 16 (App Router)
- **3D Rendering** — React Three Fiber + Three.js
- **AI Vision** — Groq Llama 4 Scout (real-time image analysis)
- **State** — Zustand with per-user localStorage persistence
- **Animations** — Framer Motion + GSAP
- **Styling** — Tailwind CSS v4
- **Deployment** — Vercel

## Getting Started

```bash
git clone https://github.com/lavenhub/TerraBloom
cd TerraBloom/terrabloom
npm install
```

Create `.env.local`:
```env
GROQ_API_KEY=your_groq_api_key_here
```

Get a free Groq key at [console.groq.com](https://console.groq.com)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## OTP Login

The app uses a hardcoded OTP for demo purposes. Use **`123456`** as the verification code for any phone number.

## Test the City

Visit `/test-city` to use the interactive score slider, auto-sweep animation, and mock activity injector without going through the full login flow.
