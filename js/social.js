let _socialUser = getAuthUser();
let _pendingSharePhoto = null;
let _selectedQuestId = null;
let _activeCommentQuestId = null;

// ── Feed ──

async function _loadFeed() {
  const feed = document.getElementById('socialFeed');
  const db = getDb();
  if (!db) {
    feed.innerHTML = `<div class="text-center py-16 px-6">
      <p class="text-slate-400 font-medium mb-2">Supabase not configured</p>
      <p class="text-slate-500 text-sm">Add your Supabase credentials in Settings to enable the social feed.</p>
      <a href="settings.html" class="mt-4 inline-block text-sm font-semibold text-pink-400 underline underline-offset-2">Go to Settings</a>
    </div>`;
    return;
  }

  feed.innerHTML = '<p class="text-slate-500 text-sm text-center py-8">Loading…</p>';

  const { data, error } = await db
    .from('jq_shared_quests')
    .select('*, jq_profiles(username, name, avatar_url), jq_comments(count)')
    .order('created_at', { ascending: false })
    .limit(40);

  if (error) {
    feed.innerHTML = `<p class="text-rose-400 text-sm text-center py-4">${escapeHtml(error.message)}</p>`;
    return;
  }

  if (!data || !data.length) {
    feed.innerHTML = `<div class="text-center py-16 px-6">
      <div class="w-14 h-14 mx-auto mb-4 rounded-2xl bg-slate-800 flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
      </div>
      <p class="text-slate-300 font-medium mb-1">No quests shared yet</p>
      <p class="text-slate-500 text-sm">Be the first to share a completed quest!</p>
    </div>`;
    return;
  }

  feed.innerHTML = data.map(q => {
    const catMeta = CATEGORY_META[q.category] || CATEGORY_META['Urban Explorer'];
    const commentCount = q.jq_comments?.[0]?.count ?? 0;
    const username = q.jq_profiles?.username || 'anonymous';
    const timeAgo = _timeAgo(q.created_at);
    const isOwn = _socialUser && q.user_id === _socialUser.id;

    return `
    <div class="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden fade-up" data-quest-id="${escapeHtml(q.id)}">
      ${q.photo_url ? `<img src="${escapeHtml(q.photo_url)}" class="w-full h-52 object-cover" alt="" loading="lazy">` : ''}
      <div class="p-4">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold" style="color:#ec4899">${escapeHtml(username[0].toUpperCase())}</div>
            <div>
              <span class="text-[13px] font-semibold">@${escapeHtml(username)}</span>
              <span class="text-[11px] text-slate-500 ml-1.5">${escapeHtml(timeAgo)}</span>
            </div>
          </div>
          ${isOwn ? `<button class="text-xs text-rose-400 underline underline-offset-2" data-delete-shared="${escapeHtml(q.id)}">Delete</button>` : ''}
        </div>
        <span class="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full mb-2" style="background:${catMeta.bg};color:${catMeta.color}">${catMeta.emoji} ${escapeHtml(q.category)}</span>
        <h3 class="font-semibold text-slate-100 mb-1">${escapeHtml(q.title)}</h3>
        ${q.description ? `<p class="text-[13px] text-slate-400 leading-relaxed">${escapeHtml(q.description)}</p>` : ''}
        <button class="mt-3 flex items-center gap-1.5 text-[12px] text-slate-400 active:text-pink-400 transition-colors" data-open-comments="${escapeHtml(q.id)}">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          ${commentCount} comment${commentCount !== 1 ? 's' : ''}
        </button>
      </div>
    </div>`;
  }).join('');

  feed.querySelectorAll('[data-open-comments]').forEach(btn => {
    btn.onclick = () => _openComments(btn.dataset.openComments);
  });
  feed.querySelectorAll('[data-delete-shared]').forEach(btn => {
    btn.onclick = () => _deleteShared(btn.dataset.deleteShared);
  });
}

async function _deleteShared(id) {
  if (!confirm('Remove this shared quest?')) return;
  const db = getDb();
  if (!db || !_socialUser) return;
  await db.from('jq_shared_quests').delete().eq('id', id).eq('user_id', _socialUser.id);
  _loadFeed();
}

// ── Comments ──

async function _openComments(questId) {
  _activeCommentQuestId = questId;
  openModal('commentsModal');
  await _loadComments(questId);
}

async function _loadComments(questId) {
  const list = document.getElementById('commentsList');
  const db = getDb();
  if (!db) { list.innerHTML = '<p class="text-slate-500 text-sm">Supabase not configured.</p>'; return; }

  list.innerHTML = '<p class="text-slate-500 text-sm">Loading…</p>';
  const { data, error } = await db
    .from('jq_comments')
    .select('*, jq_profiles(username)')
    .eq('quest_id', questId)
    .order('created_at', { ascending: true });

  if (error) { list.innerHTML = `<p class="text-rose-400 text-sm">${escapeHtml(error.message)}</p>`; return; }

  if (!data || !data.length) {
    list.innerHTML = '<p class="text-slate-500 text-sm text-center py-6">No comments yet. Be the first!</p>';
    return;
  }

  list.innerHTML = data.map(c => {
    const username = c.jq_profiles?.username || 'anonymous';
    const isOwn = _socialUser && c.user_id === _socialUser.id;
    return `<div class="flex gap-2">
      <div class="w-7 h-7 rounded-full bg-slate-700 flex-shrink-0 flex items-center justify-center text-xs font-bold" style="color:#ec4899">${escapeHtml(username[0].toUpperCase())}</div>
      <div class="flex-1">
        <div class="flex items-baseline gap-2">
          <span class="text-[12px] font-semibold">@${escapeHtml(username)}</span>
          <span class="text-[10px] text-slate-500">${_timeAgo(c.created_at)}</span>
          ${isOwn ? `<button class="text-[10px] text-rose-400" data-delete-comment="${escapeHtml(c.id)}">delete</button>` : ''}
        </div>
        <p class="text-[13px] text-slate-300 leading-snug">${escapeHtml(c.text)}</p>
      </div>
    </div>`;
  }).join('');

  list.querySelectorAll('[data-delete-comment]').forEach(btn => {
    btn.onclick = async () => {
      const db2 = getDb();
      if (!db2) return;
      await db2.from('jq_comments').delete().eq('id', btn.dataset.deleteComment).eq('user_id', _socialUser.id);
      _loadComments(questId);
    };
  });
}

