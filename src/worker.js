/**
 * Cloudflare Worker: static assets + /api/gallery + /api/admin/verify
 */
function adminOk(request, env) {
  const secret = env.ADMIN_API_SECRET;
  if (!secret || typeof secret !== 'string') return false;
  const auth = request.headers.get('Authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  return token === secret;
}

function normalizeItem(raw) {
  const id =
    String(raw.id || '')
      .trim()
      .slice(0, 200) || 'piece-' + Math.random().toString(36).slice(2, 10);
  return {
    id,
    title: String(raw.title ?? '').trim() || 'Untitled',
    meta: String(raw.meta ?? '').trim(),
    description: String(raw.description ?? '').trim(),
    detailDescription: String(
      raw.detailDescription ?? raw.description ?? ''
    ).trim(),
    label: String(raw.label ?? 'Original').trim() || 'Original',
    price: Number(raw.price) || 0,
    cartTitle: String(raw.cartTitle ?? raw.title ?? '').trim() || 'Untitled',
    gradient: String(
      raw.gradient ?? 'linear-gradient(135deg, #f7c5c0, #d5c9e8)'
    ).trim(),
    tags: String(raw.tags ?? 'original')
      .trim()
      .toLowerCase() || 'original',
    badge: String(raw.badge ?? '')
      .trim()
      .toLowerCase(),
    large: !!raw.large,
    featured: !!raw.featured,
    sold: !!raw.sold,
    cartColor: String(raw.cartColor ?? '#d5c9e8').trim(),
    imageUrl: raw.imageUrl ? String(raw.imageUrl).trim().slice(0, 2048) : '',
    imageDimmed: !!raw.imageDimmed,
  };
}

function rowToItem(r) {
  return {
    id: r.id,
    title: r.title,
    meta: r.meta,
    description: r.description,
    detailDescription: r.detail_description,
    label: r.label,
    price: r.price | 0,
    cartTitle: r.cart_title,
    gradient: r.gradient,
    tags: r.tags,
    badge: r.badge || '',
    large: !!r.large,
    featured: !!r.featured,
    sold: !!r.sold,
    cartColor: r.cart_color,
    imageUrl: r.image_url || '',
    imageDimmed: !!r.image_dimmed,
  };
}

async function handleGalleryGet(env) {
  try {
    const { results } = await env.DB.prepare(
      'SELECT * FROM gallery_items ORDER BY sort_order ASC, id ASC'
    ).all();
    const items = (results || []).map(rowToItem);
    return Response.json(items, {
      headers: {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
      },
    });
  } catch (e) {
    console.error('GET /api/gallery', e);
    return Response.json(
      { error: 'Database error', detail: String(e.message || e) },
      { status: 500 }
    );
  }
}

async function handleGalleryPut(request, env) {
  if (!adminOk(request, env)) {
    return new Response('Unauthorized', { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const list = body.items;
  if (!Array.isArray(list)) {
    return new Response('Expected { items: [...] }', { status: 400 });
  }

  const normalized = list.map(normalizeItem);
  const insertSql = `
    INSERT INTO gallery_items (
      id, sort_order, title, meta, description, detail_description, label, price,
      cart_title, gradient, tags, badge, large, featured, sold, cart_color, image_url, image_dimmed
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const insert = env.DB.prepare(insertSql);

  const batch = [env.DB.prepare('DELETE FROM gallery_items')];
  normalized.forEach((it, order) => {
    batch.push(
      insert.bind(
        it.id,
        order,
        it.title,
        it.meta,
        it.description,
        it.detailDescription,
        it.label,
        it.price,
        it.cartTitle,
        it.gradient,
        it.tags,
        it.badge,
        it.large ? 1 : 0,
        it.featured ? 1 : 0,
        it.sold ? 1 : 0,
        it.cartColor,
        it.imageUrl,
        it.imageDimmed ? 1 : 0
      )
    );
  });

  try {
    await env.DB.batch(batch);
  } catch (e) {
    console.error('PUT /api/gallery', e);
    return Response.json(
      { error: 'Write failed', detail: String(e.message || e) },
      { status: 500 }
    );
  }

  return Response.json({ ok: true, count: normalized.length });
}

async function handleAdminVerify(request, env) {
  if (!env.ADMIN_API_SECRET || typeof env.ADMIN_API_SECRET !== 'string') {
    return Response.json(
      { ok: false, error: 'ADMIN_API_SECRET is not set on this deployment.' },
      { status: 503 }
    );
  }

  if (!adminOk(request, env)) {
    return new Response('Unauthorized', { status: 401 });
  }

  return Response.json({ ok: true });
}

/** Stripe application/x-www-form-urlencoded body (nested objects + arrays). */
function objectToStripeForm(root) {
  const sp = new URLSearchParams();
  function walk(value, keyPath) {
    if (value === null || value === undefined) return;
    if (Array.isArray(value)) {
      value.forEach((item, i) => {
        walk(item, `${keyPath}[${i}]`);
      });
      return;
    }
    if (typeof value === 'object') {
      for (const [k, v] of Object.entries(value)) {
        walk(v, `${keyPath}[${k}]`);
      }
      return;
    }
    sp.append(keyPath, String(value));
  }
  for (const [k, v] of Object.entries(root)) {
    walk(v, k);
  }
  return sp;
}

const FREE_SHIPPING_THRESHOLD_USD = 500;
const SHIPPING_USD = 25;

async function handleCheckoutSession(request, env) {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  if (!env.STRIPE_SECRET_KEY || typeof env.STRIPE_SECRET_KEY !== 'string') {
    return Response.json(
      { error: 'Payments are not configured on this server.' },
      { status: 503 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const rawItems = body.items;
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return Response.json({ error: 'Cart is empty.' }, { status: 400 });
  }

  let rows;
  try {
    const q = await env.DB.prepare(
      'SELECT id, price, cart_title, title, sold FROM gallery_items'
    ).all();
    rows = q.results || [];
  } catch (e) {
    console.error('POST /api/checkout-session DB', e);
    return Response.json({ error: 'Could not load catalog.' }, { status: 500 });
  }

  const byId = new Map(rows.map((r) => [r.id, r]));
  const line_items = [];

  for (const raw of rawItems) {
    const id = String(raw.id || '').trim();
    const qty = Math.min(99, Math.max(1, parseInt(raw.qty, 10) || 0));
    if (!id || qty < 1) {
      return Response.json({ error: 'Invalid cart line.' }, { status: 400 });
    }

    const row = byId.get(id);
    if (!row) {
      return Response.json(
        {
          error:
            'An item in your cart is no longer available. Refresh the gallery and try again.',
        },
        { status: 400 }
      );
    }
    if (row.sold) {
      return Response.json(
        {
          error:
            'A sold piece is still in your cart. Remove it to continue checkout.',
        },
        { status: 400 }
      );
    }

    const priceUsd = Number(row.price) || 0;
    if (priceUsd <= 0) {
      return Response.json(
        { error: 'An item could not be priced. Please contact the gallery.' },
        { status: 400 }
      );
    }

    const name = String(row.cart_title || row.title || 'Artwork').slice(
      0,
      500
    );
    const unitCents = Math.round(priceUsd * 100);
    line_items.push({
      quantity: qty,
      price_data: {
        currency: 'usd',
        unit_amount: unitCents,
        product_data: {
          name,
          metadata: { piece_id: id },
        },
      },
    });
  }

  if (line_items.length === 0) {
    return Response.json({ error: 'Cart is empty.' }, { status: 400 });
  }

  let subtotalCents = 0;
  for (const li of line_items) {
    subtotalCents += li.price_data.unit_amount * li.quantity;
  }
  const subtotalUsd = subtotalCents / 100;
  const shippingUsd =
    subtotalUsd >= FREE_SHIPPING_THRESHOLD_USD ? 0 : SHIPPING_USD;

  if (shippingUsd > 0) {
    line_items.push({
      quantity: 1,
      price_data: {
        currency: 'usd',
        unit_amount: Math.round(shippingUsd * 100),
        product_data: {
          name: 'Shipping',
          description: 'Standard delivery',
        },
      },
    });
  }

  const origin = new URL(request.url).origin;
  const payload = {
    mode: 'payment',
    success_url: `${origin}/cart.html?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/cart.html?checkout=cancel`,
    line_items,
  };

  const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + env.STRIPE_SECRET_KEY.trim(),
      'Content-Type': 'application/x-www-form-urlencoded',
      'Stripe-Version': '2023-10-16',
    },
    body: objectToStripeForm(payload).toString(),
  });

  const session = await stripeRes.json();
  if (!stripeRes.ok) {
    console.error('Stripe checkout session', session);
    return Response.json(
      {
        error:
          session.error?.message ||
          'Could not start checkout. Try again in a moment.',
      },
      { status: 502 }
    );
  }

  if (!session.url) {
    return Response.json(
      { error: 'Checkout session had no redirect URL.' },
      { status: 502 }
    );
  }

  return Response.json({ url: session.url });
}

function normalizePath(pathname) {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1);
  }
  return pathname || '/';
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = normalizePath(url.pathname);

    if (path === '/api/gallery') {
      if (request.method === 'GET') return handleGalleryGet(env);
      if (request.method === 'PUT') return handleGalleryPut(request, env);
      return new Response('Method Not Allowed', { status: 405 });
    }

    if (path === '/api/admin/verify') {
      if (request.method === 'POST') return handleAdminVerify(request, env);
      return new Response('Method Not Allowed', { status: 405 });
    }

    if (path === '/api/checkout-session') {
      if (request.method === 'POST') return handleCheckoutSession(request, env);
      return new Response('Method Not Allowed', { status: 405 });
    }

    return env.ASSETS.fetch(request);
  },
};
