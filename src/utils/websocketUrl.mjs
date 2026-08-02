export function buildOrderTrackingWebSocketUrl(orderId, token, baseURL = '', origin = 'http://localhost') {
  const url = new URL(baseURL || origin, origin);
  const basePath = url.pathname.replace(/\/+$/, '');
  url.pathname = `${basePath}/ws/orders/status`;
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.searchParams.set('order_id', String(orderId));
  url.searchParams.set('token', token);
  return url.toString();
}
