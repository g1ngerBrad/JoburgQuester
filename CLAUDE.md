# CLAUDE.md — Quester (JoburgQuester repo)

## Git

**Do not push to GitHub.** Commit locally only. Never run `git push` or create pull requests unless the user explicitly instructs it in that session.

## Project Summary

Mobile-first PWA. Generates AI side-quests for any city via the Groq API. No local build step — vanilla JS + Tailwind CSS via CDN. All state in `localStorage` (`jhbsq_v1`). Deployed to Vercel with a build step that injects `MAPBOX_TOKEN` into `js/env.js`.

## File Map

| File | Role |
|---|---|
| `js/env.js` | Generated at Vercel build time; exposes `MAPBOX_TOKEN` global (committed as empty placeholder) |
| `js/config.js` | Category definitions, weights, constants, `DEFAULT_LOCATION` |
| `js/state.js` | Load/save localStorage state, `adaptWeights()` |
| `js/api.js` | `generateQuest()`, `buildPrompt()`, Groq fetch |
| `js/quests.js` | `addCustomQuest()`, `deleteQuest()`, `toggleComplete()` |
| `js/ui.js` | All DOM rendering — cards, modals, log entries |
| `js/home.js` | Home page event listeners, location autocomplete, city tagline update |
| `js/log.js` | Log page event listeners only |
| `scripts/inject-env.js` | Node script run by Vercel build: writes `MAPBOX_TOKEN` env var into `js/env.js` |
| `pages/home.html` | Quest generation view |
| `pages/log.html` | Quest history + custom quest modal |
| `styles/globals.css` | Shared styles, animations |
| `styles/index.css` | Home-page ring animations |
| `styles/log.css` | Log-page custom checkbox |
| `vercel.json` | Vercel build config (`buildCommand`, `outputDirectory`) |

## Key Patterns

- **Rendering**: `ui.js` owns all DOM writes. Page files (`home.js`, `log.js`) wire events and call into `ui.js`, `quests.js`, `api.js`.
- **State**: Always mutate via `state.js` functions, then call `saveState()`. Never write to localStorage directly.
- **Adaptive weights**: `adaptWeights(category)` in `state.js` — called by `toggleComplete()` when marking a quest done.
- **Prompt building**: `buildPrompt(category, maxDistance, recent, location)` in `api.js`. Safety rules are embedded in the prompt, not the UI. Location is city-agnostic — the AI applies its own local knowledge.
- **Mapbox token**: Exposed as the global `MAPBOX_TOKEN` from `js/env.js`. Set via the `MAPBOX_TOKEN` Vercel environment variable. For local dev, edit `js/env.js` manually (do not commit). In settings modal, autocomplete is silently disabled when `MAPBOX_TOKEN` is an empty string.
- **City tagline**: `_updateCityTagline()` in `home.js` sets `#discoverTagline` to the first segment of `state.location` (before the first comma).

## Groq API

- Endpoint: `https://api.groq.com/openai/v1/chat/completions`
- Model: `llama-3.3-70b-versatile`
- Response format: `json_object`
- Expected fields: `title`, `description`, `difficulty` (Simple/Moderate/Complex), `cost` (Free/Cheap)

## localStorage Schema (`jhbsq_v1`)

```js
{
  apiKey: string,
  location: string,         // default: 'Bryanston, Johannesburg'
  activeQuest: Quest | null,
  questHistory: Quest[],
  categoryWeights: { [category]: number },
  maxDistance: 5 | 10 | 25 | 50 | 100 | 250
}
```

Quest shape: `{ id, title, description, category, difficulty, cost, completed, weightCounted, createdAt, custom? }`

## Categories

`In-Home/Chill`, `Urban Explorer`, `Nature & Adventure`, `Culture & History` — defined in `config.js` with emoji, colour, and default weight (0.25 each). Weights clamped to [0.02, 0.94].

## Doc Maintenance

After any change that affects project structure, features, state schema, API integration, categories, or patterns:
- Update **README.md** if the change affects setup, features, file structure, state, or categories (user-facing).
- Update **CLAUDE.md** if the change affects the file map, key patterns, API details, localStorage schema, or project rules (Claude-facing).

Do this as part of the same task, not as a separate step.

## Service Worker

`sw.js` is registered from `home.js` and `log.js`. It caches all app shell assets (HTML, CSS, JS, Tailwind CDN) for fast repeat loads on mobile.

**When modifying any cached file** (HTML, CSS, JS), bump the cache version in `sw.js` so users receive fresh files:
```js
const CACHE = 'sq-v6'; // increment each time cached files change
```

The `PRECACHE` list in `sw.js` mirrors the file map above. If you add or remove files, update that list too. `js/env.js` is in PRECACHE — bump the cache version whenever the Mapbox token changes on Vercel.

Groq and Mapbox API calls are intentionally excluded from caching.

## Do Not

- Do not introduce a build system or bundler beyond the single `scripts/inject-env.js` step.
- Do not add a backend — this is intentionally a static/client-only app.
- Do not store the API key anywhere except `localStorage`.
- Do not store the Mapbox token in `localStorage` or the settings UI — it lives in `js/env.js` via the Vercel env var.
- Do not push to GitHub without explicit per-session instruction.
