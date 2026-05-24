let selectedCategories = []; // empty = random from all
let selectedGroupSize = 'solo';

document.getElementById('generateBtn').onclick = () => generateQuest(selectedCategories.slice(), selectedGroupSize);

document.getElementById('groupSizeSelect').onchange = (e) => { selectedGroupSize = e.target.value; };

document.getElementById('settingsBtn').onclick = () => {
  document.getElementById('apiKeyInput').value = state.apiKey || '';
  document.getElementById('locationInput').value = state.location || DEFAULT_LOCATION;
  document.getElementById('maxDistanceInput').value = String(state.maxDistance || DEFAULT_MAX_DISTANCE);
  openModal('settingsModal');
};
document.getElementById('closeSettingsBtn').onclick = () => {
  closeModal('settingsModal');
  document.getElementById('locationSuggestions').classList.add('hidden');
};
document.getElementById('saveKeyBtn').onclick = () => {
  state.apiKey = document.getElementById('apiKeyInput').value.trim();
  const loc = document.getElementById('locationInput').value.trim();
  state.location = loc || DEFAULT_LOCATION;
  const chosen = parseInt(document.getElementById('maxDistanceInput').value, 10);
  state.maxDistance = DISTANCE_OPTIONS.includes(chosen) ? chosen : DEFAULT_MAX_DISTANCE;
  saveState();
  _updateCityTagline();
  closeModal('settingsModal');
  hideError();
};

document.getElementById('settingsModal').addEventListener('click', (e) => {
  if (e.target.id === 'settingsModal') {
    closeModal('settingsModal');
    document.getElementById('locationSuggestions').classList.add('hidden');
  }
});

// --- Category checklist grid ---

function _renderCategoryGrid() {
  const grid = document.getElementById('catGrid');
  if (!grid) return;
  const total = CATEGORIES.length;

  grid.innerHTML = CATEGORIES.map((cat, i) => {
    const m = CATEGORY_META[cat];
    const lone = (total % 3 !== 0) && (i === total - 1);
    return `<button class="cat-check-btn${lone ? ' col-span-3' : ''}" data-cat="${escapeHtml(cat)}">${m.emoji} ${escapeHtml(m.label || cat)}</button>`;
  }).join('');

  grid.querySelectorAll('.cat-check-btn').forEach(btn => {
    btn.onclick = () => {
      const cat = btn.dataset.cat;
      const idx = selectedCategories.indexOf(cat);
      if (idx === -1) {
        selectedCategories.push(cat);
        const m = CATEGORY_META[cat];
        btn.style.background = m.bg;
        btn.style.borderColor = m.color;
        btn.style.color = m.color;
      } else {
        selectedCategories.splice(idx, 1);
        btn.style.background = '';
        btn.style.borderColor = '';
        btn.style.color = '';
      }
    };
  });
}

// --- Mapbox location autocomplete ---
let _locDebounce = null;

document.getElementById('locationInput').addEventListener('input', (e) => {
  const q = e.target.value.trim();
  if (!MAPBOX_TOKEN || q.length < 2) {
    document.getElementById('locationSuggestions').classList.add('hidden');
    return;
  }
  clearTimeout(_locDebounce);
  _locDebounce = setTimeout(() => _fetchLocationSuggestions(q), 300);
});

document.getElementById('locationInput').addEventListener('blur', () => {
  setTimeout(() => document.getElementById('locationSuggestions').classList.add('hidden'), 150);
});

async function _fetchLocationSuggestions(query) {
  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&autocomplete=true&types=place,locality,neighborhood,district&limit=5`;
    const res = await fetch(url);
    if (!res.ok) return;
    const data = await res.json();
    _renderLocationSuggestions(data.features || []);
  } catch (_) {}
}

function _renderLocationSuggestions(features) {
  const box = document.getElementById('locationSuggestions');
  if (!features.length) { box.classList.add('hidden'); return; }
  box.innerHTML = features.map((f, i) =>
    `<button type="button" data-idx="${i}" class="w-full text-left px-3 py-2.5 text-sm text-slate-200 hover:bg-slate-600/70 border-b border-slate-600/40 last:border-0 transition-colors">
      <span class="font-medium block">${escapeHtml(f.text)}</span>
      <span class="text-slate-400 text-[11px] block truncate">${escapeHtml(f.place_name)}</span>
    </button>`
  ).join('');
  box.classList.remove('hidden');
  box.querySelectorAll('button').forEach((btn, i) => {
    btn.onmousedown = (e) => {
      e.preventDefault();
      document.getElementById('locationInput').value = features[i].place_name;
      box.classList.add('hidden');
    };
  });
}

// --- Current location ---

document.getElementById('useCurrentLocationBtn').onclick = async () => {
  const btn = document.getElementById('useCurrentLocationBtn');
  if (!navigator.geolocation) return;
  btn.disabled = true;
  btn.style.color = '#10b981';
  try {
    const pos = await new Promise((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 })
    );
    const { latitude: lat, longitude: lng } = pos.coords;
    const input = document.getElementById('locationInput');

    if (MAPBOX_TOKEN) {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&types=neighborhood,locality,place&limit=1`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const name = data.features?.[0]?.place_name;
        if (name) { input.value = name; btn.disabled = false; btn.style.color = ''; return; }
      }
    }

    // Fallback: OpenStreetMap Nominatim
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=14`);
    if (res.ok) {
      const data = await res.json();
      const a = data.address || {};
      const parts = [a.suburb || a.neighbourhood || a.village || a.town, a.city || a.county, a.country].filter(Boolean);
      if (parts.length) { input.value = parts.join(', '); }
    }
  } catch (_) {}
  btn.disabled = false;
  btn.style.color = '';
};

function _updateCityTagline() {
  const el = document.getElementById('discoverTagline');
  if (!el) return;
  const city = (state.location || DEFAULT_LOCATION).split(',')[0].trim();
  el.textContent = 'Discover ' + city;
}

renderQuestCard();
_updateCityTagline();
_renderCategoryGrid();

const _splash = document.getElementById('splash');
if (_splash) { _splash.classList.add('out'); setTimeout(() => _splash.remove(), 400); }

if ('serviceWorker' in navigator) navigator.serviceWorker.register('../sw.js');
