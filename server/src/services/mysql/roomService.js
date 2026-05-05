const pool = require("../../config/mysql");

async function createRoom(roomData) {
  const { RoomId, HotelId, RoomType, BasePrice, CurrentPrice, Status = 1 } = roomData;
  const query = `
    INSERT INTO Room (RoomId, HotelId, RoomType, BasePrice, CurrentPrice, Status)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  
  const currentPriceValue = CurrentPrice !== undefined ? CurrentPrice : BasePrice;

  const [result] = await pool.query(query, [
    RoomId,
    HotelId,
    RoomType,
    BasePrice,
    currentPriceValue,
    Status
  ]);
  
  return { RoomId, HotelId, RoomType, BasePrice, CurrentPrice: currentPriceValue, Status };
}

module.exports = {
  createRoom
};
