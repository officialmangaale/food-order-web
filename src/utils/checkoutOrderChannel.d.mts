export function checkoutOrderChannel(utmSource?: string | null, orderFrom?: 'whatsapp_link' | 'app_web'): {
  order_from: 'whatsapp_link' | 'app_web';
  utm_source?: string;
};
