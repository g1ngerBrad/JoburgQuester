# Quester

A mobile-first PWA that generates AI-powered side-quests for exploring any city. Set your location, enter your Groq API key, tap Generate, and get a personalised adventure — free or cheap, safety-aware, and scoped to your chosen radius.

## Features

- **AI quest generation** via Groq (`llama-3.3-70b-versatile`) with structured JSON output
- **Any city** — set any neighbourhood, suburb, or city as your origin point
- **Mapbox place autocomplete** — live place search when a Mapbox token is configured (set as an environment variable, see below)
- **10 quest categories** with a home-screen pill selector — tap to lock a category or leave it on Random
- **Adaptive category weighting** — completing quests in a category increases its future probability
- **Quest log** with persistent history, custom quest creation, and completion tracking
- **Safety-aware prompts** — the AI applies local safety knowledge for your chosen location
- **Configurable radius** (5–250 km from your location) that shapes the AI's location guidance
- **PWA-ready** — installable on mobile, standalone display mode

## Getting Started (local)

1. Clone the repo and open `pages/home.html` in a browser (or serve the root with any static server).
2. Tap the gear icon (⚙) and enter your [Groq API key](https://console.groq.com).
3. Set your location (type any city or suburb).
4. Optionally set a max distance radius.
5. Tap **Generate** to get your first quest.

No build step is required for local development. Tailwind CSS is loaded via CDN. Location autocomplete will not work locally unless you manually edit `js/env.js` to add your Mapbox token (see below).

## Deploying to Vercel

### 1. Push to GitHub and import into Vercel

Import your repository at [vercel.com/new](https://vercel.com/new). Vercel will auto-detect the project.

### 2. Set the `MAPBOX_TOKEN` environment variable

In your Vercel project dashboard:

1. Go to **Settings → Environment Variables**
2. Add a new variable:
   - **Name:** `MAPBOX_TOKEN`
   - **Value:** your Mapbox public token (starts with `pk.`)
   - **Environments:** Production (and Preview if desired)
3. Click **Save**

#### Getting a Mapbox token

1. Create a free account at [account.mapbox.com](https://account.mapbox.com)
2. On the **Tokens** page, you can use the **Default public token** — it includes geocoding access by default
3. Or create a new token and ensure the following **Public scopes** are checked:
   - `styles:read` *(required)*
   - `geocoding:read` *(or equivalent — this enables the `/geocoding/v5/` endpoint)*

> **Note:** Mapbox public tokens (`pk.*`) are safe to expose in browser JS — they are not secret. They are rate-limited per token and can be URL-restricted in the Mapbox dashboard if needed.

### 3. Redeploy

After saving the environment variable, trigger a new deployment (push a commit, or use **Deployments → Redeploy** in the Vercel dashboard). The build step runs `node scripts/inject-env.js`, which writes the token into `js/env.js` before the static files are served.

### How it works

- `scripts/inject-env.js` reads `process.env.MAPBOX_TOKEN` and writes it into `js/env.js` as a global constant
- `js/env.js` is loaded before all other scripts in both HTML pages
- The app uses `MAPBOX_TOKEN` for location autocomplete in the settings modal
- Without a token, the location field still works as a plain text input — autocomplete is just disabled

## Project Structure

```
pages/
  home.html       — Quest generation view
  log.html        — Quest history & custom quest creation
js/
  env.js          — Generated at build time; holds MAPBOX_TOKEN (committed as empty placeholder)
  config.js       — Constants, categories, weights
  state.js        — localStorage state + adaptive weight logic
  api.js          — Groq API call + prompt builder
  quests.js       — Add, delete, toggle-complete operations
  ui.js           — All rendering (cards, modals, log entries)
  home.js         — Home page event wiring + location autocomplete
  log.js          — Log page event wiring
scripts/
  inject-env.js   — Vercel build script: writes MAPBOX_TOKEN into js/env.js
styles/
  globals.css     — Shared styles, animations, buttons, splash screen
  index.css       — Home page (ring animations)
  log.css         — Log page (custom checkbox, reset icon)
  gems.css        — Gems page (add bar, cyan button)
  settings.css    — Settings page (section cards, avatar, auth tabs)
  social.css      — Social page (comment input, share FAB, pink buttons)
vercel.json       — Vercel build configuration
manifest.json     — PWA manifest
```

## State

All state is persisted to `localStorage` under the key `jhbsq_v1`:

| Field | Description |
|---|---|
| `apiKey` | Groq API key |
| `location` | Origin location string (default: `'Bryanston, Johannesburg'`) |
| `activeQuest` | Currently displayed quest object (or null) |
| `questHistory` | Array of all quests (generated + custom) |
| `categoryWeights` | Per-category probability weights |
| `maxDistance` | Radius in km (5, 10, 25, 50, 100, 250) |

## Quest Categories

| Category | Emoji | UI Label |
|---|---|---|
| In-Home/Chill | 🛋️ | Chill |
| Urban Explorer | 🏙️ | Urban |
| Nature & Adventure | 🌿 | Nature |
| Skills & Craft | 🛠️ | Skills |
| Physical Challenges | 🏃 | Challenges |
| Exploration & Navigation | 🗺️ | Exploration |
| Social Experiments | 🗣️ | Social |
| Creative & Media | 🎨 | Creativity |
| Comfort Zone | 🧘 | Comfort Zone |
| Local Gems | 💎 | Local Gems |

Each category starts at equal weight (0.1). Weights adapt as you complete quests, clamped to [0.01, 0.97]. The home-screen pill strip lets you override the weighted random pick and lock a specific category for your next quest.

## Dependencies

- [Tailwind CSS v4](https://tailwindcss.com) (CDN)
- [Groq API](https://console.groq.com) (user-supplied key, never stored server-side)
- [Mapbox Geocoding API](https://docs.mapbox.com/api/search/geocoding/) (token set via Vercel env var)
