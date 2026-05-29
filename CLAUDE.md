# CLAUDE.md — Quester (JoburgQuester repo)

## Git

**Do not push to GitHub.** Commit locally only. Never run `git push` or create pull requests unless the user explicitly instructs it in that session.

## Project Summary

Mobile-first PWA. Generates AI side-quests for any city via the Groq API. No local build step — vanilla JS + Tailwind CSS via CDN. All local state in `localStorage` (`jhbsq_v1`). Social features (gems, shared quests, comments, friends) use Supabase. Deployed to Vercel with a build step that injects `MAPBOX_TOKEN`, `SUPABASE_URL`, and `SUPABASE_ANON_KEY` into `js/env.js`.

## File Map

| File | Role |
|---|---|
| `js/env.js` | Generated at Vercel build time; exposes `MAPBOX_TOKEN`, `SUPABASE_URL`, `SUPABASE_ANON_KEY` globals |
| `js/config.js` | Category definitions, weights, constants, `DEFAULT_LOCATION` |
| `js/state.js` | Load/save localStorage state, `adaptWeights()` |
| `js/api.js` | `generateQuest()`, `buildPrompt()`, Groq fetch |
| `js/quests.js` | `addCustomQuest()`, `deleteQuest()`, `toggleComplete()` |
| `js/ui.js` | All DOM rendering — cards, modals, log entries |
| `js/supabase.js` | Supabase client (`getDb()`), auth (`authSignIn/Up/Out`, `refreshSession`), `uploadPhoto()`, `compressImage()`, `haversineKm()`, `getBrowserCoords()` |
| `js/home.js` | Quest generator page — category grid, tagline, service worker registration |
| `js/log.js` | Log page event listeners only |
| `js/gems.js` | Local Gems page — AI gem generation, Mine/Found tabs, add/delete gems |
| `js/social.js` | Social page — feed, share modal, comments modal |
| `js/settings-page.js` | Settings page — auth (sign in/up/out), profile edit, avatar upload, friends, app settings, location autocomplete |
| `scripts/inject-env.js` | Node script run by Vercel build: writes `MAPBOX_TOKEN`, `SUPABASE_URL`, `SUPABASE_ANON_KEY` into `js/env.js` |
| `pages/home.html` | Quest generation view (center tab) |
| `pages/log.html` | Quest history + custom quest modal |
| `pages/gems.html` | Local Gems page (left nav tab) — AI gem generation + Mine/Found tabs |
| `pages/social.html` | Social feed + share/comments (right nav tab) |
| `pages/settings.html` | Settings page — profile, friends, app settings |
| `styles/globals.css` | Shared styles, animations, bottom navbar (`.bottom-nav`, `.nav-tab`, `.nav-center`, `.nav-generate-btn`, `.page-tab-bar`, `.page-tab`), splash screen (`#splash`, `.sdot`, `.splash-dots`, accent overrides `.splash-cyan`/`.splash-pink`) |
| `styles/index.css` | Home-page ring animations |
| `styles/log.css` | Log-page custom checkbox, `.reset-icon` |
| `styles/gems.css` | Gems-page styles — `.gem-add-bar`, cyan `.btn-gem` |
| `styles/settings.css` | Settings-page styles — `.section-card`, `.section-title`, `.avatar-ring`, `.auth-tab-bar`, `.lowercase-input` |
| `styles/social.css` | Social-page styles — `.comment-input`, `.share-fab`, pink `.btn-pink`, `.comment-send-btn` |
| `vercel.json` | Vercel build config (`buildCommand`, `outputDirectory`) |

## Navigation

Five pages accessible via:
- **Bottom navbar** (on home, gems, social, log): Gems (left) | Generate/+ button (center, elevated FAB) | Social (right)
- **Log**: accessed from home header (list icon, top left)
- **Settings**: accessed from home/gems/social header (gear/person icon, top right)

The settings page has no bottom navbar (secondary page). Log has the bottom navbar but no active tab highlighted.

## Key Patterns

