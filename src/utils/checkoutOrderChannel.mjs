// Preview, coupon retry and placement must agree on who fulfils the delivery.
export function checkoutOrderChannel(utmSource) {
  const source = typeof utmSource === 'string' ? utmSource.trim().toLowerCase() : '';
  return {
    order_from: source === 'whatsapp' ? 'whatsapp_link' : 'app_web',
    ...(source ? { utm_source: source } : {}),
  };
}
