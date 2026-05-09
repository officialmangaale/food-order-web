'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { subscribeToOrder, type SSEHandlers } from '@/services/sse';
import { trackOrder } from '@/services/customerWebApi';
import { useAuthStore } from '@/store/authStore';
import { getErrorMessage } from '@/services/http';
import type { OrderSSEEvent, OrderStatus, TrackingOrder } from '@/types/order';
import { isTerminalStatus } from '@/types/order';
import { mergeTrackingOrderEvent, normalizeOrderStatus } from '@/utils/orderTrackingAdapter';

interface UseOrderSSEOptions {
  orderId: number;
  enabled?: boolean;
  onEvent?: (event: OrderSSEEvent) => void;
  onStatusChange?: (status: OrderStatus) => void;
}

export function useOrderSSE({ orderId, enabled = true, onEvent, onStatusChange }: UseOrderSSEOptions) {
  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<OrderSSEEvent | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!orderId || !enabled) {
      setConnected(false);
      return;
    }

    const handleEvent = (event: OrderSSEEvent) => {
      setLastEvent(event);
      onEvent?.(event);
      const status = extractStatus(event);
      if (status) onStatusChange?.(status);
    };

    const handlers: SSEHandlers = {
      onConnected: () => setConnected(true),
      onStatusUpdate: handleEvent,
      onSnapshot: handleEvent,
      onError: () => setConnected(false),
    };

    cleanupRef.current = subscribeToOrder(orderId, handlers);

    return () => {
      cleanupRef.current?.();
      cleanupRef.current = null;
      setConnected(false);
    };
  }, [enabled, onEvent, orderId, onStatusChange]);

  return { connected, lastEvent };
}

/** Combined hook: fetch initial tracking data + SSE live updates */
export function useOrderTracking(orderId: number) {
  const token = useAuthStore((s) => s.token);
  const [tracking, setTracking] = useState<TrackingOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchTracking = useCallback(async (showLoading = false) => {
    if (!orderId) {
      setError('Order ID is missing.');
      setErrorStatus(404);
      setLoading(false);
      return;
    }

    if (!token) {
      setError(null);
      setErrorStatus(null);
      setTracking(null);
      setLoading(false);
      return;
    }

    if (showLoading) setLoading(true);

    try {
      const data = await trackOrder(orderId, token);
      setTracking(data);
      setError(null);
      setErrorStatus(null);
    } catch (err) {
      setError(getErrorMessage(err));
      setErrorStatus(readErrorStatus(err));
    } finally {
      setLoading(false);
    }
  }, [orderId, token]);

  // Initial fetch
  useEffect(() => {
    void fetchTracking(true);
  }, [fetchTracking]);

  // SSE updates
  const handleLiveEvent = useCallback((event: OrderSSEEvent) => {
    setTracking((prev) => (prev ? mergeTrackingOrderEvent(prev, event) : prev));
  }, []);

  const handleStatusChange = useCallback((status: OrderStatus) => {
    // Stop polling if terminal
    if (isTerminalStatus(status) && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const { connected } = useOrderSSE({
    orderId,
    enabled: Boolean(token && tracking && !isTerminalStatus(tracking.orderStatus)),
    onEvent: handleLiveEvent,
    onStatusChange: handleStatusChange,
  });

  // Fallback polling if SSE disconnected
  useEffect(() => {
    if (!connected && token && !pollRef.current && tracking && !isTerminalStatus(tracking.orderStatus)) {
      pollRef.current = setInterval(() => void fetchTracking(false), 20000);
    }

    if (connected && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [connected, fetchTracking, token, tracking]);

  return {
    tracking,
    loading,
    error,
    errorStatus,
    authRequired: !token,
    connected,
    refetch: () => fetchTracking(true),
  };
}

function extractStatus(event: OrderSSEEvent): OrderStatus | null {
  const eventRecord = asRecord(event) ?? {};
  const dataRecord = asRecord(event.data) ?? {};
  const value =
    dataRecord.order_status ??
    dataRecord.orderStatus ??
    dataRecord.status ??
    eventRecord.order_status ??
    eventRecord.status;
  if (value == null) return null;
  return normalizeOrderStatus(value);
}

function readErrorStatus(error: unknown): number | null {
  if (error && typeof error === 'object' && 'status' in error) {
    const status = Number((error as { status?: unknown }).status);
    return Number.isFinite(status) ? status : null;
  }
  return null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}
