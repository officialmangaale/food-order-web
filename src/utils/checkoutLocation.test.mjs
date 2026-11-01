import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveCheckoutLocation } from './checkoutLocation.mjs';

const deliveryPin = { latitude: 28.52, longitude: 77.1 };
const browsingPin = { latitude: 19.07, longitude: 72.87 };

test('the saved address pin takes priority over a browsing location in another city', () => {
  assert.deepEqual(resolveCheckoutLocation(deliveryPin, browsingPin), deliveryPin);
});

test('a selected address without a valid pin never uses the browsing location', () => {
  for (const address of [{}, { latitude: 28.52 }, { latitude: 0, longitude: 0 }, { latitude: NaN, longitude: 77.1 }]) {
    assert.equal(resolveCheckoutLocation(address, browsingPin), undefined);
  }
});

test('preview before selecting an address can use a valid browsing pin', () => {
  assert.deepEqual(resolveCheckoutLocation(null, browsingPin), browsingPin);
});

test('invalid or unset browsing coordinates cannot be sent to pricing', () => {
  for (const pin of [undefined, {}, { latitude: 0, longitude: 0 }, { latitude: 91, longitude: 77 },
    { latitude: 28, longitude: 181 }, { latitude: Infinity, longitude: 77 }, { latitude: '28.52', longitude: 77.1 }]) {
    assert.equal(resolveCheckoutLocation(null, pin), undefined);
  }
});
