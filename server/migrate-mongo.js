const { MongoClient } = require('mongodb');

// Tự động mã hóa mật khẩu nếu có chứa ký tự đặc biệt (chẳng hạn như dấu @)
// Mật khẩu uPH48@J6buv@FWM có chứa dấu @ nên MongoDB hiểu nhầm đó là kết thúc phần mật khẩu.
const ATLAS_URI = "mongodb+srv://tuankiet1125:uPH48%40J6buv%40FWM@cluster0.z9d6r6t.mongodb.net/?appName=Cluster0";

// Sửa lỗi mạng của nhà mạng VNPT
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const LOCAL_URI = "mongodb://localhost:27017";
const DB_NAME = "hotelreservation";

async function migrate() {
    console.log("🚀 Bắt đầu quá trình copy dữ liệu...");

    if (ATLAS_URI.includes("<username>")) {
        console.error("❌ LỖI: Bạn chưa điền link Atlas vào file migrate-mongo.js!");
        process.exit(1);
    }

    const localClient = new MongoClient(LOCAL_URI);
    const atlasClient = new MongoClient(ATLAS_URI);

    try {
        await localClient.connect();
        await atlasClient.connect();
        console.log("✅ Đã kết nối thành công tới cả 2 Database!");

        const localDb = localClient.db(DB_NAME);
        const atlasDb = atlasClient.db(DB_NAME);

        // Lấy danh sách các bảng (collections) từ Local
        const collections = await localDb.listCollections().toArray();

        for (const colInfo of collections) {
            const colName = colInfo.name;
            console.log(`\n📦 Đang xử lý bảng: ${colName}...`);

            const localCollection = localDb.collection(colName);
            const atlasCollection = atlasDb.collection(colName);

            // Lấy toàn bộ dữ liệu của bảng
            const data = await localCollection.find({}).toArray();

            if (data.length > 0) {
                // Xóa dữ liệu cũ trên Atlas (nếu có) để tránh trùng lặp
                await atlasCollection.deleteMany({});
                // Chèn dữ liệu mới vào
                await atlasCollection.insertMany(data);
                console.log(`   ✔️ Đã copy xong ${data.length} dòng.`);
            } else {
                console.log(`   ⚠️ Bảng trống, bỏ qua.`);
            }
        }

        console.log("\n🎉 HOÀN TẤT! Dữ liệu đã được chuyển hộ khẩu lên Cloud thành công.");
    } catch (err) {
        console.error("❌ Xảy ra lỗi trong quá trình copy:", err);
    } finally {
        await localClient.close();
        await atlasClient.close();
        process.exit(0);
    }
}

migrate();
