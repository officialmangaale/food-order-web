const RESTAURANT_BASE = process.env.NEXT_PUBLIC_RESTAURANT_SERVICE_BASE_URL ?? 'https://restaurant-prod.mangaale.com';

const EMPTY_URL_VALUES = new Set(['', 'null', 'undefined', 'none', 'n/a']);
const URL_SCHEME_PATTERN = /^[a-z][a-z\d+.-]*:/i;

export function normalizeImageUrl(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;

  const raw = value.trim().replace(/\\/g, '/');
  if (EMPTY_URL_VALUES.has(raw.toLowerCase())) return undefined;

  if (raw.startsWith('data:image/')) return raw;

  try {
    if (raw.startsWith('//')) {
      return new URL(`https:${raw}`).href;
    }

    if (/^https?:\/\//i.test(raw)) {
      return new URL(raw).href;
    }

    if (looksLikeProtocolLessHost(raw)) {
      return new URL(`${getProtocolForProtocolLessHost(raw)}://${raw}`).href;
    }

    if (URL_SCHEME_PATTERN.test(raw)) {
      return undefined;
    }

    const base = normalizeBaseUrl(RESTAURANT_BASE);
    if (!base) {
      return raw.startsWith('/') ? encodeURI(raw) : encodeURI(`/${raw}`);
    }

    return new URL(raw, base).href;
  } catch {
    return undefined;
  }
}

function normalizeBaseUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return '';
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
  return withProtocol.endsWith('/') ? withProtocol : `${withProtocol}/`;
}

function looksLikeProtocolLessHost(value: string) {
  const firstSegment = value.split('/')[0] ?? '';
  return firstSegment === 'localhost' || firstSegment.includes('.') || /:\d+$/.test(firstSegment);
}

function getProtocolForProtocolLessHost(value: string) {
  const firstSegment = value.split('/')[0] ?? '';
  return firstSegment.startsWith('localhost') || firstSegment.startsWith('127.') ? 'http' : 'https';
}
