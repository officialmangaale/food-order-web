/** Generate Google Maps search URL for a location */
export function getGoogleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

/** Generate tel: link for phone */
export function getPhoneLink(phone: string): string {
  return `tel:${phone.replace(/\s/g, '')}`;
}
