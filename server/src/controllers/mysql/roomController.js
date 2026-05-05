const roomService = require("../../services/mysql/roomService");
const { success, fail } = require("../../utils/apiResponse");

async function createRoom(req, res, next) {
  try {
    const room = await roomService.createRoom(req.body);
    return success(res, room, "Create room successfully", 201);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return fail(res, "RoomId already exists", 400);
    }
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return fail(res, "HotelId does not exist in Hotel table", 400);
    }
    return next(error);
  }
}

module.exports = {
  createRoom
};
