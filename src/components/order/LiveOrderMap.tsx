'use client';

import { useEffect, useRef, useState } from 'react';
import type { MutableRefObject } from 'react';
import type { TrackingOrder } from '@/types/order';
import { webMapsConfig } from '@/config/maps';

declare global {
  interface Window {
    google?: any;
    __mangaaleGoogleMapsPromise?: Promise<void>;
  }
}

interface LiveOrderMapProps {
  order: TrackingOrder;
}

export function LiveOrderMap({ order }: LiveOrderMapProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Record<string, any>>({});
  const routeRef = useRef<any>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then(() => {
        if (cancelled || !ref.current || !window.google) return;
        const points = trackingPoints(order);
        if (!points.length) return;
        if (!mapRef.current) {
          mapRef.current = new window.google.maps.Map(ref.current, {
            center: points[0],
            zoom: 14,
            disableDefaultUI: true,
            zoomControl: true,
            gestureHandling: 'greedy',
          });
        }
        renderMap(mapRef.current, markersRef.current, routeRef, order);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [order]);

  if (failed) {
    return <div className="flex aspect-[16/10] items-center justify-center bg-brand-50 text-sm font-bold text-ink-muted">Map unavailable</div>;
  }

  return <div ref={ref} className="aspect-[16/10] w-full bg-brand-50" />;
}

function loadGoogleMaps(): Promise<void> {
  if (window.google?.maps) return Promise.resolve();
  if (window.__mangaaleGoogleMapsPromise) return window.__mangaaleGoogleMapsPromise;
  window.__mangaaleGoogleMapsPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(webMapsConfig.browserKey)}&libraries=geometry&v=weekly`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('google maps failed'));
    document.head.appendChild(script);
  });
  return window.__mangaaleGoogleMapsPromise;
}

function renderMap(map: any, markers: Record<string, any>, routeRef: MutableRefObject<any>, order: TrackingOrder) {
  const google = window.google;
  if (!google?.maps) return;
  const bounds = new google.maps.LatLngBounds();
  const upsert = (key: string, position: { lat: number; lng: number }, title: string) => {
    bounds.extend(position);
    if (!markers[key]) {
      markers[key] = new google.maps.Marker({ map, position, title });
    } else {
      markers[key].setPosition(position);
      markers[key].setTitle(title);
    }
  };
  if (typeof order.restaurant.latitude === 'number' && typeof order.restaurant.longitude === 'number') {
    upsert('restaurant', { lat: order.restaurant.latitude, lng: order.restaurant.longitude }, order.restaurant.name || 'Pickup');
  }
  if (typeof order.deliveryAddress?.latitude === 'number' && typeof order.deliveryAddress.longitude === 'number') {
    upsert('delivery', { lat: order.deliveryAddress.latitude, lng: order.deliveryAddress.longitude }, 'Your address');
  }
  if (typeof order.rider?.latitude === 'number' && typeof order.rider.longitude === 'number') {
    upsert('rider', { lat: order.rider.latitude, lng: order.rider.longitude }, order.rider.name || 'Your rider');
  }
  if (order.route?.encodedPolyline && !order.route.stale && google.maps.geometry?.encoding) {
    const path = google.maps.geometry.encoding.decodePath(order.route.encodedPolyline);
    for (const point of path) bounds.extend(point);
    if (!routeRef.current) {
      routeRef.current = new google.maps.Polyline({ map, path, strokeColor: '#12312f', strokeWeight: 5 });
    } else {
      routeRef.current.setPath(path);
      routeRef.current.setMap(map);
    }
  } else if (routeRef.current) {
    routeRef.current.setMap(null);
  }
  if (!bounds.isEmpty()) map.fitBounds(bounds, 56);
}

function trackingPoints(order: TrackingOrder) {
  const points: { lat: number; lng: number }[] = [];
  if (typeof order.restaurant.latitude === 'number' && typeof order.restaurant.longitude === 'number') {
    points.push({ lat: order.restaurant.latitude, lng: order.restaurant.longitude });
  }
  if (typeof order.deliveryAddress?.latitude === 'number' && typeof order.deliveryAddress.longitude === 'number') {
    points.push({ lat: order.deliveryAddress.latitude, lng: order.deliveryAddress.longitude });
  }
  if (typeof order.rider?.latitude === 'number' && typeof order.rider.longitude === 'number') {
    points.push({ lat: order.rider.latitude, lng: order.rider.longitude });
  }
  return points;
}
