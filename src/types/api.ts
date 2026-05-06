/** Standard backend API response wrapper */
export interface ApiResponse<T = unknown> {
  status: string;
  statusCode: number;
  message: string;
  data: T;
}

/** Paginated list response */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

/** Generic API error shape */
export interface ApiError {
  status: string;
  statusCode: number;
  message: string;
  errors?: Record<string, string[]>;
}

/** Location coordinates */
export interface LatLng {
  latitude: number;
  longitude: number;
}
