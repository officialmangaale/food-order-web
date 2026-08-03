import assert from 'node:assert/strict';
import test from 'node:test';

import { buildOrderTrackingWebSocketUrl } from './websocketUrl.mjs';

test('customer tracking converts HTTPS service URL to WSS and preserves a proxy prefix', () => {
  assert.equal(
    buildOrderTrackingWebSocketUrl(
      8852,
      'jwt-token',
      'https://restaurant.example.test/api-main/',
      'https://food.example.test',
    ),
    'wss://restaurant.example.test/api-main/ws/orders/status?order_id=8852&token=jwt-token',
  );
});

test('customer tracking uses WS for HTTP service URLs', () => {
  assert.equal(
    buildOrderTrackingWebSocketUrl(7, 'token', 'http://localhost:8082', 'http://localhost:3000'),
    'ws://localhost:8082/ws/orders/status?order_id=7&token=token',
  );
});

test('customer tracking never falls back to the food frontend origin', () => {
  assert.throws(
    () => buildOrderTrackingWebSocketUrl(7, 'token', ''),
    (error) => error.code === 'CONFIGURATION_ERROR',
  );
});
