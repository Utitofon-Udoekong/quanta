import { ApiResponse } from '../types/api';

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string | number,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function fetchApi<T>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(input, init);
  const data: ApiResponse<T> = await response.json();

  if (!data.success) {
    throw new ApiError(
      data.error?.message || 'An unknown error occurred',
      response.status,
      data.error?.code,
      data.error?.details
    );
  }

  return data.data as T;
} 