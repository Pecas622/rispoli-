const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

async function request(endpoint, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };

  const res = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers, credentials: 'include' });

  // 204 No Content
  if (res.status === 204) return null;

  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.message || `Error ${res.status}`);
    err.code    = data.code;
    err.email   = data.email;
    err.devCode = data.devCode;
    throw err;
  }
  return data;
}

export const api = {
  get:    (endpoint)       => request(endpoint),
  post:   (endpoint, body) => request(endpoint, { method: 'POST',   body: JSON.stringify(body) }),
  patch:  (endpoint, body) => request(endpoint, { method: 'PATCH',  body: JSON.stringify(body) }),
  delete: (endpoint)       => request(endpoint, { method: 'DELETE' }),
};

// ── Auth ──────────────────────────────────────────────────
export const authApi = {
  register:       (name, email, password) => api.post('/auth/register', { name, email, password }),
  login:          (email, password)       => api.post('/auth/login', { email, password }),
  google:         (credential)            => api.post('/auth/google', { credential }),
  verifyEmail:    (email, code)           => api.post('/auth/verify-email', { email, code }),
  resendCode:     (email)                 => api.post('/auth/resend-code', { email }),
  me:             ()                      => api.get('/auth/me'),
  logout:         ()                      => api.post('/auth/logout', {}),
  forgotPassword: (email)                 => api.post('/auth/forgot-password', { email }),
  resetPassword:  (token, password)       => api.post('/auth/reset-password', { token, password }),
  changePassword: (currentPassword, newPassword) => api.post('/auth/change-password', { currentPassword, newPassword }),
};

// ── Courses ───────────────────────────────────────────────
export const coursesApi = {
  list:   (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/courses${qs ? `?${qs}` : ''}`);
  },
  get:    (id)   => api.get(`/courses/${id}`),
  create: (data) => api.post('/courses', data),
  update: (id, data) => api.patch(`/courses/${id}`, data),
  delete: (id)   => api.delete(`/courses/${id}`),
};

// ── Content (modules & lessons) ───────────────────────────
export const modulesApi = {
  list:    (courseId)        => api.get(`/courses/${courseId}/modules`),
  create:  (courseId, data)  => api.post(`/courses/${courseId}/modules`, data),
  update:  (id, data)        => api.patch(`/modules/${id}`, data),
  remove:  (id)              => api.delete(`/modules/${id}`),
  reorder: (courseId, items) => request(`/courses/${courseId}/modules/reorder`, { method: 'PUT', body: JSON.stringify(items) }),
};

export const lessonsApi = {
  create:  (moduleId, data)  => api.post(`/modules/${moduleId}/lessons`, data),
  update:  (id, data)        => api.patch(`/lessons/${id}`, data),
  remove:  (id)              => api.delete(`/lessons/${id}`),
  reorder: (moduleId, items) => request(`/modules/${moduleId}/lessons/reorder`, { method: 'PUT', body: JSON.stringify(items) }),
};

// ── Enrollments ───────────────────────────────────────────
export const enrollmentsApi = {
  mine: () => api.get('/enrollments/me'),
  all:  (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/enrollments${qs ? `?${qs}` : ''}`);
  },
  free: (courseId, userId) => api.post(`/enrollments/${courseId}/free`, { userId }),
};

// ── Users (admin) ──────────────────────────────────────────
export const usersApi = {
  list:   (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/users${qs ? `?${qs}` : ''}`);
  },
  update: (id, data) => api.patch(`/users/${id}`, data),
  remove: (id)        => api.delete(`/users/${id}`),
};

// ── Progress ──────────────────────────────────────────────
export const progressApi = {
  getCourse:      (courseId)  => api.get(`/progress/${courseId}`),
  completeLesson: (lessonId)  => api.post(`/progress/lesson/${lessonId}`, {}),
  uncompleteLesson: (lessonId) => api.delete(`/progress/lesson/${lessonId}`),
};

// ── Payments ──────────────────────────────────────────────
export const paymentsApi = {
  checkout:            (courseId) => api.post(`/payments/checkout/${courseId}`, {}),
  checkoutMercadoPago: (courseId, installments) => api.post(`/payments/mercadopago/${courseId}`, { installments }),
  history:             ()         => api.get('/payments/history'),
  adminList: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/payments${qs ? `?${qs}` : ''}`);
  },
};
