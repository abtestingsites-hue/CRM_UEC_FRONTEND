const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || `http://${hostname}:4000`;
class APIClient {
  private getToken() {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('access_token') || 
           localStorage.getItem('paramantra_access_token') || 
           localStorage.getItem('crm_token');
  }

  async request(endpoint: string, options: RequestInit = {}) {
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
      return res;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. Please try again.');
      }
      throw error;
    }
  }

  async get(endpoint: string, options?: RequestInit) {
    const res = await this.request(endpoint, { ...options, method: 'GET' });
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    return res.json();
  }

  async post(endpoint: string, body?: any, options?: RequestInit) {
    const res = await this.request(endpoint, { 
      ...options, 
      method: 'POST', 
      body: body instanceof FormData ? body : JSON.stringify(body) 
    });
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    return res.json();
  }

  async patch(endpoint: string, body?: any, options?: RequestInit) {
    const res = await this.request(endpoint, { 
      ...options, 
      method: 'PATCH', 
      body: body instanceof FormData ? body : JSON.stringify(body) 
    });
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    return res.json();
  }

  async delete(endpoint: string, options?: RequestInit) {
    const res = await this.request(endpoint, { ...options, method: 'DELETE' });
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    return res.json();
  }
}

export const api = new APIClient();
export const apiFetch = api.request.bind(api);
export const API_BASE_URL = BASE_URL;
