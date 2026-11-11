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
  if (env.DB) {
    const token = cookieValue(request);
    if (token) await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(await digest(token)).run();
  }
  return json({ ok: true }, 200, { 'Set-Cookie': cookie('', 0) });
}
