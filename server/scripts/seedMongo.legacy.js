// 1. Chuỗi kết nối Atlas
require('dotenv').config(); // Kích hoạt đọc file .env

const mongoose = require("mongoose");
const Hotel = require("./models/Hotel");
const User = require("./models/User");
const Review = require("./models/Review");

async function seedDatabase() {
  try {
    // 2. Kết nối tới MongoDB Atlas
    await mongoose.connect(process.env.atlasUri);
    console.log("=> Kết nối MongoDB Atlas thành công!");

    // 2.5 Dọn dẹp collection trước khi thêm mới
    await Hotel.deleteMany({});
    await User.deleteMany({});
    await Review.deleteMany({});
    console.log("=> Đã dọn dẹp sạch dữ liệu cũ trong Database!");

    // 3. Thêm dữ liệu Hotel
    const myHotel = await Hotel.create({
      Name: "Santiago Bernabeu Hotel",
      Location: "Madrid, Spain",
      Amenities: ["Free WiFi", "Swimming Pool", "Football Pitch"]
    });
    console.log("-> Đã thêm Hotel:", myHotel.Name);

    // 4. Thêm dữ liệu User
    const myUser = await User.create({
      _id: "U001", 
      FullName: "Thomas Muller",
      Email: "thomas.muller@fcbayern.com",
      Phone: "0901234567"
    });
    console.log("-> Đã thêm User:", myUser.FullName);

    // 5. Thêm dữ liệu Review
    const myReview = await Review.create({
      HotelId: myHotel._id,
      UserId: myUser._id,
      Rating: 5,
      Comment: "Hala Madrid!"
    });
    console.log("-> Đã thêm Review thành công!");
    console.log("   Thời gian tạo review:", myReview.CreateAt);

  } catch (error) {
    // Lỗi connect hoặc create
    console.error("=> Lỗi trong quá trình chạy test:", error.message);
  } finally {
    // 6. Ngắt kết nối sau khi xong
    await mongoose.connection.close();
    console.log("Đã ngắt kết nối tới database.");
  }
}

seedDatabase();