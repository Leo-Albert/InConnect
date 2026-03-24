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
    me: async () => (await apiInstance.get('/auth/me')) as any,
    login: async (payload: any) => (await apiInstance.post('/auth/login', payload)) as any,
    register: async (payload: any) => (await apiInstance.post('/auth/register', payload)) as any,
    logout: async () => (await apiInstance.post('/auth/logout')) as any,
  },
  profile: {
    uploadImage: (formData: FormData) => apiInstance.post('/profile/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  },
  topics: {
    getFeed: (page = 1, pageSize = 10) => apiInstance.get(`/topics?page=${page}&pageSize=${pageSize}`),
    search: (query: string, page = 1, pageSize = 10) => apiInstance.get(`/topics/search?query=${encodeURIComponent(query)}&page=${page}&pageSize=${pageSize}`),
    create: (payload: { title: string; content: string; categoryId: number }) => apiInstance.post('/topics', payload)
  }
};
