import axios from 'axios';
import { emitErrorToast, emitSuccessToast } from "../utils/toastEvents";

const API_BASE = "";

export const apiClient = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // For cookie-based refresh tokens
  headers: {
    "Content-Type": "application/json"
  }
});

let accessToken = null;

export const setAccessToken = (token) => {
  accessToken = token;
};

// Add token to requests
apiClient.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 and token refresh
apiClient.interceptors.response.use(
  (response) => {
    const method = (response?.config?.method || "get").toLowerCase();
    const shouldToastSuccess = ["post", "put", "patch", "delete"].includes(method) && !response?.config?.silentSuccessToast;

    if (shouldToastSuccess) {
      emitSuccessToast("Islem basariyla tamamlandi.");
    }

    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const res = await axios.post(`/api/auth/refresh`, {}, { withCredentials: true });
        accessToken = res.data.accessToken;
        apiClient.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, user needs to login again
        accessToken = null;
        const refreshMessage = refreshError?.response?.data?.message || refreshError?.response?.data?.Message || "Oturum yenilenemedi.";
        emitErrorToast(refreshMessage);
        return Promise.reject(refreshError);
      }
    }

    const message = error?.response?.data?.message || error?.response?.data?.Message || "Islem sirasinda bir hata olustu.";
    emitErrorToast(message);

    return Promise.reject(error);
  }
);
