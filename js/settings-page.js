let _settingsUser = getAuthUser();
let _pendingAvatarFile = null;

// ── Auth Tab Toggle ──

document.getElementById('tabSignIn').onclick = () => _setAuthTab('signin');
document.getElementById('tabSignUp').onclick = () => _setAuthTab('signup');

function _setAuthTab(tab) {
  document.getElementById('tabSignIn').classList.toggle('active', tab === 'signin');
  document.getElementById('tabSignUp').classList.toggle('active', tab === 'signup');
  document.getElementById('signInPanel').classList.toggle('hidden', tab !== 'signin');
  document.getElementById('signUpPanel').classList.toggle('hidden', tab !== 'signup');
}

// ── Sign In ──

document.getElementById('signInBtn').onclick = async () => {
  const email = document.getElementById('signInEmail').value.trim();
  const password = document.getElementById('signInPassword').value;
  const errEl = document.getElementById('signInError');
  errEl.classList.add('hidden');

  if (!email || !password) { errEl.textContent = 'Email and password required.'; errEl.classList.remove('hidden'); return; }

  const btn = document.getElementById('signInBtn');
  btn.disabled = true; btn.textContent = 'Signing in…';

  try {
    _settingsUser = await authSignIn(email, password);
    _renderLoggedIn();
  } catch (err) {
    errEl.textContent = err.message || 'Sign in failed.';
    errEl.classList.remove('hidden');
  } finally {
    btn.disabled = false; btn.textContent = 'Sign In';
  }
};

// ── Sign Up ──

document.getElementById('signUpBtn').onclick = async () => {
  const name = document.getElementById('signUpName').value.trim();
  const username = document.getElementById('signUpUsername').value.trim().toLowerCase();
  const email = document.getElementById('signUpEmail').value.trim();
  const password = document.getElementById('signUpPassword').value;
  const errEl = document.getElementById('signUpError');
  const okEl = document.getElementById('signUpSuccess');
  errEl.classList.add('hidden'); okEl.classList.add('hidden');

  if (!name || !username || !email || !password) {
    errEl.textContent = 'All fields are required.'; errEl.classList.remove('hidden'); return;
  }
  if (password.length < 6) {
    errEl.textContent = 'Password must be at least 6 characters.'; errEl.classList.remove('hidden'); return;
  }
  if (!/^[a-z0-9_]+$/.test(username)) {
    errEl.textContent = 'Username: letters, numbers, underscores only.'; errEl.classList.remove('hidden'); return;
  }

  const btn = document.getElementById('signUpBtn');
  btn.disabled = true; btn.textContent = 'Creating account…';

  try {
    const result = await authSignUp(email, password, username, name);
    if (result.pendingConfirmation) {
      okEl.textContent = 'Account created! Check your email to confirm, then sign in.';
      okEl.classList.remove('hidden');
    } else {
      _settingsUser = result;
      okEl.textContent = 'Account created!';
      okEl.classList.remove('hidden');
      _renderLoggedIn();
    }
  } catch (err) {
    errEl.textContent = err.message || 'Sign up failed.';
    errEl.classList.remove('hidden');
  } finally {
    btn.disabled = false; btn.textContent = 'Create Account';
  }
};

// ── Profile View ──

function _renderLoggedIn() {
  if (!_settingsUser) { _renderLoggedOut(); return; }
  document.getElementById('authPanel').classList.add('hidden');
  document.getElementById('profilePanel').classList.remove('hidden');
  document.getElementById('friendsSection').classList.remove('hidden');

  document.getElementById('profileName').textContent = _settingsUser.name || '';
  document.getElementById('profileUsername').textContent = '@' + (_settingsUser.username || '');
  document.getElementById('editName').value = _settingsUser.name || '';
  document.getElementById('editUsername').value = _settingsUser.username || '';
  document.getElementById('avatarInitial').textContent = (_settingsUser.name || _settingsUser.username || '?')[0].toUpperCase();
  if (_settingsUser.avatar_url) {
    document.getElementById('avatarImg').src = _settingsUser.avatar_url;
    document.getElementById('avatarImg').classList.remove('hidden');
    document.getElementById('avatarInitial').classList.add('hidden');
  }
  _loadFriends();
}

function _renderLoggedOut() {
  document.getElementById('authPanel').classList.remove('hidden');
  document.getElementById('profilePanel').classList.add('hidden');
  document.getElementById('friendsSection').classList.add('hidden');
}

// ── Avatar Upload ──

document.getElementById('avatarBtn').onclick = () => document.getElementById('avatarInput').click();

