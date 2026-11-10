import axios from 'axios';

const resolveBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL;
  if (envUrl) {
    const cleanUrl = envUrl.trim().replace(/\/+$/, '');
    return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
  }
  // In production builds (or when hosted outside localhost), default directly to live Render backend
  if (
    import.meta.env.PROD ||
    (typeof window !== 'undefined' &&
     window.location.hostname !== 'localhost' &&
     window.location.hostname !== '127.0.0.1')
  ) {
    return 'https://hara-workshop.onrender.com/api';
  }
  return '/api';
};

export const api = axios.create({
  baseURL: resolveBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Safely extracts an array from DRF paginated { count, results: [...] } or non-paginated [...] responses.
 * Prevents non-array strings (e.g. HTML from SPA fallbacks) or objects from causing runtime type errors.
 */
export function extractResults<T = any>(data: any): T[] {
  if (!data) return [];
  if (Array.isArray(data.results)) return data.results;
  if (Array.isArray(data)) return data;
  return [];
}

// Clean up any legacy tokens from previous authentication
try {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
} catch {}

api.interceptors.request.use((config) => {
  // If sending FormData, delete Content-Type so browser/Axios automatically sets
  // multipart/form-data with the correct boundary parameter.
  if (config.data instanceof FormData) {
    if (config.headers) {
      delete config.headers['Content-Type'];
      delete config.headers['content-type'];
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    // Detect HTML responses (e.g. from SPA routing rewrites or misconfigured backend URLs)
    const contentType = String(response.headers?.['content-type'] || '');
    if (
      typeof response.data === 'string' &&
      (response.data.trim().startsWith('<!DOCTYPE') ||
       response.data.trim().startsWith('<html') ||
       contentType.includes('text/html'))
    ) {
      return Promise.reject(
        new Error(`API returned an HTML document instead of JSON from ${response.config?.url || 'server'}`)
      );
    }
    return response;
  },
  (error) => Promise.reject(error)
);

// Public Domain API Modules
export const coreApi = {
  getSettings: () => api.get('/settings/'),
};

export const contactApi = {
  sendMessage: (data: { name: string; phone: string; email?: string; message: string }) =>
    api.post('/contact/', data),
};

export const productsApi = {
  getAll: (params?: any) => api.get('/products/', { params }),
  getById: (id: string) => api.get(`/products/${id}/`),
  getSubcategories: (params?: { service_category?: string; service_slug?: string }) =>
    api.get('/products/subcategories/', { params }),
};

export const categoriesApi = {
  getAll: (params?: any) => api.get('/products/categories/', { params }),
  getById: (id: string) => api.get(`/products/categories/${id}/`),
};

export const servicesApi = {
  getAll: (params?: any) => api.get('/services/', { params }),
  getById: (id: string) => api.get(`/services/${id}/`),
};

export const quotesApi = {
  create: (data: any) => api.post('/quotations/', data),
};

export default api;