- **Rendering**: `ui.js` owns all DOM writes. Page files wire events and call into `ui.js`, `quests.js`, `api.js`.
- **State**: Always mutate via `state.js` functions, then call `saveState()`. Never write to localStorage directly.
- **Auth state**: Stored in `localStorage` under `jhbsq_user` key. `getAuthUser()` / `setAuthUser()` in `supabase.js`. Also call `refreshSession()` on page load to re-validate Supabase session.
- **Adaptive weights**: `adaptWeights(category)` in `state.js` — called by `toggleComplete()` when marking a quest done.
- **Prompt building**: `buildPrompt(category, maxDistance, recent, location)` in `api.js`. Per-category rules live in `buildCategoryRule(category)`.
- **Mapbox token / Supabase config**: Exposed as globals from `js/env.js`. Set via Vercel environment variables. For local dev, edit `js/env.js` manually (do not commit). Location autocomplete is silently disabled when `MAPBOX_TOKEN` is empty. Supabase features degrade gracefully when `SUPABASE_URL`/`SUPABASE_ANON_KEY` are empty.
- **Photo uploads**: All uploads go through `uploadPhoto(bucket, file, path)` in `supabase.js`. Images are canvas-compressed to max 800px / JPEG 70% before upload. Storage bucket: `quest-photos` (public).
- **Nearby gems filter**: bounding-box pre-filter via Supabase query (±latDelta/lngDelta), then precise Haversine filter in JS for ≤250km.

## Supabase Tables (prefix: `jq_`)

| Table | Purpose |
|---|---|
| `jq_profiles` | User profiles — linked to `auth.users(id)`, stores `username`, `name`, `avatar_url` |
| `jq_shared_quests` | Publicly shared completed quests — `user_id`, `title`, `description`, `category`, `photo_url` |
| `jq_comments` | Comments on shared quests — `quest_id`, `user_id`, `text` |
| `jq_local_gems` | User-submitted local gems — `user_id`, `title`, `description`, `photo_url`, `lat`, `lng` |
| `jq_friends` | Friend connections — `user_id`, `friend_id`, `status` |

All tables have RLS enabled. See SQL setup instructions for policies.

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

Auth user cached separately under `jhbsq_user` — `{ id, email, username, name, avatar_url }`.

Quest shape: `{ id, title, objective, description, best_time, category, difficulty, cost, completed, weightCounted, createdAt, custom? }`

## Categories

Ten categories defined in `config.js`. Weights clamped to [0.01, 0.97].

| Key | Emoji | Label |
|---|---|---|
| `In-Home/Chill` | 🛋️ | Chill |
| `Urban Explorer` | 🏙️ | Urban |
| `Nature & Adventure` | 🌿 | Nature |
| `Skills & Craft` | 🛠️ | Skills |
| `Physical Challenges` | 🏃 | Challenges |
| `Exploration & Navigation` | 🗺️ | Exploration |
| `Social Experiments` | 🗣️ | Social |
| `Creative & Media` | 🎨 | Creativity |
| `Comfort Zone` | 🧘 | Comfort Zone |
| `Local Gems` | 💎 | Local Gems |

`Local Gems` is also the AI category for the Gems page generator.

## Doc Maintenance

After any change that affects project structure, features, state schema, API integration, categories, or patterns:
- Update **README.md** if the change affects setup, features, file structure, state, or categories.
- Update **CLAUDE.md** if the change affects the file map, key patterns, API details, schema, or project rules.

Do this as part of the same task, not as a separate step.

## Service Worker

`sw.js` is registered from `home.js`. Cache version: `sq-v21`. Supabase API calls are excluded from caching in addition to Groq.

**When modifying any cached file** (HTML, CSS, JS), bump `CACHE` in `sw.js`:
```js
const CACHE = 'sq-v21'; // increment each time cached files change
```

## Do Not

- Do not introduce a build system or bundler beyond the single `scripts/inject-env.js` step.
- Do not add a backend — this is intentionally a static/client-only app (Supabase is BaaS, not a custom backend).
- Do not store the Groq API key anywhere except `localStorage`.
- Do not store `MAPBOX_TOKEN`, `SUPABASE_URL`, or `SUPABASE_ANON_KEY` in `localStorage` — they live in `js/env.js` via Vercel env vars.
- Do not push to GitHub without explicit per-session instruction.
