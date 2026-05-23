function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
}

function badge(label, meta) {
  return `<span class="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full" style="background:${meta.bg};color:${meta.color}">${label}</span>`;
}

function renderQuestCard() {
  const card = document.getElementById('questCard');
  if (!card) return;
  const hint = document.getElementById('emptyHint');
  const q = state.activeQuest;
  if (!q) {
    card.classList.add('hidden');
    card.innerHTML = '';
    hint.classList.remove('hidden');
    return;
  }
  hint.classList.add('hidden');
  const cat = CATEGORY_META[q.category] || CATEGORY_META['Urban Explorer'];
  const diff = DIFFICULTY_META[q.difficulty] || DIFFICULTY_META['Simple'];
  const cost = COST_META[q.cost] || COST_META['Free'];

  card.className = 'fade-up rounded-2xl p-5 border border-slate-700/60 relative overflow-hidden';
  card.style.background = 'linear-gradient(155deg, rgba(30,41,59,0.95) 0%, rgba(15,23,42,0.95) 100%)';
  card.innerHTML = `
    <div class="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl pointer-events-none" style="background:${cat.color}22"></div>
    <div class="relative">
      <div class="flex items-center justify-between mb-3">
        ${badge(cat.emoji + ' ' + q.category, cat)}
        <button class="icon-btn -mr-2" data-action="delete-active" aria-label="Dismiss">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <h3 class="text-[19px] font-bold leading-tight mb-2 ${q.completed ? 'strike-line text-slate-400' : ''}">${escapeHtml(q.title)}</h3>
      <p class="text-[14px] text-slate-300 leading-relaxed mb-4 ${q.completed ? 'opacity-60' : ''}">${escapeHtml(q.description)}</p>
      <div class="flex items-center gap-2 mb-4">
        ${badge(q.difficulty, diff)}
        ${badge(q.cost, cost)}
      </div>
      <button data-action="toggle-active" class="${q.completed ? 'btn-ghost' : 'btn-primary'} w-full flex items-center justify-center gap-2">
        ${q.completed
          ? `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9"/><polyline points="3 4 3 10 9 10"/></svg> Undo Complete`
          : `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Mark Complete`}
      </button>
    </div>
  `;
  card.classList.remove('hidden');

  card.querySelector('[data-action="delete-active"]').onclick = () => {
    state.activeQuest = null;
    saveState();
    renderQuestCard();
  };
  card.querySelector('[data-action="toggle-active"]').onclick = () => toggleComplete(q.id);
}

function renderLog() {
  const list = document.getElementById('logList');
  if (!list) return;
  if (!state.questHistory.length) {
    list.innerHTML = `
      <div class="text-center py-16 px-6">
        <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-800 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11H3v10h6V11zM21 11h-6v10h6V11zM15 3H9v18h6V3z"/></svg>
        </div>
        <p class="text-slate-300 font-medium mb-1">No quests yet</p>
        <p class="text-slate-500 text-sm">Generate one or add your own.</p>
      </div>`;
    return;
  }
  list.innerHTML = state.questHistory.map(q => {
    const cat = CATEGORY_META[q.category] || CATEGORY_META['Urban Explorer'];
    return `
      <div class="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-3.5 flex items-start gap-3 fade-up">
        <input type="checkbox" class="qcheck mt-0.5" data-toggle="${q.id}" ${q.completed ? 'checked' : ''}>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-1.5 mb-1 flex-wrap">
            <span class="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full" style="background:${cat.bg};color:${cat.color}">${cat.emoji} ${q.category}</span>
            ${q.custom ? `<span class="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-700/60 text-slate-400">Custom</span>` : ''}
          </div>
          <p class="text-[14px] font-semibold leading-snug ${q.completed ? 'strike-line text-slate-400' : 'text-slate-100'}">${escapeHtml(q.title)}</p>
          <p class="text-[12px] text-slate-400 leading-snug mt-0.5 line-clamp-2 ${q.completed ? 'opacity-60' : ''}">${escapeHtml(q.description)}</p>
          <div class="flex items-center gap-1.5 mt-2">
            <span class="text-[10px] text-slate-500">${q.difficulty} · ${q.cost}</span>
          </div>
        </div>
        <button data-delete="${q.id}" class="icon-btn !w-9 !h-9 text-slate-500 hover:text-rose-400" aria-label="Delete">
          <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </div>`;
  }).join('');

  list.querySelectorAll('[data-toggle]').forEach(el => {
    el.onchange = () => toggleComplete(el.dataset.toggle);
  });
  list.querySelectorAll('[data-delete]').forEach(el => {
    el.onclick = () => deleteQuest(el.dataset.delete);
  });
}

let loadingInterval = null;
function setLoading(on) {
  const el = document.getElementById('loadingState');
  const btn = document.getElementById('generateBtn');
  if (on) {
    el.classList.remove('hidden');
    btn.disabled = true;
    btn.style.opacity = '0.65';
  } else {
    el.classList.add('hidden');
    btn.disabled = false;
    btn.style.opacity = '';
    if (loadingInterval) { clearInterval(loadingInterval); loadingInterval = null; }
  }
}

function cycleLoadingText() {
  let i = 0;
  const txt = document.getElementById('loadingText');
  txt.textContent = LOADING_MESSAGES[0];
  if (loadingInterval) clearInterval(loadingInterval);
  loadingInterval = setInterval(() => {
    i = (i + 1) % LOADING_MESSAGES.length;
    txt.textContent = LOADING_MESSAGES[i];
  }, 1400);
}

function showError(msg) {
  const box = document.getElementById('errorBox');
  document.getElementById('errorText').textContent = msg;
  box.classList.remove('hidden');
}

function hideError() {
  document.getElementById('errorBox').classList.add('hidden');
}

function openModal(id) {
  document.getElementById(id).classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
  document.body.style.overflow = '';
}
