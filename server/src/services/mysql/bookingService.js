const { pool } = require("../../config/mysql");

async function ensureBookingTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS bookings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      customer_name VARCHAR(255) NOT NULL,
      customer_email VARCHAR(255) NOT NULL,
      hotel_name VARCHAR(255) NOT NULL,
      room_type VARCHAR(100) NOT NULL,
      check_in DATE NOT NULL,
      check_out DATE NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  await pool.execute(sql);
}

async function createBooking(payload) {
  const sql = `
    INSERT INTO bookings
      (customer_name, customer_email, hotel_name, room_type, check_in, check_out, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    payload.customerName,
    payload.customerEmail,
    payload.hotelName,
    payload.roomType,
    payload.checkIn,
    payload.checkOut,
    payload.status || "pending"
  ];

  const [result] = await pool.execute(sql, values);
  return getBookingById(result.insertId);
}

async function getBookings() {
  const [rows] = await pool.execute("SELECT * FROM bookings ORDER BY id DESC");
  return rows;
}

async function getBookingById(id) {
  const [rows] = await pool.execute("SELECT * FROM bookings WHERE id = ?", [id]);
  return rows[0] || null;
}

async function updateBooking(id, payload) {
  const existing = await getBookingById(id);
  if (!existing) {
    return null;
  }

  const sql = `
    UPDATE bookings
    SET
      customer_name = ?,
      customer_email = ?,
      hotel_name = ?,
      room_type = ?,
      check_in = ?,
      check_out = ?,
      status = ?
    WHERE id = ?
  `;

  const values = [
    payload.customerName || existing.customer_name,
    payload.customerEmail || existing.customer_email,
    payload.hotelName || existing.hotel_name,
    payload.roomType || existing.room_type,
    payload.checkIn || existing.check_in,
    payload.checkOut || existing.check_out,
    payload.status || existing.status,
    id
  ];

  await pool.execute(sql, values);
  return getBookingById(id);
}

async function deleteBooking(id) {
  const [result] = await pool.execute("DELETE FROM bookings WHERE id = ?", [id]);
  return result.affectedRows > 0;
}

module.exports = {
  ensureBookingTable,
  createBooking,
  getBookings,
  getBookingById,
  updateBooking,
  deleteBooking
};
