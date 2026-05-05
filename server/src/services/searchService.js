const { pool: mysqlPool } = require('../config/mysql'); 
const Hotel = require('../models/mongo/Hotel'); 

const getAvailableRoomsAggr = async (checkIn, checkOut, maxPrice, roomType) => {
    // 1. GỌI MYSQL: Lấy danh sách phòng trống
    const [mysqlResult] = await mysqlPool.query(
        "CALL sp_SearchAvailableRooms(?, ?, ?, ?)", 
        [checkIn, checkOut, maxPrice, roomType || null]
    );
    
    const availableRooms = mysqlResult[0]; 

    

    if (!availableRooms || availableRooms.length === 0) {
        return []; // Trả về mảng rỗng nếu không có phòng
    }

    // 2. Lọc ra các HotelId duy nhất
    const hotelIds = [...new Set(availableRooms.map(room => room.HotelId))];

    // 3. GỌI MONGODB: Lấy thông tin khách sạn tương ứng
    const mongoHotels = await Hotel.find({
        _id: { $in: hotelIds }
    });

    // 4. TRỘN DỮ LIỆU
    const finalResult = mongoHotels.map(hotel => {
        let hotelData = hotel.toObject(); 
        hotelData.availableRooms = availableRooms.filter(
            room => room.HotelId === hotelData._id
        );
        return hotelData;
    });

    return finalResult;
};

module.exports = {
    getAvailableRoomsAggr
};