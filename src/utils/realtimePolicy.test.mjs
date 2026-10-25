import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ORDER_CONNECTION_RECONCILE_MIN_MS,
  ORDER_POLL_INTERVAL_MS,
  ORDER_WS_STABLE_CONNECTION_MS,
  realtimeConnectionLabel,
  shouldPollOrder,
  shouldReconcileOrderTracking,
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

test('order tracking throttles full HTTP reconciliation during realtime reconnects', () => {
  assert.equal(ORDER_WS_STABLE_CONNECTION_MS, 10_000);
  assert.equal(ORDER_CONNECTION_RECONCILE_MIN_MS, 30_000);
  assert.equal(shouldReconcileOrderTracking({ lastFetchedAt: 0, now: 100 }), true);
  assert.equal(shouldReconcileOrderTracking({ lastFetchedAt: 1_000, now: 10_000 }), false);
  assert.equal(shouldReconcileOrderTracking({ lastFetchedAt: 1_000, now: 31_000 }), true);
});

test('connection labels distinguish websocket and polling delivery', () => {
  assert.equal(realtimeConnectionLabel('connected'), 'Live updates connected');
  assert.equal(realtimeConnectionLabel('reconnecting'), 'Live updates reconnecting');
  assert.equal(realtimeConnectionLabel('polling'), 'Live updates via polling');
});
