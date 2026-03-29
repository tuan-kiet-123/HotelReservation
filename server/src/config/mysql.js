const mysql = require("mysql2/promise");
const env = require("./env");

const pool = mysql.createPool({
  host: env.MYSQL_HOST,
  port: env.MYSQL_PORT,
  user: env.MYSQL_USER,
  password: env.MYSQL_PASSWORD,
  database: env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: env.MYSQL_SSL === "true" ? {
    rejectUnauthorized: env.NODE_ENV === "production"
  } : undefined
});

async function checkMySqlConnection() {
  const conn = await pool.getConnection();
  try {
    await conn.query("SELECT 1");
  } finally {
    conn.release();
  }
}

module.exports = {
  pool,
  checkMySqlConnection
};
