import axios from 'axios';

const apiInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL + "/api",
  withCredentials: true, // Required for cookie-based authentication
});

// Explicitly set the token if it exists in localStorage for redundancy/legacy compatibility
const token = localStorage.getItem('token');
console.log('[API Init] Token from localStorage:', token ? 'Found' : 'MISSING');
if (token && token !== "undefined") {
  apiInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

// Request interceptor to keep token in sync for future changes (Redundant but safe)
apiInstance.interceptors.request.use((config) => {
  const currentToken = localStorage.getItem('token');
  if (currentToken && currentToken !== "undefined") {
    if (config.headers.set) {
      config.headers.set('Authorization', `Bearer ${currentToken}`);
    } else {
      config.headers['Authorization'] = `Bearer ${currentToken}`;
    }
    console.log('[Axios Interceptor] Attached Bearer Token to:', config.url);
  } else {
    console.log('[Axios Interceptor] No Token found for:', config.url);
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Intercept responses to extract data natively and surface clean error messages
apiInstance.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || error.message || 'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

export const setAuthToken = (token: string | null) => {
  if (token) {
    localStorage.setItem('token', token);
    apiInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    localStorage.removeItem('token');
    delete apiInstance.defaults.headers.common['Authorization'];
  }
};

export const api = {
  auth: {
    register: (data: any) => apiInstance.post('/auth/register', data) as Promise<any>,
    login: (data: any) => apiInstance.post('/auth/login', data) as Promise<any>,
    logout: () => apiInstance.post('/auth/logout') as Promise<any>,
    me: () => apiInstance.get('/auth/me') as Promise<any>,
    forgotPassword: (email: string) => apiInstance.post('/auth/forgot-password', { email }) as Promise<any>,
    resetPassword: (data: any) => apiInstance.post('/auth/reset-password', data) as Promise<any>
  },
  profile: {
    getById: (id: string) => apiInstance.get(`/profile/${id}`) as Promise<any>,
    search: (query: string) => apiInstance.get(`/profile/search?q=${encodeURIComponent(query)}`) as Promise<any>,
    uploadImage: (formData: FormData) => apiInstance.post('/profile/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }) as Promise<any>,
    changePassword: (data: any) => apiInstance.post('/profile/change-password', data) as Promise<any>,
    updateEmail: (newEmail: string) => apiInstance.post('/profile/update-email', { newEmail }) as Promise<any>,
    getExportUrl: (id: string) => `${apiInstance.defaults.baseURL}/profile/${id}/export`,
    getExportPdfUrl: (id: string) => `${apiInstance.defaults.baseURL}/profile/${id}/export-pdf`
  },
  categories: {
    getAll: () => apiInstance.get('/categories') as Promise<any>,
    create: (name: string) => apiInstance.post('/categories', JSON.stringify(name), { headers: { 'Content-Type': 'application/json' } }) as Promise<any>,
    update: (id: number, name: string) => apiInstance.put(`/categories/${id}`, JSON.stringify(name), { headers: { 'Content-Type': 'application/json' } }) as Promise<any>,
    delete: (id: number) => apiInstance.delete(`/categories/${id}`) as Promise<any>
  },
  tags: {
    getAll: () => apiInstance.get('/tags') as Promise<any>,
    update: (id: number, name: string) => apiInstance.put(`/tags/${id}`, JSON.stringify(name), { headers: { 'Content-Type': 'application/json' } }) as Promise<any>,
    delete: (id: number) => apiInstance.delete(`/tags/${id}`) as Promise<any>
  },
  topics: {
    getFeed: (category?: string, tags?: string[], userId?: string, page = 1, pageSize = 10) => {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (tags) tags.forEach(t => params.append('tags', t));
      if (userId) params.append('userId', userId);
      params.append('page', page.toString());
      params.append('pageSize', pageSize.toString());
      return apiInstance.get(`/topics?${params.toString()}`) as Promise<any>;
    },
    getById: (id: string) => apiInstance.get(`/topics/${id}`) as Promise<any>,
    search: (query: string, page = 1, pageSize = 10) => apiInstance.get(`/topics/search?query=${encodeURIComponent(query)}&page=${page}&pageSize=${pageSize}`) as Promise<any>,
    create: (payload: { title: string; content: string; categoryId: number; tags?: string[] }) => apiInstance.post('/topics', payload) as Promise<any>,
    update: (id: string, payload: { title: string; content: string; categoryId: number; tags?: string[] }) => apiInstance.put(`/topics/${id}`, payload) as Promise<any>,
    delete: (id: string) => apiInstance.delete(`/topics/${id}`) as Promise<any>
  }
};
