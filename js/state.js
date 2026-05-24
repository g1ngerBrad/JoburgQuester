function defaultState() {
  return {
    apiKey: '',
    location: DEFAULT_LOCATION,
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

    const storedWeights = parsed.categoryWeights || {};
    const categoryWeights = {};
    for (const cat of CATEGORIES) {
      categoryWeights[cat] = (typeof storedWeights[cat] === 'number')
        ? storedWeights[cat]
        : (DEFAULT_WEIGHTS[cat] || 1 / CATEGORIES.length);
    }
    const total = CATEGORIES.reduce((s, cat) => s + categoryWeights[cat], 0);
    CATEGORIES.forEach(cat => { categoryWeights[cat] = categoryWeights[cat] / total; });

    return {
      apiKey: parsed.apiKey || '',
      location: parsed.location || DEFAULT_LOCATION,
      activeQuest: parsed.activeQuest || null,
      questHistory: Array.isArray(parsed.questHistory) ? parsed.questHistory : [],
      categoryWeights,
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
  const BOOST = 0.012;
  const DRAIN = 0.002;
  const MIN = 0.01;
  const w = { ...state.categoryWeights };
  if (!(category in w)) return;
  w[category] = Math.min(0.90, (w[category] || 0) + BOOST);
  CATEGORIES.filter(c => c !== category).forEach(k => {
    w[k] = Math.max(MIN, (w[k] || 0) - DRAIN);
  });
  const total = CATEGORIES.reduce((s, k) => s + w[k], 0);
  CATEGORIES.forEach(k => { w[k] = w[k] / total; });
  state.categoryWeights = w;
  saveState();
}

function reverseWeights(category) {
  const BOOST = 0.012;
  const DRAIN = 0.002;
  const MIN = 0.01;
  const w = { ...state.categoryWeights };
  if (!(category in w)) return;
  w[category] = Math.max(MIN, (w[category] || 0) - BOOST);
  CATEGORIES.filter(c => c !== category).forEach(k => {
    w[k] = Math.min(0.90, (w[k] || 0) + DRAIN);
  });
  const total = CATEGORIES.reduce((s, k) => s + w[k], 0);
  CATEGORIES.forEach(k => { w[k] = w[k] / total; });
  state.categoryWeights = w;
  saveState();
}

function resetWeights() {
  state.categoryWeights = { ...DEFAULT_WEIGHTS };
  saveState();
}
