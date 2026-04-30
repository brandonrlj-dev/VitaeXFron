import { throwError } from 'rxjs';

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: unknown;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export function unwrapData<T>(response: ApiEnvelope<T> | T): T {
  if (response && typeof response === 'object' && 'success' in response && 'data' in response) {
    return (response as ApiEnvelope<T>).data;
  }

  return response as T;
}

export function unwrapItems<T>(response: ApiEnvelope<PaginatedResponse<T> | T[]> | PaginatedResponse<T> | T[]): T[] {
  const data = unwrapData(response);
  if (Array.isArray(data)) return data;
  return data?.items ?? [];
}

export function toApiError(error: any, fallback = 'No se pudo completar la operacion') {
  const message = error?.error?.message ?? error?.message ?? fallback;
  return throwError(() => new Error(message));
}
