import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ORDER_POLL_INTERVAL_MS,
  realtimeConnectionLabel,
  shouldPollOrder,
} from './realtimePolicy.mjs';

test('order tracking polls every 15 seconds only while live updates are unavailable', () => {
  assert.equal(ORDER_POLL_INTERVAL_MS, 15_000);
  assert.equal(shouldPollOrder({
    connected: false,
    hasToken: true,
    hasTracking: true,
    terminal: false,
    visibilityState: 'visible',
  }), true);
  assert.equal(shouldPollOrder({
    connected: true,
    hasToken: true,
    hasTracking: true,
    terminal: false,
    visibilityState: 'visible',
  }), false);
});

test('polling pauses for hidden tabs and terminal orders', () => {
  assert.equal(shouldPollOrder({
    connected: false,
    hasToken: true,
    hasTracking: true,
    terminal: false,
    visibilityState: 'hidden',
  }), false);
  assert.equal(shouldPollOrder({
    connected: false,
    hasToken: true,
    hasTracking: true,
    terminal: true,
    visibilityState: 'visible',
  }), false);
});

test('connection labels distinguish websocket and polling delivery', () => {
  assert.equal(realtimeConnectionLabel('connected'), 'Live updates connected');
  assert.equal(realtimeConnectionLabel('reconnecting'), 'Live updates reconnecting');
  assert.equal(realtimeConnectionLabel('polling'), 'Live updates via polling');
});
