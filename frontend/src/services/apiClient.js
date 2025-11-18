import axios from 'axios';

// Buat instance Axios dengan konfigurasi dasar
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

// Gunakan interceptor untuk menambahkan token otorisasi ke setiap permintaan
// Ini jauh lebih baik daripada menambahkannya secara manual setiap kali.
apiClient.interceptors.request.use(
  (config) => {
    // Ambil token dari local storage (atau di mana pun Anda menyimpannya)
    const token = localStorage.getItem('authToken');
    if (token) {
      // Jika token ada, tambahkan ke header Authorization
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;