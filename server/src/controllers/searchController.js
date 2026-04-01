const searchService = require('../services/searchService');
const apiResponse = require('../utils/apiResponse');

const searchRooms = async (req, res, next) => {
    try {
        const { checkIn, checkOut, maxPrice } = req.query;

        // 1. Kiểm tra đầu vào
        if (!checkIn || !checkOut || !maxPrice) {
        // 2. Fail
            return apiResponse.fail(res, "Vui lòng cung cấp đủ checkIn, checkOut và maxPric");
        }
        // Gọi tầng Service để lấy dữ liệu
        const data = await searchService.getAvailableRoomsAggr(checkIn, checkOut, maxPrice);
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