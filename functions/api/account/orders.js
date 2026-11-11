const json = (data, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
const COOKIE = 'spm_session';
const encoder = new TextEncoder();
function cookieValue(request) {
  const item = (request.headers.get('Cookie') || '').split(';').map(value => value.trim()).find(value => value.startsWith(COOKIE + '='));
  return item ? decodeURIComponent(item.slice(COOKIE.length + 1)) : null;
}
async function digest(value) {
  const bytes = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return [...new Uint8Array(bytes)].map(value => value.toString(16).padStart(2, '0')).join('');
}
export async function onRequestGet({ request, env }) {
  if (!env.DB) return json({ error: 'Account service is not configured yet.' }, 503);
  const token = cookieValue(request);
  if (!token) return json({ error: 'Please sign in to view your orders.' }, 401);
  const tokenHash = await digest(token);
  const user = await env.DB.prepare(`SELECT users.id FROM sessions JOIN users ON users.id = sessions.user_id WHERE sessions.token_hash = ? AND sessions.expires_at > ?`)
    .bind(tokenHash, new Date().toISOString()).first();
  if (!user) return json({ error: 'Your session has expired. Please sign in again.' }, 401);
  const { results } = await env.DB.prepare(`
    SELECT o.id AS order_id, o.status, o.total_ugx, o.created_at,
           oi.id AS item_id, oi.product_title, oi.quantity
    FROM orders o LEFT JOIN order_items oi ON oi.order_id = o.id
    WHERE o.customer_id = ? ORDER BY o.created_at DESC, oi.id ASC LIMIT 200
  `).bind(user.id).all();
  const orders = new Map();
  for (const row of results || []) {
    if (!orders.has(row.order_id)) orders.set(row.order_id, { id: row.order_id, status: row.status, totalUgx: Number(row.total_ugx), createdAt: row.created_at, items: [] });
    if (row.item_id) orders.get(row.order_id).items.push({ id: row.item_id, title: row.product_title, quantity: Number(row.quantity) });
  }
  return json({ orders: [...orders.values()] });
}
