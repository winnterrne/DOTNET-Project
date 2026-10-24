const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const TOKEN_KEY = 'dfgym_jwt_token';

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const token = getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options?.headers as Record<string, string>) || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = response.statusText;
    try {
      const errorData = (await response.json()) as { message?: string };
      if (errorData?.message) {
        errorMessage = errorData.message;
      }
    } catch {
      const errorText = await response.text();
      if (errorText) errorMessage = errorText;
    }

    if (response.status === 401 || response.status === 403) {
      setAuthToken(null);
    }

    throw new Error(errorMessage || `API Error [${response.status}]`);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}
