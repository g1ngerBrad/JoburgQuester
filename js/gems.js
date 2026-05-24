let _gemsUser = getAuthUser();
let _activeTab = 'mine';
let _pendingGemPhoto = null;

// ── AI gem quest generation (reuses api.js/quests.js/ui.js) ──

document.getElementById('generateGemBtn').onclick = async () => {
  if (!state.apiKey) {
    document.getElementById('gemErrorBox').textContent = 'Add your Groq API key in Settings first.';
    document.getElementById('gemErrorBox').classList.remove('hidden');
    return;
  }
  document.getElementById('gemErrorBox').classList.add('hidden');
  document.getElementById('gemLoadingState').classList.remove('hidden');
  document.getElementById('generateGemBtn').disabled = true;
  try {
    await generateQuest(['Local Gems'], 'solo');
    _renderGemQuestCard();
  } catch (err) {
    document.getElementById('gemErrorBox').textContent = err.message || 'Generation failed.';
    document.getElementById('gemErrorBox').classList.remove('hidden');
  } finally {
    document.getElementById('gemLoadingState').classList.add('hidden');
    document.getElementById('generateGemBtn').disabled = false;
  }
};

function _renderGemQuestCard() {
  const card = document.getElementById('gemQuestCard');
  const q = state.activeQuest;
  if (!q || q.category !== 'Local Gems') { card.classList.add('hidden'); return; }
  const cat = CATEGORY_META['Local Gems'];
  card.className = 'fade-up rounded-2xl p-4 border border-cyan-500/30 relative overflow-hidden mb-1';
  card.style.background = 'linear-gradient(155deg,rgba(30,41,59,0.95) 0%,rgba(15,23,42,0.95) 100%)';
  card.innerHTML = `
    <div class="absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl pointer-events-none" style="background:#22d3ee22"></div>
    <div class="relative">
      <div class="flex items-center justify-between mb-2">
        <span class="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full" style="background:${cat.bg};color:${cat.color}">${cat.emoji} Local Gem</span>
        <button class="icon-btn -mr-2" id="dismissGemQuest" aria-label="Dismiss">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <h3 class="text-[17px] font-bold leading-tight mb-2">${escapeHtml(q.title)}</h3>
      ${q.objective ? `<p class="text-[12px] text-slate-400 mb-2">${escapeHtml(q.objective)}</p>` : ''}
      <p class="text-[13px] text-slate-300 leading-relaxed">${escapeHtml(q.description)}</p>
    </div>`;
  card.classList.remove('hidden');
  document.getElementById('dismissGemQuest').onclick = () => {
    state.activeQuest = null;
    saveState();
    card.classList.add('hidden');
  };
}

// ── Tabs ──

document.getElementById('tabMine').onclick = () => _setTab('mine');
document.getElementById('tabFound').onclick = () => _setTab('found');

function _setTab(tab) {
  _activeTab = tab;
  document.getElementById('tabMine').classList.toggle('active', tab === 'mine');
  document.getElementById('tabFound').classList.toggle('active', tab === 'found');
  document.getElementById('myGemsSection').classList.toggle('hidden', tab !== 'mine');
  document.getElementById('foundGemsSection').classList.toggle('hidden', tab !== 'found');
  if (tab === 'mine') _loadMyGems();
  else _loadFoundGems();
}

// ── My Gems ──

async function _loadMyGems() {
  const list = document.getElementById('myGemsList');
  if (!_gemsUser) {
    list.innerHTML = _loginPrompt('view your gems');
    return;
  }
  const db = getDb();
  if (!db) { list.innerHTML = _supabasePrompt(); return; }
  list.innerHTML = '<p class="text-slate-500 text-sm text-center py-8">Loading…</p>';
  const { data, error } = await db.from('jq_local_gems')
    .select('*').eq('user_id', _gemsUser.id).order('created_at', { ascending: false });
  if (error) { list.innerHTML = `<p class="text-rose-400 text-sm text-center py-4">${escapeHtml(error.message)}</p>`; return; }
  _renderGemCards(list, data || [], true);
}

// ── Found Nearby ──

async function _loadFoundGems() {
  const list = document.getElementById('foundGemsList');
  const db = getDb();
  if (!db) { list.innerHTML = _supabasePrompt(); return; }
  list.innerHTML = '<p class="text-slate-500 text-sm text-center py-8">Looking nearby…</p>';

  const coords = await getBrowserCoords();
  let query = db.from('jq_local_gems')
    .select('*, jq_profiles(username, avatar_url)')
    .order('created_at', { ascending: false })
    .limit(60);

  if (_gemsUser) query = query.neq('user_id', _gemsUser.id);

  if (coords) {
    const latD = 250 / 111;
    const lngD = 250 / (111 * Math.cos(coords.lat * Math.PI / 180));
    query = query
      .gte('lat', coords.lat - latD).lte('lat', coords.lat + latD)
      .gte('lng', coords.lng - lngD).lte('lng', coords.lng + lngD);
  }

  const { data, error } = await query;
  if (error) { list.innerHTML = `<p class="text-rose-400 text-sm text-center py-4">${escapeHtml(error.message)}</p>`; return; }

  let gems = data || [];
  if (coords) {
    gems = gems.filter(g => !g.lat || !g.lng || haversineKm(coords.lat, coords.lng, g.lat, g.lng) <= 250);
  }
  _renderGemCards(list, gems, false);
}

