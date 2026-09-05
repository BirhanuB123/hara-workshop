import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/login/')) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const res = await axios.post('/api/auth/refresh/', { refresh: refreshToken });
          const newAccess = res.data.access;
          localStorage.setItem('access_token', newAccess);
          originalRequest.headers.Authorization = `Bearer ${newAccess}`;
          return api(originalRequest);
        } catch {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Specific Domain API Modules
export const coreApi = {
  getSettings: () => api.get('/settings/'),
  updateSettings: (data: any) => api.patch('/settings/update_settings/', data),
  getAuditLogs: (params?: any) => api.get('/audit-logs/', { params }),
};

export const accountsApi = {
  login: (credentials: any) => api.post('/auth/login/', credentials),
  register: (data: any) => api.post('/auth/register/', data),
  getMe: () => api.get('/auth/me/'),
  updateProfile: (data: any) => api.patch('/auth/profile/', data),
  getUsers: (params?: any) => api.get('/users/', { params }),
  getUserById: (id: string) => api.get(`/users/${id}/`),
};

export const productsApi = {
  getAll: (params?: any) => api.get('/products/', { params }),
  getById: (id: string) => api.get(`/products/${id}/`),
  create: (data: any) => api.post('/products/', data),
  update: (id: string, data: any) => api.patch(`/products/${id}/`, data),
  delete: (id: string) => api.delete(`/products/${id}/`),
};

export const categoriesApi = {
  getAll: () => api.get('/categories/'),
  getById: (id: string) => api.get(`/categories/${id}/`),
  create: (data: any) => api.post('/categories/', data),
};

export const servicesApi = {
  getAll: (params?: any) => api.get('/services/', { params }),
  getById: (id: string) => api.get(`/services/${id}/`),
  create: (data: any) => api.post('/services/', data),
};

export const projectsApi = {
  getAll: (params?: any) => api.get('/projects/', { params }),
  getById: (id: string) => api.get(`/projects/${id}/`),
  create: (data: any) => api.post('/projects/', data),
};

export const quotesApi = {
  getAll: (params?: any) => api.get('/quotations/', { params }),
  getById: (id: string) => api.get(`/quotations/${id}/`),
  create: (data: any) => api.post('/quotations/', data),
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

export const invoicesApi = {
  getAll: (params?: any) => api.get('/invoices/', { params }),
  getById: (id: string) => api.get(`/invoices/${id}/`),
  create: (data: any) => api.post('/invoices/', data),
};

export const paymentsApi = {
  getAll: (params?: any) => api.get('/payments/', { params }),
  getById: (id: string) => api.get(`/payments/${id}/`),
  create: (data: any) => api.post('/payments/', data),
  verify: (id: string) => api.post(`/payments/${id}/verify/`),
};

export const expensesApi = {
  getAll: (params?: any) => api.get('/expenses/', { params }),
  getById: (id: string) => api.get(`/expenses/${id}/`),
  create: (data: any) => api.post('/expenses/', data),
};

export const messagingApi = {
  getConversations: () => api.get('/messaging/conversations/'),
  getConversation: (id: string) => api.get(`/messaging/conversations/${id}/`),
  sendMessage: (convId: string, content: string, attachment?: any) =>
    api.post(`/messaging/conversations/${convId}/messages/`, { content, attachment }),
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
