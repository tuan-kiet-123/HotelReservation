const mongoose = require("mongoose");
const Hotel = require("./models/Hotel");
const User = require("./models/User");
const Review = require("./models/Review");

// 1. Chuỗi kết nối Atlas
const atlasUri = "mongodb+srv://admin:123@xuanquangcoder95.zmkft3f.mongodb.net/hotelreservation?appName=XuanQuangCoder95";

async function runTest() {
  try {
    // 2. Kết nối tới MongoDB Atlas
    await mongoose.connect(atlasUri);
    console.log("✅ Kết nối MongoDB Atlas thành công!");

    // 3. Thêm 1 Hotel mẫu
    const myHotel = await Hotel.create({
      Name: "Santiago Bernabeu Hotel",
      Location: "Madrid, Spain",
      Amenities: ["Free WiFi", "Swimming Pool", "Football Pitch"]
    });
    console.log("✅ Đã thêm Hotel:", myHotel.Name);

    // 4. Thêm 1 User
    const myUser = await User.create({
      _id: "U001", 
      FullName: "Thomas Muller",
      Email: "thomas.muller@fcbayern.com",
      Phone: "0901234567"
    });
    console.log("✅ Đã thêm User:", myUser.FullName);

    // 5. Thêm 1 Review
    const myReview = await Review.create({
      HotelId: myHotel._id,
      UserId: myUser._id,
      Rating: 5,
      Comment: "Hala Madrid!"
    });
    console.log("✅ Đã thêm Review thành công!");
    console.log("   Thời gian tạo review:", myReview.CreateAt);

  } catch (error) {
    console.error("❌ Lỗi trong quá trình chạy test:", error.message);
  } finally {
    // 6. Ngắt kết nối sau khi xong
    await mongoose.connection.close();
    console.log("Đã ngắt kết nối tới database.");
  }
}

runTest();