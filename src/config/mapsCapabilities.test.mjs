import test from 'node:test';
import assert from 'node:assert/strict';
import { mapsCapabilities } from './mapsCapabilities.mjs';

test('disabled build stays disabled even with key/renderer', () => {
  const capability = mapsCapabilities(
    { enabled: false, keyConfigured: true, pickerEnabled: false },
    { renderer: true, places: true, geocoding: true }
  );
  assert.equal(capability.mapsAvailable, false);
  assert.equal(capability.placesAvailable, false);
  assert.equal(capability.geocodingAvailable, false);
});
test('enabled without key reports not configured', () => {
  assert.equal(mapsCapabilities({ enabled: true, keyConfigured: false, pickerEnabled: true }).state, 'not_configured');
});
test('production has no activated Maps or picker provider', () => {
  const capability = mapsCapabilities({ enabled: true, keyConfigured: true, pickerEnabled: true });
  assert.equal(capability.state, 'not_implemented');
  assert.equal(capability.customerMapPickerAvailable, false);
  assert.equal(capability.placesAvailable, false);
});
test('injected test providers exercise the future capability path', () => {
  const capability = mapsCapabilities({ enabled: true, keyConfigured: true, pickerEnabled: true }, { renderer: true, picker: true, places: true, geocoding: true });
  assert.equal(capability.mapsAvailable, true);
  assert.equal(capability.customerMapPickerAvailable, true);
  assert.equal(capability.placesAvailable, true);
  assert.equal(capability.geocodingAvailable, true);
});
