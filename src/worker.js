/**
 * Cloudflare Worker: static assets + /api/gallery + /api/admin/verify
 * (Pages projects can keep using functions/ instead.)
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

    return env.ASSETS.fetch(request);
  },
};