document.getElementById('avatarInput').onchange = async (e) => {
  const file = e.target.files[0];
  if (!file || !_settingsUser) return;
  _pendingAvatarFile = file;
  const preview = document.getElementById('avatarImg');
  preview.src = URL.createObjectURL(file);
  preview.classList.remove('hidden');
  document.getElementById('avatarInitial').classList.add('hidden');

  try {
    const url = await uploadPhoto('quest-photos', file, `avatars/${_settingsUser.id}.jpg`);
    await updateProfile(_settingsUser.id, { avatar_url: url });
  } catch (err) {
    alert('Avatar upload failed: ' + err.message);
  }
};

// ── Save Profile ──

document.getElementById('saveProfileBtn').onclick = async () => {
  if (!_settingsUser) return;
  const name = document.getElementById('editName').value.trim();
  const username = document.getElementById('editUsername').value.trim().toLowerCase();
  const msgEl = document.getElementById('profileUpdateMsg');
  msgEl.classList.add('hidden');

  if (!name || !username) { msgEl.textContent = 'Name and username required.'; msgEl.style.color = '#f87171'; msgEl.classList.remove('hidden'); return; }

  const btn = document.getElementById('saveProfileBtn');
  btn.disabled = true; btn.textContent = 'Saving…';
  try {
    await updateProfile(_settingsUser.id, { name, username });
    document.getElementById('profileName').textContent = name;
    document.getElementById('profileUsername').textContent = '@' + username;
    msgEl.textContent = 'Profile updated.'; msgEl.style.color = '#34d399'; msgEl.classList.remove('hidden');
    setTimeout(() => msgEl.classList.add('hidden'), 3000);
  } catch (err) {
    msgEl.textContent = err.message; msgEl.style.color = '#f87171'; msgEl.classList.remove('hidden');
  } finally {
    btn.disabled = false; btn.textContent = 'Save Profile';
  }
};

// ── Change Password ──

document.getElementById('changePasswordBtn').onclick = async () => {
  const pwd = document.getElementById('newPassword').value;
  const msgEl = document.getElementById('pwMsg');
  if (pwd.length < 6) { msgEl.textContent = 'Min 6 characters.'; msgEl.style.color = '#f87171'; msgEl.classList.remove('hidden'); return; }
  const db = getDb();
  if (!db) return;
  const { error } = await db.auth.updateUser({ password: pwd });
  if (error) { msgEl.textContent = error.message; msgEl.style.color = '#f87171'; }
  else { msgEl.textContent = 'Password updated.'; msgEl.style.color = '#34d399'; document.getElementById('newPassword').value = ''; }
  msgEl.classList.remove('hidden');
  setTimeout(() => msgEl.classList.add('hidden'), 3000);
};

// ── Sign Out ──

document.getElementById('signOutBtn').onclick = async () => {
  await authSignOut();
  _settingsUser = null;
  _renderLoggedOut();
};

// ── Friends ──

document.getElementById('friendSearchBtn').onclick = _searchFriends;
document.getElementById('friendSearch').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') _searchFriends();
});

async function _searchFriends() {
  const q = document.getElementById('friendSearch').value.trim().toLowerCase();
  if (!q || !_settingsUser) return;
  const db = getDb();
  if (!db) return;

  const results = document.getElementById('friendSearchResults');
  results.innerHTML = '<p class="text-slate-500 text-xs">Searching…</p>';

  const { data, error } = await db.from('jq_profiles')
    .select('id, username, name, avatar_url')
    .ilike('username', `%${q}%`)
    .neq('id', _settingsUser.id)
    .limit(10);

  if (error || !data?.length) {
    results.innerHTML = '<p class="text-slate-500 text-xs">No users found.</p>';
    return;
  }

  const { data: existingFriends } = await db.from('jq_friends')
    .select('friend_id').eq('user_id', _settingsUser.id);
  const friendIds = new Set((existingFriends || []).map(f => f.friend_id));

  results.innerHTML = data.map(u => `
    <div class="flex items-center gap-3 p-3 rounded-xl bg-slate-700/40 border border-slate-600/40">
      <div class="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-xs font-bold text-emerald-400">${(u.name || u.username || '?')[0].toUpperCase()}</div>
      <div class="flex-1">
        <p class="text-[13px] font-semibold">@${escapeHtml(u.username)}</p>
        <p class="text-[11px] text-slate-400">${escapeHtml(u.name || '')}</p>
      </div>
      ${friendIds.has(u.id)
        ? '<span class="text-[11px] text-emerald-400">Friends</span>'
        : `<button class="text-[12px] font-semibold text-pink-400 underline underline-offset-2" data-add-friend="${escapeHtml(u.id)}">Add</button>`}
    </div>`).join('');

  results.querySelectorAll('[data-add-friend]').forEach(btn => {
    btn.onclick = () => _addFriend(btn.dataset.addFriend, btn);
  });
}

