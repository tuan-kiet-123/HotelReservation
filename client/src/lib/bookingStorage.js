const STORAGE_KEY = "hotel-reservation-bookings";

export function getStoredBookings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function setStoredBookings(bookings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
}

export function upsertBooking(nextBooking) {
  const current = getStoredBookings();
  const index = current.findIndex((item) => item.reservationId === nextBooking.reservationId);

  if (index >= 0) {
    current[index] = { ...current[index], ...nextBooking };
  } else {
    current.unshift(nextBooking);
  }

  setStoredBookings(current);
  return current;
}

export function removeBooking(reservationId) {
  const current = getStoredBookings();
  const next = current.filter((item) => item.reservationId !== reservationId);
  setStoredBookings(next);
  return next;
}
