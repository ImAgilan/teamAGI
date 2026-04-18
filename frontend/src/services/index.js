/**
 * API Service Modules — TeamAGI
 * Fix: postService.createPost sends FormData without Content-Type override
 *      so browser sets multipart/form-data with correct boundary automatically
 */
import api from './api';

// ── Auth ──────────────────────────────────────────────────────
export const authService = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  refreshToken: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post(`/auth/reset-password/${token}`, { password }),
};

// ── Posts ─────────────────────────────────────────────────────
export const postService = {
  getFeed: (page = 1) => api.get(`/posts/feed?page=${page}&limit=10`),
  getTrending: (page = 1) => api.get(`/posts/trending?page=${page}`),
  getPost: (id) => api.get(`/posts/${id}`),
  getUserPosts: (userId, page = 1) => api.get(`/posts/user/${userId}?page=${page}&limit=12`),
  getBookmarks: () => api.get('/posts/bookmarks'),

  // IMPORTANT: Pass FormData directly — do NOT set Content-Type manually.
  // Axios detects FormData and sets multipart/form-data with correct boundary.
  createPost: (formData) => api.post('/posts', formData),

  updatePost: (id, data) => api.put(`/posts/${id}`, data),
  deletePost: (id) => api.delete(`/posts/${id}`),
  toggleLike: (id) => api.post(`/posts/${id}/like`),
  toggleBookmark: (id) => api.post(`/posts/${id}/bookmark`),
  repost: (id, data) => api.post(`/posts/${id}/repost`, data),
};

// ── Comments ──────────────────────────────────────────────────
export const commentService = {
  getComments: (postId, page = 1) => api.get(`/comments/${postId}?page=${page}`),
  addComment: (postId, data) => api.post(`/comments/${postId}`, data),
  deleteComment: (id) => api.delete(`/comments/${id}`),
  toggleLike: (id) => api.post(`/comments/${id}/like`),
};

// ── Users ─────────────────────────────────────────────────────
export const userService = {
  getProfile: (username) => api.get(`/users/${username}`),
  updateProfile: (data) => api.put('/users/profile', data),

  // Avatar/cover: pass FormData, axios handles Content-Type automatically
  uploadAvatar: (formData) => api.post('/users/avatar', formData),
  uploadCover: (formData) => api.post('/users/cover', formData),

  getSuggestions: () => api.get('/users/suggestions'),
  getFollowers: (id, page = 1) => api.get(`/users/${id}/followers?page=${page}`),
  getFollowing: (id, page = 1) => api.get(`/users/${id}/following?page=${page}`),
  changePassword: (data) => api.put('/users/change-password', data),
};

// ── Follow ────────────────────────────────────────────────────
export const followService = {
  toggleFollow: (userId) => api.post(`/follows/${userId}`),
};

// ── Messages ──────────────────────────────────────────────────
export const messageService = {
  getConversations: () => api.get('/messages/conversations'),
  getMessages: (conversationId, page = 1) => api.get(`/messages/${conversationId}?page=${page}`),
  sendMessage: (data) => api.post('/messages/send', data),
  deleteMessage: (id) => api.delete(`/messages/${id}`),
};

// ── Notifications ─────────────────────────────────────────────
export const notificationService = {
  getNotifications: (page = 1) => api.get(`/notifications?page=${page}`),
  markAllRead: () => api.put('/notifications/read-all'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  delete: (id) => api.delete(`/notifications/${id}`),
};

// ── Search ────────────────────────────────────────────────────
export const searchService = {
  search: (q, type = 'all') => api.get(`/search?q=${encodeURIComponent(q)}&type=${type}`),
  getTrendingHashtags: () => api.get('/search/trending-hashtags'),
  getPostsByHashtag: (tag, page = 1) => api.get(`/search/hashtag/${tag}?page=${page}`),
};

// ── Admin ─────────────────────────────────────────────────────
export const adminService = {
  getAnalytics: () => api.get('/admin/analytics'),
  getUsers: (params) => api.get('/admin/users', { params }),
  banUser: (id, reason) => api.put(`/admin/users/${id}/ban`, { reason }),
  unbanUser: (id) => api.put(`/admin/users/${id}/unban`),
  changeRole: (id, role) => api.put(`/admin/users/${id}/role`, { role }),
  getPosts: (page = 1) => api.get(`/admin/posts?page=${page}`),
  removePost: (id, reason) => api.delete(`/admin/posts/${id}`, { data: { reason } }),
};
