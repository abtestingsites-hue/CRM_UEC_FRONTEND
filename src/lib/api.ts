export const getApiBaseUrl = (): string => {
  if (process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.startsWith('http')) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host !== 'localhost' && host !== '127.0.0.1') {
      return 'https://crm-uec-backend.onrender.com';
    }
    return `http://${host}:4000`;
  }
  return 'https://crm-uec-backend.onrender.com';
};

export const sanitizeRecordingUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  const baseUrl = getApiBaseUrl();
  if (url.includes('localhost:4000') || url.includes('127.0.0.1:4000')) {
    return url.replace(/http:\/\/(localhost|127\.0\.0\.1):4000/g, baseUrl);
  }
  if (url.startsWith('/')) {
    return `${baseUrl}${url}`;
  }
  return url;
};

const BASE_URL = getApiBaseUrl();
class APIClient {
  private getToken() {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('access_token') || 
           localStorage.getItem('paramantra_access_token') || 
           localStorage.getItem('crm_token');
  }

  async request<T = Response>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers = new Headers(options.headers || {});
    
    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }
    
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds timeout

    try {
      const activeBaseUrl = getApiBaseUrl();
      const url = endpoint.startsWith('http') ? endpoint : `${activeBaseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
      const res = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return res as unknown as T;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. Please try again.');
      }
      throw error;
    }
  }

  async get<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
    const res = await this.request(endpoint, { ...options, method: 'GET' });
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    return res.json();
  }

  async post<T = any>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
    const res = await this.request(endpoint, { 
      ...options, 
      method: 'POST', 
      body: body instanceof FormData ? body : JSON.stringify(body) 
    });
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    return res.json();
  }

  async patch<T = any>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
    const res = await this.request(endpoint, { 
      ...options, 
      method: 'PATCH', 
      body: body instanceof FormData ? body : JSON.stringify(body) 
    });
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    return res.json();
  }

  async delete<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
    const res = await this.request(endpoint, { ...options, method: 'DELETE' });
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    return res.json();
  }
}

export const api = new APIClient();
export const apiFetch = <T = Response>(endpoint: string, options?: RequestInit) => api.request<T>(endpoint, options);
export const API_BASE_URL = BASE_URL;
