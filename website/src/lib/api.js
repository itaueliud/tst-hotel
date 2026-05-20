import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/v1';

const api = axios.create({ baseURL: API_URL });

export const getRooms = (params = {}) => api.get('/rooms', { params }).then(r => r.data);
export const getRoom = (id) => api.get(`/rooms/${id}`).then(r => r.data);
export const getAvailableRooms = (params) => api.get('/rooms/available', { params }).then(r => r.data);
export const createBooking = (data) => api.post('/bookings', data).then(r => r.data);
export const processStripePayment = (data) => api.post('/payments/stripe', data).then(r => r.data);
export const initiateMpesa = (data) => api.post('/payments/mpesa', data).then(r => r.data);
