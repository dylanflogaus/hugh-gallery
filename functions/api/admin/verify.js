/**
 * POST /api/admin/verify — 200 if Authorization Bearer matches ADMIN_API_SECRET.
 */
export async function onRequestPost({ request, env }) {
  if (!env.ADMIN_API_SECRET || typeof env.ADMIN_API_SECRET !== 'string') {
    return Response.json(
      { ok: false, error: 'ADMIN_API_SECRET is not set on this deployment.' },
      { status: 503 }
    );
  }

  const auth = request.headers.get('Authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (!token || token !== env.ADMIN_API_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }

  return Response.json({ ok: true });
}
