import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/v1';

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('tst_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  r => r,
  async (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('tst_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const login = (data) => api.post('/auth/login', data).then(r => r.data);
export const getMe = () => api.get('/auth/me').then(r => r.data);

// Dashboard
export const getDashboardStats = () => api.get('/dashboard/stats').then(r => r.data);
export const getRecentBookings = () => api.get('/dashboard/recent-bookings').then(r => r.data);
export const getWeeklyRevenue = () => api.get('/dashboard/weekly-revenue').then(r => r.data);

// Rooms
export const getRooms = (params) => api.get('/rooms', { params }).then(r => r.data);
export const createRoom = (data) => api.post('/rooms', data).then(r => r.data);
export const updateRoom = (id, data) => api.put(`/rooms/${id}`, data).then(r => r.data);
export const deleteRoom = (id) => api.delete(`/rooms/${id}`).then(r => r.data);

// Bookings
export const getBookings = (params) => api.get('/bookings', { params }).then(r => r.data);
export const getBooking = (id) => api.get(`/bookings/${id}`).then(r => r.data);
export const confirmBooking = (id) => api.put(`/bookings/${id}/confirm`).then(r => r.data);
export const checkinBooking = (id) => api.put(`/bookings/${id}/checkin`).then(r => r.data);
export const checkoutBooking = (id) => api.put(`/bookings/${id}/checkout`).then(r => r.data);
export const cancelBooking = (id) => api.put(`/bookings/${id}/cancel`).then(r => r.data);

// Customers
export const getCustomers = (params) => api.get('/customers', { params }).then(r => r.data);
export const getCustomer = (id) => api.get(`/customers/${id}`).then(r => r.data);
export const createCustomer = (data) => api.post('/customers', data).then(r => r.data);
export const updateCustomer = (id, data) => api.put(`/customers/${id}`, data).then(r => r.data);
export const deactivateCustomer = (id) => api.delete(`/customers/${id}`).then(r => r.data);

// Invoices
export const getInvoices = (params) => api.get('/invoices', { params }).then(r => r.data);
export const getInvoice = (id) => api.get(`/invoices/${id}`).then(r => r.data);
export const generateInvoice = (data) => api.post('/invoices/generate', data).then(r => r.data);
export const refundInvoice = (id) => api.post(`/invoices/${id}/refund`).then(r => r.data);
export const recordCashPayment = (data) => api.post('/payments/cash', data).then(r => r.data);
