import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(cfg => {
  const token = sessionStorage.getItem('cci_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      sessionStorage.clear();
      window.location.href = '/admin/login';
    }
    return Promise.reject(err);
  }
);

export const booksAPI = {
  getAll:    p    => api.get('/api/books', { params: p }),
  getWeekly: ()   => api.get('/api/books/weekly'),
  create:    data => api.post('/api/books', data),
  update:    (id,data) => api.put(`/api/books/${id}`, data),
  setWeekly: id   => api.put(`/api/books/${id}/weekly`),
  delete:    id   => api.delete(`/api/books/${id}`),
};

export const loansAPI = {
  getAll:       p    => api.get('/api/loans', { params: p }),
  create:       data => api.post('/api/loans', data),
  requestPublic:data => api.post('/api/loans/public', data),
  markReturned: id   => api.patch(`/api/loans/${id}/return`),
  extend:       (id, data) => api.patch(`/api/loans/${id}/extend`, data),
  update:       (id,data) => api.put(`/api/loans/${id}`, data),
  delete:       id   => api.delete(`/api/loans/${id}`),
};

export const usersAPI = {
  getAll:       ()   => api.get('/api/users'),
  getStats:     ()   => api.get('/api/users/stats'),
  create:       data => api.post('/api/users', data),
  update:       (id,data) => api.put(`/api/users/${id}`, data),
  toggleActive: id   => api.patch(`/api/users/${id}/toggle`),
  delete:       id   => api.delete(`/api/users/${id}`),
  getHistory:   id   => api.get(`/api/users/${id}/history`),
};

export const statsAPI = {
  dashboard:  () => api.get('/api/stats/dashboard'),
  trackVisit: () => api.post('/api/stats/visit').catch(() => {}),
};

export const logsAPI = {
  getAll: p => api.get('/api/logs', { params: p }),
};

export const adminAPI = {
  getAdmins:      ()        => api.get('/api/admin/admins'),
  createAdmin:    data      => api.post('/api/admin/admins', data),
  changeRole:     (id,data) => api.put(`/api/admin/admins/${id}/role`, data),
  resetPassword:  (id,data) => api.put(`/api/admin/admins/${id}/password`, data),
  toggleAdmin:    id        => api.patch(`/api/admin/admins/${id}/toggle`),
  changeOwnPwd:   data      => api.put('/api/admin/change-password', data),
};

export const settingsAPI = {
  get:    () => api.get('/api/admin/settings'),
  update: data => api.put('/api/admin/settings', data),
};

export const grandsHommesAPI = {
  getAll:       ()        => api.get('/api/grands-hommes'),
  getById:      id        => api.get(`/api/grands-hommes/${id}`),
  getAllAdmin:   ()        => api.get('/api/grands-hommes/admin/all'),
  create:       data      => api.post('/api/grands-hommes', data),
  update:       (id,data) => api.put(`/api/grands-hommes/${id}`, data),
  toggle:       id        => api.patch(`/api/grands-hommes/${id}/toggle`),
  delete:       id        => api.delete(`/api/grands-hommes/${id}`),
};

export default api;