// Create a pending order from the live, published catalogue.
// Prices are always read from D1; client-supplied prices and totals are ignored.
const json = (data, status = 200) => Response.json(data, {
  status,
  headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }
});
const COOKIE = 'spm_session';
const encoder = new TextEncoder();

function cookieValue(request) {
  const item = (request.headers.get('Cookie') || '').split(';').map(value => value.trim())
    .find(value => value.startsWith(COOKIE + '='));
  return item ? decodeURIComponent(item.slice(COOKIE.length + 1)) : null;
}

async function digest(value) {
  const bytes = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return [...new Uint8Array(bytes)].map(value => value.toString(16).padStart(2, '0')).join('');
}

export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ error: 'Checkout is not configured yet.' }, 503);
  if (!request.headers.get('content-type')?.toLowerCase().includes('application/json')) {
    return json({ error: 'Send checkout details as JSON.' }, 415);
  }

  const token = cookieValue(request);
  if (!token) return json({ error: 'Please sign in before checkout.' }, 401);

  const session = await env.DB.prepare(`
    SELECT users.id FROM sessions
    JOIN users ON users.id = sessions.user_id
    WHERE sessions.token_hash = ? AND sessions.expires_at > ?
  `).bind(await digest(token), new Date().toISOString()).first();
  if (!session) return json({ error: 'Your session has expired. Please sign in again.' }, 401);

  let body;
  try { body = await request.json(); } catch { return json({ error: 'Checkout details are invalid.' }, 400); }
  if (!Array.isArray(body.items) || body.items.length < 1 || body.items.length > 20) {
    return json({ error: 'Your bag must contain between 1 and 20 different products.' }, 400);
  }

  const quantities = new Map();
  for (const item of body.items) {
    const id = typeof item?.productId === 'string' ? item.productId.trim() : '';
    const quantity = Number(item?.quantity);
    if (!id || id.length > 128 || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 10) {
      return json({ error: 'Each product must have a valid ID and a quantity from 1 to 10.' }, 400);
    }
    quantities.set(id, (quantities.get(id) || 0) + quantity);
    if (quantities.get(id) > 10) return json({ error: 'Maximum quantity per product is 10.' }, 400);
  }

  const items = [];
  for (const [productId, quantity] of quantities) {
    const product = await env.DB.prepare(`
      SELECT id, title, price_ugx FROM products
      WHERE id = ? AND is_published = 1
    `).bind(productId).first();
    if (!product) return json({ error: 'A product in your bag is no longer available. Please refresh your bag.' }, 409);
    const unitPrice = Number(product.price_ugx);
    if (!Number.isSafeInteger(unitPrice) || unitPrice < 0) return json({ error: 'A product price needs review. Please try again later.' }, 409);
    items.push({ productId: product.id, title: product.title, quantity, unitPrice });
  }

  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  if (!Number.isSafeInteger(subtotal) || subtotal < 0) return json({ error: 'Your order total is invalid.' }, 400);

  const orderId = crypto.randomUUID();
  const statements = [
    env.DB.prepare(`
      INSERT INTO orders (id, customer_id, status, currency, subtotal_ugx, total_ugx)
      VALUES (?, ?, 'pending', 'UGX', ?, ?)
    `).bind(orderId, session.id, subtotal, subtotal),
    ...items.map(item => env.DB.prepare(`
      INSERT INTO order_items (id, order_id, product_id, product_title, quantity, unit_price_ugx)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(crypto.randomUUID(), orderId, item.productId, item.title, item.quantity, item.unitPrice))
  ];

  try {
    await env.DB.batch(statements);
  } catch {
    return json({ error: 'We could not create your order. No payment has been taken.' }, 500);
  }

  return json({
    order: {
      id: orderId,
      status: 'pending',
      currency: 'UGX',
      subtotalUgx: subtotal,
      totalUgx: subtotal,
      items: items.map(({ productId, title, quantity, unitPrice }) => ({
        productId, title, quantity, unitPriceUgx: unitPrice
      }))
    },
    message: 'Order created. Payment is not enabled yet.'
  }, 201);
}
