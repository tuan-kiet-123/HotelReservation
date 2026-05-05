const searchService = require('../services/searchService');
const apiResponse = require('../utils/apiResponse');

const searchRooms = async (req, res, next) => {
    try {
        const { checkIn, checkOut, maxPrice = 999999999, roomType } = req.query;

        // 1. Kiểm tra đầu vào
        if (!checkIn || !checkOut) {
        // 2. Fail
            return apiResponse.fail(res, "Vui lòng cung cấp đủ checkIn, checkOut");
        }
        
        // Chuyển đổi định dạng ngày ISO sang MySQL DATETIME (YYYY-MM-DD HH:MM:SS)
        const formattedCheckIn = new Date(checkIn).toISOString().slice(0, 19).replace('T', ' ');
        const formattedCheckOut = new Date(checkOut).toISOString().slice(0, 19).replace('T', ' ');

        // Gọi tầng Service để lấy dữ liệu
        const data = await searchService.getAvailableRoomsAggr(formattedCheckIn, formattedCheckOut, maxPrice, roomType);
        // 3. Success
        return apiResponse.success(res, data, "Tìm kiếm thành công");

    } catch (error) {
        // Đẩy lỗi sang cho middlewares/errorHandler.js xử lý tập trung
        next(error); 
    }
};

module.exports = {
    searchRooms
};