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
}

export interface HttpError {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
}

/** Build a fully qualified URL for restaurant-service */
export function restaurantUrl(path: string): string {
  return `${RESTAURANT_BASE}${path}`;
}

/** Build a fully qualified URL for user-service */
export function userServiceUrl(path: string): string {
  return `${USER_BASE}${path}`;
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
  const { method = 'GET', body, headers = {}, token, timeout = TIMEOUT_MS } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

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
      const message =
        (errData?.message as string) ??
        (errData?.error as string) ??
        `Request failed with status ${res.status}`;

      const httpError: HttpError = {
        status: res.status,
        message,
        errors: errData?.errors as Record<string, string[]> | undefined,
      };
      throw httpError;
    }

    return data as T;
  } catch (err) {
    clearTimeout(timer);

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
