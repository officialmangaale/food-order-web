export const ORDER_POLL_INTERVAL_MS = 15_000;
export const ORDER_POLL_ACTIVATION_DELAY_MS = 1_500;

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

/** @param {RealtimeConnectionStatus} status */
export function realtimeConnectionLabel(status) {
  if (status === 'connected') return 'Live updates connected';
  if (status === 'polling') return 'Live updates via polling';
  return 'Live updates reconnecting';
}
