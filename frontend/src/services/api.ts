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

// Specific Domain API Modules
export const coreApi = {
  getSettings: () => api.get('/settings/'),
  updateSettings: (data: any) => api.patch('/settings/update_settings/', data),
  getAuditLogs: (params?: any) => api.get('/audit-logs/', { params }),
};

export const contactApi = {
  sendMessage: (data: { name: string; phone: string; email?: string; message: string }) =>
    api.post('/contact/', data),
};

export const accountsApi = {
  login: (credentials: any) => api.post('/auth/login/', credentials),
  register: (data: any) => api.post('/auth/register/', data),
  getMe: () => api.get('/auth/me/'),
  updateProfile: (data: any) => api.patch('/auth/profile/', data),
  getUsers: (params?: any) => api.get('/users/', { params }),
  getUserById: (id: string) => api.get(`/users/${id}/`),
};

export const customersApi = {
  getAll: (params?: any) => api.get('/customers/', { params }),
  getById: (id: string) => api.get(`/customers/${id}/`),
  update: (id: string, data: any) => api.patch(`/customers/${id}/`, data),
  toggleActive: (id: string) => api.post(`/customers/${id}/toggle_active/`),
};

export const productsApi = {
  getAll: (params?: any) => api.get('/products/', { params }),
  getById: (id: string) => api.get(`/products/${id}/`),
  getSubcategories: (params?: { service_category?: string; service_slug?: string }) =>
    api.get('/products/subcategories/', { params }),
  create: (data: any) => {
    const isFormData = data instanceof FormData;
    return api.post('/products/', data, isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined);
  },
  update: (id: string, data: any) => {
    const isFormData = data instanceof FormData;
    return api.patch(`/products/${id}/`, data, isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined);
  },
  delete: (id: string) => api.delete(`/products/${id}/`),
};

export const categoriesApi = {
  getAll: (params?: any) => api.get('/products/categories/', { params }),
  getById: (id: string) => api.get(`/products/categories/${id}/`),
  create: (data: any) => api.post('/products/categories/', data),
};

export const servicesApi = {
  getAll: (params?: any) => api.get('/services/', { params }),
  getById: (id: string) => api.get(`/services/${id}/`),
  create: (data: any) => {
    const isFormData = data instanceof FormData;
    return api.post('/services/', data, isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined);
  },
  update: (id: string, data: any) => {
    const isFormData = data instanceof FormData;
    return api.patch(`/services/${id}/`, data, isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined);
  },
  delete: (id: string) => api.delete(`/services/${id}/`),
  uploadImage: (id: string, formData: FormData) =>
    api.post(`/services/${id}/upload_image/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  replaceImage: (id: string, formData: FormData) =>
    api.post(`/services/${id}/replace_image/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  deleteImage: (id: string, imageId: string) =>
    api.post(`/services/${id}/delete_image/`, { image_id: imageId }),
  updateImage: (id: string, data: { image_id: string; caption?: string; description?: string; is_primary?: boolean; order?: number }) =>
    api.post(`/services/${id}/update_image/`, data),
  reorderImages: (id: string, imageIds: string[]) =>
    api.post(`/services/${id}/reorder_images/`, { image_ids: imageIds }),
  uploadImages: (id: string, formData: FormData) =>
    api.post(`/services/${id}/upload_images/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

export const projectsApi = {
  getAll: (params?: any) => api.get('/projects/', { params }),
  getById: (id: string) => api.get(`/projects/${id}/`),
  create: (data: any) => {
    const isFormData = data instanceof FormData;
    return api.post('/projects/', data, isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined);
  },
  update: (id: string, data: any) => {
    const isFormData = data instanceof FormData;
    return api.patch(`/projects/${id}/`, data, isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined);
  },
  delete: (id: string) => api.delete(`/projects/${id}/`),
  togglePublish: (id: string) => api.post(`/projects/${id}/toggle_publish/`),
};

export const quotesApi = {
  getAll: (params?: any) => api.get('/quotations/', { params }),
  getById: (id: string) => api.get(`/quotations/${id}/`),
  create: (data: any) => {
    const isFormData = data instanceof FormData;
    return api.post('/quotations/', data, isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined);
  },
  proposePrice: (id: string, data: any) => api.post(`/quotations/${id}/propose_price/`, data),
  accept: (id: string) => api.post(`/quotations/${id}/accept/`),
  reject: (id: string) => api.post(`/quotations/${id}/reject/`),
  convertToOrder: (id: string) => api.post(`/quotations/${id}/convert_to_order/`),
};

export const ordersApi = {
  getAll: (params?: any) => api.get('/orders/', { params }),
  getById: (id: string) => api.get(`/orders/${id}/`),
  create: (data: any) => api.post('/orders/', data),
  updateStatus: (id: string, status: string) => api.patch(`/orders/${id}/`, { status }),
};

export const productionApi = {
  getAll: (params?: any) => api.get('/production/', { params }),
  getById: (id: string) => api.get(`/production/${id}/`),
  updateStage: (id: string, data: any) => api.post(`/production/${id}/update_stage/`, data),
};

export const inventoryApi = {
  getAll: (params?: any) => api.get('/inventory/', { params }),
  getById: (id: string) => api.get(`/inventory/${id}/`),
  create: (data: any) => api.post('/inventory/', data),
  createTransaction: (data: any) => api.post('/inventory/transactions/', data),
  getLowStock: () => api.get('/inventory/low_stock/'),
};

export const suppliersApi = {
  getAll: (params?: any) => api.get('/suppliers/', { params }),
  getById: (id: string) => api.get(`/suppliers/${id}/`),
  create: (data: any) => api.post('/suppliers/', data),
};

export const messagingApi = {
  getConversations: (params?: any) => api.get('/messaging/conversations/', { params }),
  getConversation: (id: string) => api.get(`/messaging/conversations/${id}/`),
  createConversation: (data: any) => {
    const isFormData = data instanceof FormData;
    return api.post('/messaging/conversations/', data, isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined);
  },
  getGeneralConversation: (params?: any) => api.get('/messaging/conversations/general/', { params }),
  getMessages: (conversationId: string) => api.get(`/messaging/conversations/${conversationId}/messages/`),
  sendMessage: (conversationId: string, data: any) => {
    const isFormData = data instanceof FormData;
    return api.post(`/messaging/conversations/${conversationId}/messages/`, data, isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined);
  },
  markRead: (conversationId: string) => api.post(`/messaging/conversations/${conversationId}/mark_read/`),
  getUnreadCount: () => api.get('/messaging/conversations/unread_count/'),
  getCustomers: () => api.get('/messaging/conversations/customers/'),
};

export const notificationsApi = {
  getAll: () => api.get('/notifications/'),
  markAsRead: (id: string) => api.post(`/notifications/${id}/mark_read/`),
  markAllAsRead: () => api.post('/notifications/mark_all_read/'),
};

export const reportsApi = {
  getDashboardStats: () => api.get('/reports/dashboard_stats/'),
};

export default api;
