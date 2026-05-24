// Lazy Supabase client (requires supabase-js CDN loaded before this file)
function getDb() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  if (!window._db) window._db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return window._db;
}

const AUTH_KEY = 'jhbsq_user';

function getAuthUser() {
  try { return JSON.parse(localStorage.getItem(AUTH_KEY)) || null; } catch { return null; }
}

function setAuthUser(user) {
  if (user) localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  else localStorage.removeItem(AUTH_KEY);
}

// Compress image to max 800px, JPEG 70% quality using canvas
async function compressImage(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX = 800;
        let w = img.width, h = img.height;
        if (w > h) { if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; } }
        else { if (h > MAX) { w = Math.round(w * MAX / h); h = MAX; } }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        canvas.toBlob(blob => resolve(blob), 'image/jpeg', 0.7);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

async function uploadPhoto(bucket, file, path) {
  const db = getDb();
  if (!db) throw new Error('Supabase not configured');
  const blob = await compressImage(file);
  const { error } = await db.storage.from(bucket).upload(path, blob, {
    contentType: 'image/jpeg',
    upsert: true
  });
  if (error) throw error;
  const { data } = db.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

async function authSignUp(email, password, username, name) {
  const db = getDb();
  if (!db) throw new Error('Supabase not configured. Add SUPABASE_URL and SUPABASE_ANON_KEY to js/env.js.');
  const { data, error } = await db.auth.signUp({ email, password });
  if (error) throw error;
  const userId = data.user?.id;
  if (!userId) throw new Error('Sign-up failed — no user returned.');
  const { error: pErr } = await db.from('jq_profiles').insert({ id: userId, username, name });
  if (pErr) throw pErr;
  const profile = { id: userId, email, username, name, avatar_url: null };
  setAuthUser(profile);
  return profile;
}

async function authSignIn(email, password) {
  const db = getDb();
  if (!db) throw new Error('Supabase not configured.');
  const { data, error } = await db.auth.signInWithPassword({ email, password });
  if (error) throw error;
  const userId = data.user.id;
  const { data: profile } = await db.from('jq_profiles').select('*').eq('id', userId).single();
  const user = { id: userId, email: data.user.email, ...(profile || {}) };
  setAuthUser(user);
  return user;
}

async function authSignOut() {
  const db = getDb();
  if (db) await db.auth.signOut();
  setAuthUser(null);
}

async function refreshSession() {
  const db = getDb();
  if (!db) return null;
  const { data } = await db.auth.getSession();
  if (!data.session) { setAuthUser(null); return null; }
  const userId = data.session.user.id;
  const { data: profile } = await db.from('jq_profiles').select('*').eq('id', userId).single();
  if (!profile) { setAuthUser(null); return null; }
  const user = { id: userId, email: data.session.user.email, ...profile };
  setAuthUser(user);
  return user;
}

async function updateProfile(userId, updates) {
  const db = getDb();
  if (!db) throw new Error('Supabase not configured.');
  const { error } = await db.from('jq_profiles').update(updates).eq('id', userId);
  if (error) throw error;
  const current = getAuthUser();
  if (current) setAuthUser({ ...current, ...updates });
}

// Haversine distance in km
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function getBrowserCoords() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) { resolve(null); return; }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { timeout: 6000 }
    );
  });
}
