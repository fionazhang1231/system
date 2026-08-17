// API 请求封装 - 统一错误处理
import type { ApiResponse } from '@/types';

/** 通用请求方法 */
async function request<T>(
  url: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        error: data.error || `请求失败 (${res.status})`,
      };
    }

    return data;
  } catch {
    return {
      success: false,
      error: '网络请求失败，请稍后重试',
    };
  }
}

/** GET 请求 */
export async function apiGet<T>(
  url: string,
  params?: Record<string, string | number | undefined>
): Promise<ApiResponse<T>> {
  const query = params
    ? '?' +
      new URLSearchParams(
        Object.entries(params).reduce<Record<string, string>>((acc, [k, v]) => {
          if (v !== undefined) acc[k] = String(v);
          return acc;
        }, {})
      ).toString()
    : '';
  return request<T>(`/api${url}${query}`);
}

/** POST 请求 */
export async function apiPost<T>(url: string, body?: unknown): Promise<ApiResponse<T>> {
  return request<T>(`/api${url}`, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/** PUT 请求 */
export async function apiPut<T>(url: string, body?: unknown): Promise<ApiResponse<T>> {
  return request<T>(`/api${url}`, {
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/** DELETE 请求 */
export async function apiDelete<T>(url: string): Promise<ApiResponse<T>> {
  return request<T>(`/api${url}`, { method: 'DELETE' });
}
