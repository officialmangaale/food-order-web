'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { OfferBannerFallback } from '@/components/home/OfferBannerFallback';
import { normalizeImageUrl } from '@/utils/imageUrl';

export interface HeroImageQualityState {
  status: 'missing' | 'loading' | 'ready' | 'error' | 'low-quality';
  naturalWidth?: number;
  naturalHeight?: number;
  fit?: 'cover' | 'contain';
  reason?: string;
}

interface SmartHeroImageProps {
  src?: string;
  fallbackSrc?: string;
  alt: string;
  priority?: boolean;
  className?: string;
  onQualityChange?: (state: HeroImageQualityState) => void;
}

const MIN_HERO_IMAGE_WIDTH = 640;
const MIN_HERO_IMAGE_HEIGHT = 350;
const MIN_HERO_ASPECT_RATIO = 1.7;

export function SmartHeroImage({
  src,
  fallbackSrc,
  alt,
  priority,
  className = '',
  onQualityChange,
}: SmartHeroImageProps) {
  const sources = useMemo(() => getImageSources(src, fallbackSrc), [src, fallbackSrc]);
  const onQualityChangeRef = useRef(onQualityChange);
  const [sourceIndex, setSourceIndex] = useState(0);
  const currentSrc = sources[sourceIndex] ?? sources[0];
  const [state, setState] = useState<HeroImageQualityState>(() => getInitialQualityState(currentSrc));

  const updateState = useCallback((nextState: HeroImageQualityState) => {
    setState(nextState);
    onQualityChangeRef.current?.(nextState);
  }, []);

  const tryNextSource = useCallback((finalState: HeroImageQualityState) => {
    if (sourceIndex < sources.length - 1) {
      setSourceIndex((current) => current + 1);
      updateState({ status: 'loading' });
      return;
    }

    updateState(finalState);
  }, [sourceIndex, sources.length, updateState]);

  useEffect(() => {
    onQualityChangeRef.current = onQualityChange;
  }, [onQualityChange]);

  const canRenderImage =
    Boolean(currentSrc) && state.status !== 'error' && state.status !== 'low-quality';
  const showImage = canRenderImage && state.status === 'ready';
  const imageFit = state.fit ?? 'cover';

  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      <div
        aria-hidden="true"
        className={`absolute inset-0 transition-opacity duration-500 ${showImage ? 'opacity-0' : 'opacity-100'}`}
      >
        <OfferBannerFallback />
      </div>
      {canRenderImage && currentSrc && (
        <>
          {showImage && imageFit === 'contain' && (
            /* Partner-hosted imagery — see the note in ui/Thumbnail.tsx. */
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={currentSrc}
              alt=""
              aria-hidden="true"
              decoding="async"
              draggable={false}
              className="absolute inset-0 h-full w-full scale-110 object-cover object-center opacity-35 blur-xl"
            />
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={currentSrc}
            src={currentSrc}
            alt={alt}
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'auto'}
            decoding="async"
            draggable={false}
            className={`absolute inset-0 h-full w-full transition-opacity duration-500 ${
              imageFit === 'contain'
                ? 'object-contain object-right'
                : 'object-cover object-center'
            } ${showImage ? 'opacity-100' : 'opacity-0'}`}
            onLoad={(event) => {
              const image = event.currentTarget;
              const qualityState = getQualityState(image.naturalWidth, image.naturalHeight);
              if (qualityState.status === 'ready') {
                updateState(qualityState);
                return;
              }

              tryNextSource(qualityState);
            }}
            onError={() => tryNextSource({ status: 'error', reason: 'load-error' })}
          />
        </>
      )}
    </div>
  );
}

function getImageSources(src?: string, fallbackSrc?: string) {
  const seen = new Set<string>();
  const candidates = [src, fallbackSrc];
  const sources: string[] = [];

  for (const candidate of candidates) {
    const normalized = normalizeImageUrl(candidate);
    if (!normalized || seen.has(normalized) || isLikelyLogoSource(normalized)) continue;

    seen.add(normalized);
    sources.push(normalized);
  }

  return sources;
}

function getInitialQualityState(src?: string): HeroImageQualityState {
  if (!src) {
    return { status: 'missing', reason: 'missing-src' };
  }

  if (isLikelyLogoSource(src)) {
    return { status: 'low-quality', reason: 'logo-like-source' };
  }

  return { status: 'loading' };
}

function getQualityState(naturalWidth: number, naturalHeight: number): HeroImageQualityState {
  const aspectRatio = naturalHeight > 0 ? naturalWidth / naturalHeight : 0;

  if (naturalWidth < MIN_HERO_IMAGE_WIDTH || naturalHeight < MIN_HERO_IMAGE_HEIGHT) {
    return {
      status: 'low-quality',
      naturalWidth,
      naturalHeight,
      reason: 'too-small',
    };
  }

  return {
    status: 'ready',
    naturalWidth,
    naturalHeight,
    fit: aspectRatio < MIN_HERO_ASPECT_RATIO ? 'contain' : 'cover',
  };
}

function isLikelyLogoSource(src: string) {
  const normalized = src.toLowerCase();
  return /(^|[/?&=_-])(logo|logos|icon|icons|avatar|profile)([/?&=_.-]|$)/.test(normalized);
}
