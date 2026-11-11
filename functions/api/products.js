// Cloudflare Pages Function: public, read-only product catalogue.
export async function onRequestGet({ env }) {
  if (!env.DB) {
    return Response.json(
      { error: 'Catalogue database is not configured.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  try {
    const { results } = await env.DB.prepare(
      `SELECT id, slug, title, description, category, price_ugx,
              compare_at_price_ugx, product_type, image_url
       FROM products
       WHERE is_published = 1
       ORDER BY created_at DESC`
    ).all();

    return Response.json(results ?? [], {
      headers: {
        'Cache-Control': 'public, max-age=60, s-maxage=120',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  } catch {
    return Response.json(
      { error: 'Unable to load the product catalogue.' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
