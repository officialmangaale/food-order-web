import type { OrderSSEEvent } from '@/types/order';
import { buildOrderTrackingWebSocketUrl as buildOrderTrackingWebSocketUrlRaw } from '@/utils/websocketUrl.mjs';

const RESTAURANT_BASE = process.env.NEXT_PUBLIC_RESTAURANT_SERVICE_BASE_URL ?? '';
const RESTAURANT_WS_BASE = process.env.NEXT_PUBLIC_RESTAURANT_SERVICE_WS_BASE_URL ?? RESTAURANT_BASE;
const MAX_RECONNECT_DELAY_MS = 30_000;

export interface SSEHandlers {
  onStatusUpdate?: (event: OrderSSEEvent) => void;
  onSnapshot?: (event: OrderSSEEvent) => void;
  onError?: (error: Event) => void;
  onConnected?: () => void;
}

export function buildOrderTrackingWebSocketUrl(
  orderId: number,
  token: string,
  baseURL: string = RESTAURANT_WS_BASE,
): string {
  return buildOrderTrackingWebSocketUrlRaw(orderId, token, baseURL);
}

/**
 * Subscribe to the canonical authenticated order WebSocket. The legacy
 * function/file names remain for one compatibility window.
 */
export function subscribeToOrder(
  orderId: number,
  token: string,
  handlers: SSEHandlers,
): () => void {
  let socket: WebSocket | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let reconnectAttempts = 0;
  let stopped = false;

  const connect = () => {
    if (stopped) return;
    socket?.close();
    try {
      socket = new WebSocket(buildOrderTrackingWebSocketUrl(orderId, token));
    } catch {
      // A missing/malformed build-time service origin is surfaced through the
      // existing fallback state without logging a credential-bearing URL.
      handlers.onError?.(new Event('error'));
      return;
    }

    socket.onopen = () => {
      reconnectAttempts = 0;
      handlers.onConnected?.();
    };
    socket.onmessage = (message) => {
      try {
        const data = JSON.parse(message.data) as OrderSSEEvent;
        const eventName = String(data.event || '').toUpperCase();
        if (eventName === 'ORDER_SNAPSHOT' || data.type === 'order_snapshot') {
          handlers.onSnapshot?.(data);
        } else if (eventName !== 'CONNECTED' && data.type !== 'connected') {
          handlers.onStatusUpdate?.(data);
        }
      } catch {
        // Ignore malformed frames; the next snapshot/delta remains usable.
      }
    };
    socket.onerror = (event) => handlers.onError?.(event);
    socket.onclose = (event) => {
      if (stopped) return;
      handlers.onError?.(event);
      const exponent = Math.min(reconnectAttempts++, 8);
      const base = Math.min(1_000 * (2 ** exponent), MAX_RECONNECT_DELAY_MS);
      const jitter = Math.floor(Math.random() * Math.max(250, base * 0.25));
      reconnectTimer = setTimeout(connect, base + jitter);
    };
  };

  connect();

  return () => {
    stopped = true;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    socket?.close();
    socket = null;
  };
}
