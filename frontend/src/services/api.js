/**
 * Axios API Instance — TeamAGI
 *
 * CRITICAL FIX:
 *   Do NOT set a default 'Content-Type' header on the instance.
 *   When axios sees a FormData body it auto-sets:
 *     Content-Type: multipart/form-data; boundary=----XYZ
 *   But if a default 'application/json' is pre-set on the instance,
 *   axios SKIPS the auto-detection and sends the wrong Content-Type,
 *   which causes multer to never parse the files → req.files = []
 *   → images never reach Cloudinary → only text saved to DB.
 *
 *   Solution: create the axios instance WITHOUT any Content-Type default.
 *   Axios will set 'application/json' automatically for plain objects,
 *   and 'multipart/form-data; boundary=...' automatically for FormData.
 */
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  // ✅ NO Content-Type default — let axios choose per-request
  withCredentials: true,
});

// ── Request interceptor: attach access token ──────────────────
api.interceptors.request.use(
  (config) => {
    try {
      const raw = localStorage.getItem('teamagi-auth');
      if (raw) {
        const { state } = JSON.parse(raw);
        if (state?.accessToken) {
          config.headers.Authorization = `Bearer ${state.accessToken}`;
        }
      }
    } catch {}
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: auto-refresh on 401 ────────────────
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (
      error.response?.status === 401 &&
      error.response?.data?.code === 'TOKEN_EXPIRED' &&
      !original._retry
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const raw = localStorage.getItem('teamagi-auth');
        const { state } = raw ? JSON.parse(raw) : {};
        if (!state?.refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post('/api/auth/refresh', {
          refreshToken: state.refreshToken,
        });

        const stored = JSON.parse(localStorage.getItem('teamagi-auth'));
        stored.state.accessToken = data.accessToken;
        stored.state.refreshToken = data.refreshToken;
        localStorage.setItem('teamagi-auth', JSON.stringify(stored));

        processQueue(null, data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch (err) {
        processQueue(err, null);
        localStorage.removeItem('teamagi-auth');
        window.location.href = '/login';
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
