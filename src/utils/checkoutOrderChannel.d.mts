export function checkoutOrderChannel(utmSource?: string | null): {
  order_from: 'whatsapp_link' | 'app_web';
  utm_source?: string;
};
