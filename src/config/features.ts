export const features = Object.freeze({
  loyaltyUI: process.env.NEXT_PUBLIC_LOYALTY_UI_ENABLED === 'true',
  webCustomerTrackingMap: process.env.NEXT_PUBLIC_WEB_CUSTOMER_TRACKING_MAP_ENABLED === 'true',
});
