const RESTAURANT_BASE = process.env.NEXT_PUBLIC_RESTAURANT_SERVICE_BASE_URL ?? '';
const USER_BASE = process.env.NEXT_PUBLIC_USER_SERVICE_BASE_URL ?? '';

const TIMEOUT_MS = 15_000;

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
  token?: string;
  timeout?: number;
  signal?: AbortSignal;
}

export interface HttpError {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
}

/** Build a fully qualified URL for restaurant-service */
export function restaurantUrl(path: string): string {
  return `${getConfiguredBase(RESTAURANT_BASE, 'Restaurant service URL')}${path}`;
}

/** Build a fully qualified URL for user-service */
export function userServiceUrl(path: string): string {
  return `${getConfiguredBase(USER_BASE, 'User service URL')}${path}`;
}

/**
 * Core HTTP request helper.
 * Returns parsed JSON response.
 * Throws HttpError on non-2xx responses.
 */
export async function httpRequest<T = unknown>(
  url: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = 'GET', body, headers = {}, token, timeout = TIMEOUT_MS, signal } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort, { once: true });

  const reqHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...headers,
  };

  if (token) {
    reqHeaders['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(url, {
      method,
      headers: reqHeaders,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);

    // Try to parse JSON even on error responses
    let data: unknown;
    const contentType = res.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      data = await res.json();
    } else {
      data = await res.text();
    }

    if (!res.ok) {
      const errData = data as Record<string, unknown> | undefined;
      const httpError: HttpError = {
        status: res.status,
        message: extractHttpErrorMessage(data, res.status),
        errors: extractHttpErrorDetails(errData),
      };
      throw httpError;
    }

    return data as T;
  } catch (err) {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);

    // Already an HttpError from above
    if (err && typeof err === 'object' && 'status' in err && 'message' in err) {
      throw err;
    }

    // AbortError from timeout
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw { status: 0, message: 'Request timed out. Please check your connection.' } as HttpError;
    }

    // Network error
    throw {
      status: 0,
      message: 'Network error. Please check your connection and try again.',
    } as HttpError;
  }
}

/** Convenience: GET from restaurant service */
export function restaurantGet<T>(path: string, token?: string): Promise<T> {
  return httpRequest<T>(restaurantUrl(path), { token });
}

/** Convenience: POST to restaurant service */
export function restaurantPost<T>(path: string, body: unknown, options?: { token?: string; headers?: Record<string, string> }): Promise<T> {
  return httpRequest<T>(restaurantUrl(path), { method: 'POST', body, ...options });
}

/** Extract readable error message */
export function getErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) {
    return (err as HttpError).message;
  }
  if (err instanceof Error) return err.message;
  return 'Something went wrong. Please try again.';
}

/** Check if error is an auth error */
export function isAuthError(err: unknown): boolean {
  if (err && typeof err === 'object' && 'status' in err) {
    return (err as HttpError).status === 401;
  }
  return false;
}

function extractHttpErrorMessage(data: unknown, status: number): string {
  if (typeof data === 'string' && data.trim()) return data;
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return `Request failed with status ${status}`;
  }

  const map = data as Record<string, unknown>;
  const nested = map.error && typeof map.error === 'object' && !Array.isArray(map.error)
    ? map.error as Record<string, unknown>
    : undefined;
  const message = readNonEmptyString(map.message) ??
    readNonEmptyString(nested?.message) ??
    readNonEmptyString(map.error) ??
    readNonEmptyString(nested?.code);

  return message ?? `Request failed with status ${status}`;
}

function extractHttpErrorDetails(data: Record<string, unknown> | undefined): Record<string, string[]> | undefined {
  if (data?.errors && typeof data.errors === 'object' && !Array.isArray(data.errors)) {
    return data.errors as Record<string, string[]>;
  }
  const nested = data?.error && typeof data.error === 'object' && !Array.isArray(data.error)
    ? data.error as Record<string, unknown>
    : undefined;
  if (nested?.details && typeof nested.details === 'object' && !Array.isArray(nested.details)) {
    return nested.details as Record<string, string[]>;
  }
  return undefined;
}

function readNonEmptyString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function getConfiguredBase(value: string, label: string): string {
  const raw = value.trim();
  if (!raw) {
    throw {
      status: 0,
      message:
        process.env.NODE_ENV === 'development'
          ? `${label} is not configured. Set the matching NEXT_PUBLIC_*_BASE_URL environment variable.`
          : 'Service is temporarily unavailable. Please try again later.',
    } as HttpError;
  }

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw { status: 0, message: `${label} is invalid.` } as HttpError;
  }
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password || parsed.search || parsed.hash) {
    throw { status: 0, message: `${label} is invalid.` } as HttpError;
  }
  return `${parsed.origin}${parsed.pathname.replace(/\/+$/, '')}`;
}
