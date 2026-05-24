let selectedCategories = []; // empty = random from all
let selectedGroupSize = 'solo';

document.getElementById('generateBtn').onclick = () => generateQuest(selectedCategories.slice(), selectedGroupSize);

document.getElementById('groupSizeSelect').onchange = (e) => { selectedGroupSize = e.target.value; };

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
