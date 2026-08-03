export function buildOrderTrackingWebSocketUrl(orderId, token, baseURL = '') {
  const rawBase = String(baseURL ?? '').trim();
  if (!rawBase) {
    throw configurationError('Restaurant WebSocket base URL is not configured.');
  }

  let url;
  try {
    url = new URL(rawBase);
  } catch {
    throw configurationError('Restaurant WebSocket base URL is invalid.');
  }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
    throw configurationError('Restaurant WebSocket base URL must be an http(s) URL without credentials or query parameters.');
  }
  const basePath = url.pathname.replace(/\/+$/, '');
  url.pathname = `${basePath}/ws/orders/status`;
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.searchParams.set('order_id', String(orderId));
  url.searchParams.set('token', token);
  return url.toString();
}

function configurationError(message) {
  const error = new Error(message);
  error.code = 'CONFIGURATION_ERROR';
  return error;
}
