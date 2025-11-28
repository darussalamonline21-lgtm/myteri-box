import axios from 'axios';

// Default API prefixes; keep configurable via env if provided
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
const ADMIN_API_BASE = import.meta.env.VITE_ADMIN_API_BASE_URL || '/admin/api';

const apiClient = axios.create({
  baseURL: API_BASE,
});

apiClient.interceptors.request.use(
  (config) => {
    const url = config.url || '';
    const isAdminRequest = url.startsWith('/admin');
    config.isAdminRequest = isAdminRequest;

    if (isAdminRequest) {
      // Arahkan request admin ke base backend yang benar: /admin/api/...
      config.baseURL = ADMIN_API_BASE;
      config.url = url.replace(/^\/admin(?:\/api)?/, '') || '/';

      config.headers = config.headers || {};
      const adminToken = localStorage.getItem('adminAuthToken');
      if (adminToken) {
        config.headers.Authorization = `Bearer ${adminToken}`;
      }
    } else {
      // Request user biasa tetap menggunakan prefix /api
      config.baseURL = API_BASE;
      config.headers = config.headers || {};
      const userToken = localStorage.getItem('authToken');
      if (userToken) {
        config.headers.Authorization = `Bearer ${userToken}`;
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Tangani 401 secara global: bersihkan token dan paksa login ulang
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url || '';
    // Jangan redirect otomatis saat login gagal; biarkan halaman menampilkan error
    const isAuthLogin = url.includes('/auth/login');

    if (status === 401 && !isAuthLogin) {
      const isAdmin = error.config?.isAdminRequest;
      if (isAdmin) {
        localStorage.removeItem('adminAuthToken');
        window.location.href = '/admin/login';
      } else {
        localStorage.removeItem('authToken');
        localStorage.removeItem('activeCampaignId');
        localStorage.removeItem('userId');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