document.getElementById('submitCommentBtn').onclick = async () => {
  const text = document.getElementById('commentInput').value.trim();
  if (!text) return;
  if (!_socialUser) { alert('Sign in to comment.'); return; }
  const db = getDb();
  if (!db) return;
  const { error } = await db.from('jq_comments').insert({
    quest_id: _activeCommentQuestId,
    user_id: _socialUser.id,
    text
  });
  if (error) { alert(error.message); return; }
  document.getElementById('commentInput').value = '';
  _loadComments(_activeCommentQuestId);
  _loadFeed();
};

document.getElementById('commentInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); document.getElementById('submitCommentBtn').click(); }
});

document.getElementById('closeCommentsBtn').onclick = () => closeModal('commentsModal');
document.getElementById('commentsModal').addEventListener('click', (e) => {
  if (e.target.id === 'commentsModal') closeModal('commentsModal');
});

// ── Share Quest ──

document.getElementById('shareQuestFab').onclick = () => {
  if (!_socialUser) { window.location.href = 'settings.html'; return; }
  _populateQuestPicker();
  openModal('shareModal');
};

function _populateQuestPicker() {
  const picker = document.getElementById('shareQuestPicker');
  const completed = (state.questHistory || []).filter(q => q.completed);
  _selectedQuestId = null;
  document.getElementById('shareSelected').classList.add('hidden');

  if (!completed.length) {
    picker.innerHTML = '<p class="text-slate-500 text-sm text-center py-4">No completed quests yet.</p>';
    return;
  }

  picker.innerHTML = completed.map(q => {
    const cat = CATEGORY_META[q.category] || CATEGORY_META['Urban Explorer'];
    return `<button class="w-full text-left p-3 rounded-xl border border-slate-600/40 bg-slate-700/40 transition active:bg-slate-700" data-pick-quest="${escapeHtml(q.id)}">
      <span class="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full mb-1" style="background:${cat.bg};color:${cat.color}">${cat.emoji} ${escapeHtml(q.category)}</span>
      <p class="text-[13px] font-semibold text-slate-200">${escapeHtml(q.title)}</p>
    </button>`;
  }).join('');

  picker.querySelectorAll('[data-pick-quest]').forEach(btn => {
    btn.onclick = () => {
      picker.querySelectorAll('button').forEach(b => b.style.borderColor = '');
      btn.style.borderColor = '#ec4899';
      _selectedQuestId = btn.dataset.pickQuest;
      const q = completed.find(x => x.id === _selectedQuestId);
      if (q) {
        document.getElementById('shareSelectedTitle').textContent = q.title;
        document.getElementById('shareSelected').classList.remove('hidden');
      }
    };
  });
}

document.getElementById('sharePhotoInput').onchange = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  _pendingSharePhoto = file;
  const preview = document.getElementById('sharePhotoPreview');
  preview.src = URL.createObjectURL(file);
  preview.classList.remove('hidden');
};

document.getElementById('submitShareBtn').onclick = async () => {
  if (!_selectedQuestId) { alert('Select a quest to share.'); return; }
  const db = getDb();
  if (!db || !_socialUser) return;

  const q = (state.questHistory || []).find(x => x.id === _selectedQuestId);
  if (!q) return;

  const btn = document.getElementById('submitShareBtn');
  btn.disabled = true;
  btn.textContent = 'Sharing…';

  try {
    let photo_url = null;
    if (_pendingSharePhoto) {
      photo_url = await uploadPhoto('quest-photos', _pendingSharePhoto, `shared/${_socialUser.id}/${Date.now()}.jpg`);
    }
    const { error } = await db.from('jq_shared_quests').insert({
      user_id: _socialUser.id,
      title: q.title,
      description: q.description,
      category: q.category,
      photo_url
    });
    if (error) throw error;

    closeModal('shareModal');
    _pendingSharePhoto = null;
    _selectedQuestId = null;
    document.getElementById('sharePhotoInput').value = '';
    document.getElementById('sharePhotoPreview').classList.add('hidden');
    document.getElementById('shareSelected').classList.add('hidden');
    _loadFeed();
  } catch (err) {
    alert('Error sharing: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Share';
  }
};

document.getElementById('closeShareBtn').onclick = () => closeModal('shareModal');
document.getElementById('shareModal').addEventListener('click', (e) => {
  if (e.target.id === 'shareModal') closeModal('shareModal');
});

// ── Helpers ──

function _timeAgo(ts) {
  if (!ts) return '';
  const secs = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (secs < 60) return 'just now';
  if (secs < 3600) return Math.floor(secs / 60) + 'm ago';
  if (secs < 86400) return Math.floor(secs / 3600) + 'h ago';
  return Math.floor(secs / 86400) + 'd ago';
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

function openModal(id) { document.getElementById(id).classList.remove('hidden'); document.body.style.overflow = 'hidden'; }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); document.body.style.overflow = ''; }

// ── Init ──
_loadFeed();

const _splash = document.getElementById('splash');
if (_splash) { _splash.classList.add('out'); setTimeout(() => _splash.remove(), 400); }
