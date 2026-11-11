const json = (data, status = 200, headers = {}) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store', ...headers } });
const COOKIE = 'spm_session';
const encoder = new TextEncoder();

function cookieValue(request) {
  const item = (request.headers.get('Cookie') || '').split(';').map(x => x.trim()).find(x => x.startsWith(COOKIE + '='));
  return item ? decodeURIComponent(item.slice(COOKIE.length + 1)) : null;
}
async function digest(value) {
  const bytes = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return [...new Uint8Array(bytes)].map(x => x.toString(16).padStart(2, '0')).join('');
}
async function passwordHash(password, salt) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: Uint8Array.from(atob(salt), c => c.charCodeAt(0)), iterations: 310000, hash: 'SHA-256' }, key, 256);
  return [...new Uint8Array(bits)].map(x => x.toString(16).padStart(2, '0')).join('');
}
function randomToken(bytes = 32) {
  const data = crypto.getRandomValues(new Uint8Array(bytes));
  return btoa(String.fromCharCode(...data)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}
function cookie(token, maxAge) {
  return `${COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}
async function createSession(env, userId) {
  const token = randomToken();
  const tokenHash = await digest(token);
  const id = crypto.randomUUID();
  await env.DB.prepare('INSERT INTO sessions (id,user_id,token_hash,expires_at) VALUES (?,?,?,?)')
    .bind(id, userId, tokenHash, new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString()).run();
  return token;
}
async function currentUser(request, env) {
  const token = cookieValue(request);
  if (!token) return null;
  const tokenHash = await digest(token);
  const row = await env.DB.prepare(`SELECT users.id, users.email, users.display_name AS displayName, users.role
    FROM sessions JOIN users ON users.id = sessions.user_id
    WHERE sessions.token_hash = ? AND sessions.expires_at > ?`).bind(tokenHash, new Date().toISOString()).first();
  return row || null;
}

export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ error: 'Account service is not configured yet.' }, 503);
  let body; try { body = await request.json(); } catch { return json({ error: 'Invalid request.' }, 400); }
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  if (!email || !password || email.length > 254 || password.length > 128) return json({ error: 'Enter your email and password.' }, 400);
  const row = await env.DB.prepare('SELECT id,email,display_name,password_hash,role FROM users WHERE email = ?').bind(email).first();
  if (!row || !row.password_hash || !row.password_hash.includes(':')) return json({ error: 'Email or password is incorrect.' }, 401);
  const [salt, savedHash] = row.password_hash.split(':');
  const candidate = await passwordHash(password, salt);
  if (candidate.length !== savedHash.length || !crypto.subtle.timingSafeEqual) {
    if (candidate !== savedHash) return json({ error: 'Email or password is incorrect.' }, 401);
  } else {
    const a = encoder.encode(candidate), b = encoder.encode(savedHash);
    let diff = 0; for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
    if (diff !== 0) return json({ error: 'Email or password is incorrect.' }, 401);
  }
  const token = await createSession(env, row.id);
  return json({ user: { id: row.id, email: row.email, displayName: row.display_name, role: row.role } }, 200, { 'Set-Cookie': cookie(token, 60 * 60 * 24 * 14) });
}
