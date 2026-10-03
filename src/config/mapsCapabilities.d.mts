export interface MapsCapabilities {
  readonly state: 'disabled' | 'not_configured' | 'not_implemented' | 'available';
  readonly mapsAvailable: boolean;
  readonly placesAvailable: boolean;
  readonly geocodingAvailable: boolean;
  readonly customerMapPickerAvailable: boolean;
}
export function mapsCapabilities(
  config: { enabled: boolean; keyConfigured: boolean; pickerEnabled: boolean; placesEnabled?: boolean; geocodingEnabled?: boolean },
  providers?: { renderer?: boolean; places?: boolean; geocoding?: boolean; picker?: boolean },
): MapsCapabilities;
