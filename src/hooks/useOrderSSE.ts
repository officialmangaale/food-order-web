'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { subscribeToOrder, type SSEHandlers } from '@/services/sse';
import { trackOrder } from '@/services/customerWebApi';
import { useAuthStore } from '@/store/authStore';
import type { OrderTrackingResponse, OrderSSEEvent, OrderStatus } from '@/types/order';
import { isTerminalStatus } from '@/types/order';

interface UseOrderSSEOptions {
  orderId: number;
  onStatusChange?: (status: OrderStatus) => void;
}

export function useOrderSSE({ orderId, onStatusChange }: UseOrderSSEOptions) {
  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<OrderSSEEvent | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!orderId) return;

    const handlers: SSEHandlers = {
      onConnected: () => setConnected(true),
      onStatusUpdate: (event) => {
        setLastEvent(event);
        if (event.status) {
          onStatusChange?.(event.status);
        }
      },
      onSnapshot: (event) => {
        setLastEvent(event);
        if (event.status) {
          onStatusChange?.(event.status);
        }
      },
      onError: () => setConnected(false),
    };

    cleanupRef.current = subscribeToOrder(orderId, handlers);

    return () => {
      cleanupRef.current?.();
    };
  }, [orderId, onStatusChange]);

  return { connected, lastEvent };
}

/** Combined hook: fetch initial tracking data + SSE live updates */
export function useOrderTracking(orderId: number) {
  const token = useAuthStore((s) => s.token);
  const [tracking, setTracking] = useState<OrderTrackingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchTracking = useCallback(async () => {
    if (!token || !orderId) return;
    try {
      const data = await trackOrder(orderId, token);
      setTracking(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load order');
    } finally {
      setLoading(false);
    }
  }, [orderId, token]);

  // Initial fetch
  useEffect(() => {
    fetchTracking();
  }, [fetchTracking]);

  // SSE updates
  const handleStatusChange = useCallback((status: OrderStatus) => {
    setTracking((prev) => prev ? { ...prev, status } : prev);

    // Stop polling if terminal
    if (isTerminalStatus(status) && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const { connected } = useOrderSSE({
    orderId,
    onStatusChange: handleStatusChange,
  });

  // Fallback polling if SSE disconnected
  useEffect(() => {
    if (!connected && !pollRef.current && tracking && !isTerminalStatus(tracking.status)) {
      pollRef.current = setInterval(fetchTracking, 20000);
    }

    if (connected && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [connected, tracking, fetchTracking]);

  return { tracking, loading, error, connected, refetch: fetchTracking };
}
