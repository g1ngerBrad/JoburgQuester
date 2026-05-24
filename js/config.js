const STORAGE_KEY = 'jhbsq_v1';

const CATEGORIES = [
  'In-Home/Chill',
  'Urban Explorer',
  'Nature & Adventure',
  'Skills & Craft',
  'Physical Challenges',
  'Exploration & Navigation',
  'Social Experiments',
  'Creative & Media',
  'Comfort Zone'
];

const DEFAULT_WEIGHTS = {
  'In-Home/Chill':            0.111,
  'Urban Explorer':           0.111,
  'Nature & Adventure':       0.111,
  'Skills & Craft':           0.111,
  'Physical Challenges':      0.111,
  'Exploration & Navigation': 0.111,
  'Social Experiments':       0.111,
  'Creative & Media':         0.111,
  'Comfort Zone':             0.112
};

const CATEGORY_META = {
  'In-Home/Chill':            { color: '#38bdf8', bg: 'rgba(14,165,233,0.14)',  emoji: '🛋️', label: 'Chill' },
  'Urban Explorer':           { color: '#fbbf24', bg: 'rgba(245,158,11,0.14)',  emoji: '🏙️', label: 'Urban' },
  'Nature & Adventure':       { color: '#a3e635', bg: 'rgba(132,204,22,0.14)',  emoji: '🌿', label: 'Nature' },
  'Skills & Craft':           { color: '#f97316', bg: 'rgba(249,115,22,0.14)',  emoji: '🛠️', label: 'Skills' },
  'Physical Challenges':      { color: '#ef4444', bg: 'rgba(239,68,68,0.14)',   emoji: '🏃', label: 'Challenges' },
  'Exploration & Navigation': { color: '#8b5cf6', bg: 'rgba(139,92,246,0.14)', emoji: '🗺️', label: 'Exploration' },
  'Social Experiments':       { color: '#ec4899', bg: 'rgba(236,72,153,0.14)', emoji: '🗣️', label: 'Social' },
  'Creative & Media':         { color: '#14b8a6', bg: 'rgba(20,184,166,0.14)', emoji: '🎨', label: 'Creativity' },
  'Comfort Zone':             { color: '#a78bfa', bg: 'rgba(167,139,250,0.14)', emoji: '🧘', label: 'Comfort Zone' },
  'Local Gems':               { color: '#22d3ee', bg: 'rgba(34,211,238,0.14)',  emoji: '💎', label: 'Local Gems' }
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

const DEFAULT_LOCATION = 'Bryanston, Johannesburg';

const LOADING_MESSAGES = [
  'Scouting the area…',
  'Asking the locals…',
  'Checking the map…',
  'Tuning into the city…',
  'Brewing something fresh…'
];