// ── Render ──

function _renderGemCards(container, gems, isMine) {
  if (!gems.length) {
    container.innerHTML = `<div class="text-center py-16 px-6">
      <div class="w-14 h-14 mx-auto mb-4 rounded-2xl bg-slate-800 flex items-center justify-center text-2xl">💎</div>
      <p class="text-slate-300 font-medium mb-1">${isMine ? 'No gems yet' : 'No gems nearby'}</p>
      <p class="text-slate-500 text-sm">${isMine ? 'Tap + to add your first local gem.' : 'Be the first to add one in your area.'}</p>
    </div>`;
    return;
  }
  container.innerHTML = gems.map(g => `
    <div class="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden fade-up">
      ${g.photo_url ? `<img src="${escapeHtml(g.photo_url)}" class="w-full h-44 object-cover" alt="" loading="lazy">` : ''}
      <div class="p-4">
        ${!isMine && g.jq_profiles ? `<p class="text-[11px] text-cyan-400/80 mb-1 font-medium">@${escapeHtml(g.jq_profiles.username || 'anonymous')}</p>` : ''}
        <h3 class="font-semibold text-slate-100 mb-1">${escapeHtml(g.title)}</h3>
        ${g.description ? `<p class="text-sm text-slate-400 leading-relaxed">${escapeHtml(g.description)}</p>` : ''}
        ${isMine ? `<button class="mt-3 text-xs text-rose-400 underline underline-offset-2" data-delete-gem="${escapeHtml(g.id)}">Delete</button>` : ''}
      </div>
    </div>`).join('');

  if (isMine) {
    container.querySelectorAll('[data-delete-gem]').forEach(btn => {
      btn.onclick = () => _deleteGem(btn.dataset.deleteGem);
    });
  }
}

async function _deleteGem(id) {
  if (!confirm('Delete this gem?')) return;
  const db = getDb();
  if (!db || !_gemsUser) return;
  await db.from('jq_local_gems').delete().eq('id', id).eq('user_id', _gemsUser.id);
  _loadMyGems();
}

// ── Add Gem Modal ──

document.getElementById('addGemBtn').onclick = () => {
  if (!_gemsUser) { window.location.href = 'settings.html'; return; }
  openModal('addGemModal');
};

document.getElementById('closeAddGemBtn').onclick = () => closeModal('addGemModal');

document.getElementById('addGemModal').addEventListener('click', (e) => {
  if (e.target.id === 'addGemModal') closeModal('addGemModal');
});

document.getElementById('gemPhotoInput').onchange = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  _pendingGemPhoto = file;
  const preview = document.getElementById('gemPhotoPreview');
  preview.src = URL.createObjectURL(file);
  preview.classList.remove('hidden');
};

document.getElementById('saveGemBtn').onclick = async () => {
  const title = document.getElementById('gemTitle').value.trim();
  if (!title) { alert('Please add a title.'); return; }
  const db = getDb();
  if (!db || !_gemsUser) return;

  const btn = document.getElementById('saveGemBtn');
  btn.disabled = true;
  btn.textContent = 'Saving…';

  try {
    const coords = await getBrowserCoords();
    let photo_url = null;
    if (_pendingGemPhoto) {
      photo_url = await uploadPhoto('quest-photos', _pendingGemPhoto, `gems/${_gemsUser.id}/${Date.now()}.jpg`);
    }
    const { error } = await db.from('jq_local_gems').insert({
      user_id: _gemsUser.id,
      title,
      description: document.getElementById('gemDesc').value.trim() || null,
      photo_url,
      lat: coords ? coords.lat : null,
      lng: coords ? coords.lng : null
    });
    if (error) throw error;

    closeModal('addGemModal');
    document.getElementById('gemTitle').value = '';
    document.getElementById('gemDesc').value = '';
    document.getElementById('gemPhotoPreview').classList.add('hidden');
    document.getElementById('gemPhotoInput').value = '';
    _pendingGemPhoto = null;
    _loadMyGems();
  } catch (err) {
    alert('Error saving gem: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Save Gem';
  }
};

// ── Helpers ──

function _loginPrompt(action) {
  return `<div class="text-center py-16 px-6">
    <div class="w-14 h-14 mx-auto mb-4 rounded-2xl bg-slate-800 flex items-center justify-center text-2xl">💎</div>
    <p class="text-slate-300 font-medium mb-1">Sign in to ${action}</p>
    <a href="settings.html" class="mt-3 inline-block text-sm font-semibold text-cyan-400 underline underline-offset-2">Go to Settings</a>
  </div>`;
}

function _supabasePrompt() {
  return `<div class="text-center py-16 px-6">
    <p class="text-slate-500 text-sm">Supabase not configured yet.</p>
    <a href="settings.html" class="mt-2 inline-block text-xs text-slate-400 underline underline-offset-2">Settings</a>
  </div>`;
}

// ── Init ──
_renderGemQuestCard();
_loadMyGems();

const _splash = document.getElementById('splash');
if (_splash) { _splash.classList.add('out'); setTimeout(() => _splash.remove(), 400); }
