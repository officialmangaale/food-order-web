// Runtime readiness is distinct from a configured build. No renderer or address
// provider is registered by the production app in Phase 2.
export function mapsCapabilities(config, providers = {}) {
  const state = !config.enabled ? 'disabled'
    : !config.keyConfigured ? 'not_configured'
    : !providers.renderer ? 'not_implemented' : 'available';
  return Object.freeze({
    state,
    mapsAvailable: state === 'available',
    placesAvailable: state === 'available' && Boolean(providers.places),
    geocodingAvailable: state === 'available' && Boolean(providers.geocoding),
    customerMapPickerAvailable: state === 'available' && config.pickerEnabled && Boolean(providers.picker),
  });
}