async function _addFriend(friendId, btn) {
  const db = getDb();
  if (!db || !_settingsUser) return;
  btn.disabled = true; btn.textContent = 'Adding…';
  const { error } = await db.from('jq_friends').insert({ user_id: _settingsUser.id, friend_id: friendId });
  if (error) { btn.disabled = false; btn.textContent = 'Add'; alert(error.message); return; }
  btn.replaceWith(Object.assign(document.createElement('span'), { className: 'text-[11px] text-emerald-400', textContent: 'Added!' }));
  _loadFriends();
}

async function _loadFriends() {
  const list = document.getElementById('friendsList');
  const db = getDb();
  if (!db || !_settingsUser) return;

  const { data, error } = await db.from('jq_friends')
    .select('friend_id, jq_profiles!jq_friends_friend_id_fkey(username, name, avatar_url)')
    .eq('user_id', _settingsUser.id);

  if (error || !data?.length) {
    list.innerHTML = '<p class="text-slate-500 text-xs">No friends yet. Search above to add some!</p>';
    return;
  }

  list.innerHTML = data.map(f => {
    const u = f.jq_profiles;
    if (!u) return '';
    return `<div class="flex items-center gap-3 p-3 rounded-xl bg-slate-700/40 border border-slate-600/40">
      <div class="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-xs font-bold text-emerald-400">${(u.name || u.username || '?')[0].toUpperCase()}</div>
      <div class="flex-1">
        <p class="text-[13px] font-semibold">@${escapeHtml(u.username || '')}</p>
        <p class="text-[11px] text-slate-400">${escapeHtml(u.name || '')}</p>
      </div>
      <button class="text-[11px] text-rose-400 underline underline-offset-2" data-remove-friend="${escapeHtml(f.friend_id)}">Remove</button>
    </div>`;
  }).join('');

  list.querySelectorAll('[data-remove-friend]').forEach(btn => {
    btn.onclick = async () => {
      await db.from('jq_friends').delete().eq('user_id', _settingsUser.id).eq('friend_id', btn.dataset.removeFriend);
      _loadFriends();
    };
  });
}

// ── App Settings ──

document.getElementById('apiKeyInput').value = state.apiKey || '';
document.getElementById('locationInput').value = state.location || DEFAULT_LOCATION;
document.getElementById('maxDistanceInput').value = String(state.maxDistance || DEFAULT_MAX_DISTANCE);

document.getElementById('saveSettingsBtn').onclick = () => {
  state.apiKey = document.getElementById('apiKeyInput').value.trim();
  const loc = document.getElementById('locationInput').value.trim();
  state.location = loc || DEFAULT_LOCATION;
  const chosen = parseInt(document.getElementById('maxDistanceInput').value, 10);
  state.maxDistance = DISTANCE_OPTIONS.includes(chosen) ? chosen : DEFAULT_MAX_DISTANCE;
  saveState();
  document.getElementById('locationSuggestions').classList.add('hidden');
  const msg = document.getElementById('settingsSavedMsg');
  msg.classList.remove('hidden');
  setTimeout(() => msg.classList.add('hidden'), 2500);
};

// ── Mapbox location autocomplete ──

let _locDebounce = null;
document.getElementById('locationInput').addEventListener('input', (e) => {
  const q = e.target.value.trim();
  if (!MAPBOX_TOKEN || q.length < 2) { document.getElementById('locationSuggestions').classList.add('hidden'); return; }
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

document.getElementById('useCurrentLocationBtn').onclick = async () => {
  const btn = document.getElementById('useCurrentLocationBtn');
  if (!navigator.geolocation) return;
  btn.disabled = true; btn.style.color = '#10b981';
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
        if (name) { input.value = name; return; }
      }
    }
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=14`);
    if (res.ok) {
      const data = await res.json();
      const a = data.address || {};
      const parts = [a.suburb || a.neighbourhood || a.village || a.town, a.city || a.county, a.country].filter(Boolean);
      if (parts.length) input.value = parts.join(', ');
    }
  } catch (_) {}
  btn.disabled = false; btn.style.color = '';
};

// ── Helpers ──

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

// ── Init ──

if (_settingsUser) _renderLoggedIn();
else {
  refreshSession().then(user => {
    if (user) { _settingsUser = user; _renderLoggedIn(); }
  });
}

const _splash = document.getElementById('splash');
if (_splash) { _splash.classList.add('out'); setTimeout(() => _splash.remove(), 400); }
