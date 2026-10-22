const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || `http://${hostname}:4000`;
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
      const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
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
