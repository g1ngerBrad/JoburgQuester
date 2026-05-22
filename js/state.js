function defaultState() {
  return {
    apiKey: '',
    activeQuest: null,
    questHistory: [],
    categoryWeights: { ...DEFAULT_WEIGHTS },
    maxDistance: DEFAULT_MAX_DISTANCE
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return {
      apiKey: parsed.apiKey || '',
      activeQuest: parsed.activeQuest || null,
      questHistory: Array.isArray(parsed.questHistory) ? parsed.questHistory : [],
      categoryWeights: parsed.categoryWeights || { ...DEFAULT_WEIGHTS },
      maxDistance: DISTANCE_OPTIONS.includes(parsed.maxDistance) ? parsed.maxDistance : DEFAULT_MAX_DISTANCE
    };
  } catch (e) {
    return defaultState();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

let state = loadState();

function pickCategory() {
  const r = Math.random();
  let cum = 0;
  for (const cat of CATEGORIES) {
    cum += state.categoryWeights[cat] || 0;
    if (r <= cum) return cat;
  }
  return CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
}

function adaptWeights(category) {
  const BOOST = 0.15;
  const MIN = 0.02;
  const w = { ...state.categoryWeights };
  if (!(category in w)) return;
  w[category] = Math.min(0.94, (w[category] || 0) + BOOST);
  const others = CATEGORIES.filter(c => c !== category);
  const othersOldSum = others.reduce((s, k) => s + (w[k] || 0), 0);
  const othersTarget = Math.max(0.06, 1 - w[category]);
  if (othersOldSum > 0) {
    const ratio = othersTarget / othersOldSum;
    others.forEach(k => { w[k] = Math.max(MIN, (w[k] || 0) * ratio); });
  }
  const total = CATEGORIES.reduce((s, k) => s + w[k], 0);
  CATEGORIES.forEach(k => w[k] = w[k] / total);
  state.categoryWeights = w;
  saveState();
}
