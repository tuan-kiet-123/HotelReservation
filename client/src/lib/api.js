import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL,
  timeout: 15000
});

export async function fetchHotelById(hotelId) {
  const response = await api.get(`/mongo/hotels/${hotelId}`);
  return response.data?.data;
}

export async function fetchHotels() {
  const response = await api.get("/mongo/hotels");
  return response.data?.data || [];
}

export async function fetchReviewsByHotel(hotelId) {
  const response = await api.get(`/mongo/hotels/${hotelId}/reviews`);
  return response.data?.data || [];
}

export async function createBooking(payload) {
  const response = await api.post("/mysql/bookings/book-room", payload);
  return response.data;
}

export async function processCheckInPayment(payload) {
  const response = await api.post("/mysql/bookings/check-in-payment", payload);
  return response.data;
}

export async function processCheckOut(payload) {
  const response = await api.post("/mysql/bookings/check-out", payload);
  return response.data;
}

export async function createReview(payload) {
  const response = await api.post("/mongo/reviews", payload);
  return response.data;
}

export default api;
