require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const mysql = require('mysql2/promise');
const Hotel = require('../src/models/mongo/Hotel');

async function seedData() {
    try {
        console.log("⏳ Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DATABASE });
        console.log("✅ MongoDB connected.");

        console.log("⏳ Connecting to MySQL...");
        const mysqlConn = await mysql.createConnection({
            host: process.env.MYSQL_HOST,
            port: process.env.MYSQL_PORT,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DATABASE,
            ssl: process.env.MYSQL_SSL === 'true' ? { rejectUnauthorized: false } : undefined
        });
        console.log("✅ MySQL connected.");

        console.log("⏳ Clearing old data...");
        await Hotel.deleteMany({});
        await mysqlConn.query("SET FOREIGN_KEY_CHECKS = 0;");
        await mysqlConn.query("DELETE FROM Room");
        await mysqlConn.query("DELETE FROM Hotel");
        await mysqlConn.query("SET FOREIGN_KEY_CHECKS = 1;");
        
        const hotelsData = [
            {
                Name: "Traveloka Premium Pearl",
                Location: "Quận 1, TP. Hồ Chí Minh",
                Amenities: ["Hồ bơi vô cực", "Spa & Massage", "Nhà hàng 5 sao", "Gym"]
            },
            {
                Name: "Traveloka Sea View Resort",
                Location: "Nha Trang, Khánh Hòa",
                Amenities: ["Bãi biển riêng", "Quầy Bar", "Lặn biển", "Đưa đón sân bay"]
            },
            {
                Name: "Traveloka Mountain Retreat",
                Location: "Sa Pa, Lào Cai",
                Amenities: ["View thung lũng", "Nước nóng 24/7", "Thuê xe máy", "Bữa sáng buffet"]
            }
        ];

        console.log("⏳ Seeding Hotels & Rooms...");
        for (let i = 0; i < hotelsData.length; i++) {
            const hotelDoc = new Hotel(hotelsData[i]);
            await hotelDoc.save();
            const sqlHotelId = hotelDoc.SqlHotelId;

            // 1. Insert Hotel to MySQL
            await mysqlConn.query("INSERT INTO Hotel (HotelId, Status) VALUES (?, 1)", [sqlHotelId]);

            // 2. Insert Rooms for this Hotel
            const roomTypes = [
                { type: "Standard", price: 850000 },
                { type: "Deluxe", price: 1500000 },
                { type: "Suite", price: 3200000 }
            ];

            for (let j = 0; j < roomTypes.length; j++) {
                const rt = roomTypes[j];
                const roomId = `R${i + 1}0${j + 1}`; // VD: R101, R102
                
                await mysqlConn.query(
                    "INSERT INTO Room (RoomId, HotelId, RoomType, BasePrice, CurrentPrice, Status) VALUES (?, ?, ?, ?, ?, 1)",
                    [roomId, sqlHotelId, rt.type, rt.price, rt.price]
                );
            }
            console.log(`✨ Inserted Hotel: ${hotelsData[i].Name} with 3 Rooms.`);
        }

        console.log("🎉 Seeding completed successfully!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Seeding failed:", error);
        process.exit(1);
    }
}

seedData();
