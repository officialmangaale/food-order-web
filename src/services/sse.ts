import type { OrderSSEEvent } from '@/types/order';

const RESTAURANT_BASE = process.env.NEXT_PUBLIC_RESTAURANT_SERVICE_BASE_URL ?? '';

export interface SSEHandlers {
  onStatusUpdate?: (event: OrderSSEEvent) => void;
  onSnapshot?: (event: OrderSSEEvent) => void;
  onError?: (error: Event) => void;
  onConnected?: () => void;
}

/**
 * Subscribe to live order updates via SSE.
 * Returns a cleanup function to close the connection.
 */
export function subscribeToOrder(orderId: number, handlers: SSEHandlers): () => void {
  const url = `${RESTAURANT_BASE}/orders/${orderId}/live`;

  let es: EventSource | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let reconnectAttempts = 0;
  const MAX_RECONNECT = 5;
  const BASE_DELAY = 3000;

  function connect() {
    es = new EventSource(url);

    es.onopen = () => {
      reconnectAttempts = 0;
      handlers.onConnected?.();
    };

    // Generic message handler
    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as OrderSSEEvent;
        if (data.type === 'snapshot') {
          handlers.onSnapshot?.(data);
        } else {
          handlers.onStatusUpdate?.(data);
        }
      } catch {
        // Non-JSON message, ignore
      }
    };

    // Named event listeners
    es.addEventListener('order_status_updated', (event) => {
      try {
        const data = JSON.parse((event as MessageEvent).data) as OrderSSEEvent;
        handlers.onStatusUpdate?.(data);
      } catch { /* ignore */ }
    });

    es.addEventListener('snapshot', (event) => {
      try {
        const data = JSON.parse((event as MessageEvent).data) as OrderSSEEvent;
        handlers.onSnapshot?.(data);
      } catch { /* ignore */ }
    });

    es.onerror = (error) => {
      handlers.onError?.(error);
      es?.close();

      if (reconnectAttempts < MAX_RECONNECT) {
        const delay = BASE_DELAY * Math.pow(2, reconnectAttempts);
        reconnectAttempts++;
        reconnectTimer = setTimeout(connect, delay);
      }
    };
  }

  connect();

  return () => {
    if (reconnectTimer) clearTimeout(reconnectTimer);
    es?.close();
    es = null;
  };
}
