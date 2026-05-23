# Joburg Side-Quests

A mobile-first PWA that generates AI-powered side-quests for exploring Johannesburg. Enter your Groq API key, tap Generate, and get a personalised adventure — free or cheap, safety-aware, and tuned to your location in Bryanston.

## Features

- **AI quest generation** via Groq (`llama-3.3-70b-versatile`) with structured JSON output
- **Adaptive category weighting** — completing quests in a category increases its future probability
- **Quest log** with persistent history, custom quest creation, and completion tracking
- **Safety-aware prompts** — avoids unsafe areas, suggests secure venues
- **Configurable radius** (5–250 km from Bryanston) that shapes the AI's location guidance
- **PWA-ready** — installable on mobile, standalone display mode

## Getting Started

1. Clone the repo and open `pages/home.html` in a browser (or serve the root with any static server).
2. Tap the gear icon (⚙) and enter your [Groq API key](https://console.groq.com).
3. Optionally set a max distance radius.
4. Tap **Generate** to get your first quest.

No build step is required. Tailwind CSS is loaded via CDN.

## Project Structure

```
pages/
  home.html       — Quest generation view
  log.html        — Quest history & custom quest creation
js/
  config.js       — Constants, categories, weights
  state.js        — localStorage state + adaptive weight logic
  api.js          — Groq API call + prompt builder
  quests.js       — Add, delete, toggle-complete operations
  ui.js           — All rendering (cards, modals, log entries)
  home.js         — Home page event wiring
  log.js          — Log page event wiring
styles/
  globals.css     — Shared styles, animations, buttons
  index.css       — Home page (ring animations)
  log.css         — Log page (custom checkbox)
manifest.json     — PWA manifest
```

## State

All state is persisted to `localStorage` under the key `jhbsq_v1`:

| Field | Description |
|---|---|
| `apiKey` | Groq API key |
| `activeQuest` | Currently displayed quest object (or null) |
| `questHistory` | Array of all quests (generated + custom) |
| `categoryWeights` | Per-category probability weights |
| `maxDistance` | Radius in km (5, 10, 25, 50, 100, 250) |

## Quest Categories

| Category | Emoji | Default Weight |
|---|---|---|
| In-Home / Chill | 🛋️ | 0.25 |
| Urban Explorer | 🏙️ | 0.25 |
| Nature & Adventure | 🌿 | 0.25 |
| Culture & History | 🏛️ | 0.25 |

Weights shift by ±0.15 on quest completion, clamped to [0.02, 0.94].

## Dependencies

- [Tailwind CSS v4](https://tailwindcss.com) (CDN)
- [Groq API](https://console.groq.com) (user-supplied key, never stored server-side)
