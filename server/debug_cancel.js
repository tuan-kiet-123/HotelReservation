require("dotenv").config({ path: __dirname + "/../.env" });
const mysql = require("mysql2/promise");

async function debug() {
    const connection = await mysql.createConnection({
        host: process.env.MYSQL_HOST,
        port: process.env.MYSQL_PORT,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
        ssl: { rejectUnauthorized: false }
    });

    // 1. Kiểm tra timezone server
    const [tz] = await connection.query("SELECT NOW() as ServerNow, @@global.time_zone as GlobalTZ, @@session.time_zone as SessionTZ");
    console.log("=== MySQL Server Time ===");
    console.log(tz[0]);

    // 2. Kiểm tra dữ liệu đơn RSV9100045
    const [res] = await connection.query(
        "SELECT ReservationId, RoomId, CheckInDate, CheckOutDate, Status FROM Reservation WHERE ReservationId = 'RSV9100045'"
    );
    console.log("\n=== Reservation RSV9100045 ===");
    console.log(res[0] || "NOT FOUND");

    if (res[0]) {
        // 3. Tính DATEDIFF
        const [diff] = await connection.query(
            "SELECT DATEDIFF(CheckInDate, NOW()) as DaysBefore FROM Reservation WHERE ReservationId = 'RSV9100045'"
        );
        console.log("\n=== DATEDIFF(CheckInDate, NOW()) ===");
        console.log("DaysBefore =", diff[0]?.DaysBefore);

        // 4. Kiểm tra Payment
        const [pay] = await connection.query(
            "SELECT * FROM Payment WHERE ReservationId = 'RSV9100045'"
        );
        console.log("\n=== Payments ===");
        console.log(pay);

        // 5. Kiểm tra Refund
        const [ref] = await connection.query(
            "SELECT * FROM Refund WHERE ReservationId = 'RSV9100045'"
        );
        console.log("\n=== Refunds ===");
        console.log(ref);

        // 6. Kiểm tra Room BasePrice
        const [room] = await connection.query(
            "SELECT RoomId, BasePrice, CurrentPrice FROM Room WHERE RoomId = ?", [res[0].RoomId]
        );
        console.log("\n=== Room ===");
        console.log(room[0]);
    }

    await connection.end();
}

debug().catch(console.error);
