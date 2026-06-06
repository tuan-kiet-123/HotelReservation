import apiClient from "./apiClient";

export async function simulatePaymentWebhook(payload) {
  const response = await apiClient.post("/mysql/webhooks/payment", payload);
  return response.data;
}

export async function fetchHotelById(hotelId) {
  const response = await apiClient.get(`/mongo/hotels/${hotelId}`);
  return response.data?.data;
}

export async function fetchHotels() {
  const response = await apiClient.get("/mongo/hotels");
  return response.data?.data || [];
}

export async function fetchReviewsByHotel(hotelId) {
  const response = await apiClient.get(`/mongo/hotels/${hotelId}/reviews`);
  return response.data?.data || [];
}

export async function fetchAvailableRooms(params = {}) {
  const response = await apiClient.get("/search", { params });
  return response.data?.data || [];
}

export async function createBooking(payload) {
  const response = await apiClient.post("/mysql/bookings/book-room", payload);
  return response.data;
}

export async function processCheckInPayment(payload) {
  const response = await apiClient.post("/mysql/bookings/check-in-payment", payload);
  return response.data;
}

export async function processCheckOut(payload) {
  const response = await apiClient.post("/mysql/bookings/check-out", payload);
  return response.data;
}

export async function cancelReservation(payload) {
  const response = await apiClient.post("/mysql/bookings/cancel", payload);
  return response.data;
}

export async function fetchReservations(params = {}) {
  const response = await apiClient.get("/mysql/bookings", { params });
  return response.data?.data || [];
}

export async function createReview(payload) {
  const response = await apiClient.post("/mongo/reviews", payload);
  return response.data;
}

export async function fetchUsers(limit = 3) {
  const response = await apiClient.get("/mongo/users", { params: { limit } });
  return response.data?.data || [];
}

export default apiClient;
