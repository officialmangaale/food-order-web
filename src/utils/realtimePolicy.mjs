export const ORDER_POLL_INTERVAL_MS = 15_000;
export const ORDER_POLL_ACTIVATION_DELAY_MS = 1_500;
export const ORDER_WS_STABLE_CONNECTION_MS = 10_000;
export const ORDER_CONNECTION_RECONCILE_MIN_MS = 30_000;

/**
 * @typedef {'connected' | 'reconnecting' | 'polling'} RealtimeConnectionStatus
 * @typedef {{
 *   connected: boolean,
 *   hasToken: boolean,
 *   hasTracking: boolean,
 *   terminal: boolean,
 *   visibilityState?: DocumentVisibilityState,
 * }} PollingPolicyInput
 */

/** @param {PollingPolicyInput} input */
export function shouldPollOrder({
  connected,
  hasToken,
  hasTracking,
  terminal,
  visibilityState = 'visible',
}) {
  return !connected && hasToken && hasTracking && !terminal && visibilityState === 'visible';
}

/**
 * @param {{
 *   lastFetchedAt: number,
 *   now: number,
 *   minIntervalMs?: number,
 * }} input
 */
export function shouldReconcileOrderTracking({
  lastFetchedAt,
  now,
  minIntervalMs = ORDER_CONNECTION_RECONCILE_MIN_MS,
}) {
  return !lastFetchedAt || now - lastFetchedAt >= minIntervalMs;
}

/** @param {RealtimeConnectionStatus} status */
export function realtimeConnectionLabel(status) {
  if (status === 'connected') return 'Live updates connected';
  if (status === 'polling') return 'Live updates via polling';
  return 'Live updates reconnecting';
}
