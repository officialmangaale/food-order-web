const ALLOWED_PATHS = new Set(['wallet', 'transactions', 'rewards']);
const ALLOWED_QUERY = new Set(['limit', 'cursor', 'restaurant_id']);
const TIMEOUT_MS = 12_000;

export async function GET(
  request: Request,
  context: { params: Promise<{ segments: string[] }> }
) {
  const { segments } = await context.params;
  const resource = segments.length === 1 ? segments[0] : '';
  if (!ALLOWED_PATHS.has(resource)) {
    return Response.json({ error: 'not_found' }, { status: 404 });
  }

  const authorization = request.headers.get('authorization')?.trim() ?? '';
  if (!authorization.startsWith('Bearer ') || authorization.length > 8192) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }

  let upstreamBase: string;
  try {
    upstreamBase = getLoyaltyBase();
  } catch {
    return Response.json({ error: 'temporarily_unavailable' }, { status: 503 });
  }

  const incomingUrl = new URL(request.url);
  const upstreamUrl = new URL(`v1/loyalty/${resource}`, `${upstreamBase}/`);
  for (const [key, value] of incomingUrl.searchParams) {
    if (ALLOWED_QUERY.has(key)) upstreamUrl.searchParams.append(key, value);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const upstream = await fetch(upstreamUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: authorization,
      },
      cache: 'no-store',
      signal: controller.signal,
    });
    const body = await upstream.arrayBuffer();
    return new Response(body, {
      status: upstream.status,
      headers: {
        'Content-Type': upstream.headers.get('content-type') || 'application/json',
        'Cache-Control': 'no-store, private',
      },
    });
  } catch {
    return Response.json({ error: 'temporarily_unavailable' }, { status: 503 });
  } finally {
    clearTimeout(timer);
  }
}

function getLoyaltyBase() {
  const raw = process.env.LOYALTY_SERVICE_BASE_URL?.trim();
  if (!raw) throw new Error('missing loyalty service URL');

  const parsed = new URL(raw);
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password || parsed.search || parsed.hash) {
    throw new Error('invalid loyalty service URL');
  }
  return `${parsed.origin}${parsed.pathname.replace(/\/+$/, '')}`;
}
