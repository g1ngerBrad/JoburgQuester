const STORAGE_KEY = 'jhbsq_v1';

const CATEGORIES = ['In-Home/Chill', 'Urban Explorer', 'Nature & Adventure', 'Culture & History'];

const DEFAULT_WEIGHTS = {
  'In-Home/Chill': 0.25,
  'Urban Explorer': 0.25,
  'Nature & Adventure': 0.25,
  'Culture & History': 0.25
};

const CATEGORY_META = {
  'In-Home/Chill':      { color: '#38bdf8', bg: 'rgba(14,165,233,0.14)', emoji: '🛋️' },
  'Urban Explorer':     { color: '#fbbf24', bg: 'rgba(245,158,11,0.14)', emoji: '🏙️' },
  'Nature & Adventure': { color: '#a3e635', bg: 'rgba(132,204,22,0.14)', emoji: '🌿' },
  'Culture & History':  { color: '#a78bfa', bg: 'rgba(139,92,246,0.14)', emoji: '🏛️' }
};

const DIFFICULTY_META = {
  'Simple':   { color: '#34d399', bg: 'rgba(16,185,129,0.14)' },
  'Moderate': { color: '#fbbf24', bg: 'rgba(245,158,11,0.14)' },
  'Complex':  { color: '#fb7185', bg: 'rgba(244,63,94,0.14)' }
};

const COST_META = {
  'Free':  { color: '#34d399', bg: 'rgba(16,185,129,0.14)' },
  'Cheap': { color: '#38bdf8', bg: 'rgba(14,165,233,0.14)' }
};

const DISTANCE_OPTIONS = [5, 10, 25, 50, 100, 250];
const DEFAULT_MAX_DISTANCE = 25;

const LOADING_MESSAGES = [
  'Scouting Joburg…',
  'Asking the locals…',
  'Checking the koppies…',
  'Tuning into the city…',
  'Brewing something fresh…'
];
