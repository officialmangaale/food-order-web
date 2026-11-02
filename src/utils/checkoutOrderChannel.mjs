// Preview, coupon retry and placement must agree on who fulfils the delivery.
export function checkoutOrderChannel(utmSource, orderFrom) {
  const source = typeof utmSource === 'string' ? utmSource.trim().toLowerCase() : '';
  return {
    order_from: orderFrom ?? (source === 'whatsapp' ? 'whatsapp_link' : 'app_web'),
    ...(orderFrom === 'whatsapp_link' ? { utm_source: 'whatsapp' } : source && !(orderFrom === 'app_web' && source === 'whatsapp') ? { utm_source: source } : {}),
  };
}
