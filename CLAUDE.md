# CLAUDE.md — JoburgQuester

## Git

**Do not push to GitHub.** Commit locally only. Never run `git push` or create pull requests unless the user explicitly instructs it in that session.

## Project Summary

Mobile-first PWA. Generates AI side-quests for Johannesburg via the Groq API. No build step — vanilla JS + Tailwind CSS via CDN. All state in `localStorage` (`jhbsq_v1`).

## File Map

| File | Role |
|---|---|
| `js/config.js` | Category definitions, weights, constants |
| `js/state.js` | Load/save localStorage state, `adaptWeights()` |
| `js/api.js` | `generateQuest()`, `buildPrompt()`, Groq fetch |
| `js/quests.js` | `addCustomQuest()`, `deleteQuest()`, `toggleComplete()` |
| `js/ui.js` | All DOM rendering — cards, modals, log entries |
| `js/home.js` | Home page event listeners only |
| `js/log.js` | Log page event listeners only |
| `pages/home.html` | Quest generation view |
| `pages/log.html` | Quest history + custom quest modal |
| `styles/globals.css` | Shared styles, animations |
| `styles/index.css` | Home-page ring animations |
| `styles/log.css` | Log-page custom checkbox |

## Key Patterns

- **Rendering**: `ui.js` owns all DOM writes. Page files (`home.js`, `log.js`) wire events and call into `ui.js`, `quests.js`, `api.js`.
- **State**: Always mutate via `state.js` functions, then call `saveState()`. Never write to localStorage directly.
- **Adaptive weights**: `adaptWeights(category)` in `state.js` — called by `toggleComplete()` when marking a quest done.
- **Prompt building**: `buildPrompt(category, recentTitles, maxDistance)` in `api.js`. Safety rules are embedded in the prompt, not the UI.

## Groq API

- Endpoint: `https://api.groq.com/openai/v1/chat/completions`
- Model: `llama-3.3-70b-versatile`
- Response format: `json_object`
- Expected fields: `title`, `description`, `difficulty` (Simple/Moderate/Complex), `cost` (Free/Cheap)

## localStorage Schema (`jhbsq_v1`)

```js
{
  apiKey: string,
  activeQuest: Quest | null,
  questHistory: Quest[],
  categoryWeights: { [category]: number },
  maxDistance: 5 | 10 | 25 | 50 | 100 | 250
}
```

Quest shape: `{ id, title, description, category, difficulty, cost, completed, weightCounted, createdAt, custom? }`

## Categories

`IN_HOME`, `URBAN`, `NATURE`, `CULTURE` — defined in `config.js` with emoji, label, colour class, and default weight (0.25 each). Weights clamped to [0.02, 0.94].

## Doc Maintenance

After any change that affects project structure, features, state schema, API integration, categories, or patterns:
- Update **README.md** if the change affects setup, features, file structure, state, or categories (user-facing).
- Update **CLAUDE.md** if the change affects the file map, key patterns, API details, localStorage schema, or project rules (Claude-facing).

Do this as part of the same task, not as a separate step.

## Do Not

- Do not introduce a build system or bundler.
- Do not add a backend — this is intentionally a static/client-only app.
- Do not store the API key anywhere except `localStorage`.
- Do not push to GitHub without explicit per-session instruction.
