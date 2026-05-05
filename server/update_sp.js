require("dotenv").config({ path: __dirname + "/../.env" });
const mysql = require("mysql2/promise");

async function updateProcedure() {
    const connection = await mysql.createConnection({
        host: process.env.MYSQL_HOST,
        port: process.env.MYSQL_PORT,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
        ssl: { rejectUnauthorized: false }
    });

    console.log("Connected to MySQL Aiven");

    const dropQuery = `DROP PROCEDURE IF EXISTS sp_SearchAvailableRooms;`;
    const createQuery = `
    CREATE PROCEDURE \`sp_SearchAvailableRooms\`(
		IN p_CheckIn DATETIME,
		IN p_CheckOut DATETIME,
		IN p_MaxPrice DECIMAL(15,2),
		IN p_RoomType VARCHAR(100)
    )
    BEGIN
		SELECT 
			r.HotelId,
			r.RoomId,
			r.RoomType,
			r.CurrentPrice
		FROM Room r
		WHERE r.Status = 1
			AND (p_MaxPrice IS NULL OR r.CurrentPrice <= p_MaxPrice)
			AND (p_RoomType IS NULL OR p_RoomType = '' OR r.RoomType = p_RoomType)
			AND fn_CheckRoomAvailability(r.RoomId, p_CheckIn, p_CheckOut) = TRUE;
    END
    `;

    try {
        await connection.query(dropQuery);
        await connection.query(createQuery);
        console.log("Successfully updated sp_SearchAvailableRooms");
    } catch (error) {
        console.error("Error updating procedure:", error);
    } finally {
        await connection.end();
    }
}

updateProcedure();
