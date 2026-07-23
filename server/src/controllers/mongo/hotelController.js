const hotelService = require("../../services/mongo/hotelService");
const { success, fail } = require("../../utils/apiResponse");
const { pool: mysqlPool } = require("../../config/mysql");
const mongoose = require("mongoose");
const Hotel = require("../../models/mongo/Hotel");

async function createHotel(req, res, next) {
  try {
    const hotel = await hotelService.createHotel(req.body);
    return success(res, hotel, "Create hotel successfully", 201);
  } catch (error) {
    return next(error);
  }
}

async function getHotels(req, res, next) {
  try {
    const hotels = await hotelService.getHotels();
    return success(res, hotels, "Get hotels successfully");
  } catch (error) {
    return next(error);
  }
}

async function getHotelById(req, res, next) {
  try {
    const hotel = await hotelService.getHotelById(req.params.id);
    if (!hotel) {
      return fail(res, "Hotel not found", 404);
    }

    return success(res, hotel, "Get hotel successfully");
  } catch (error) {
    return next(error);
  }
}

async function updateHotel(req, res, next) {
  try {
    const hotel = await hotelService.updateHotel(req.params.id, req.body);
    if (!hotel) {
      return fail(res, "Hotel not found", 404);
    }

    return success(res, hotel, "Update hotel successfully");
  } catch (error) {
    return next(error);
  }
}

async function deleteHotel(req, res, next) {
  try {
    const hotel = await hotelService.deleteHotel(req.params.id);
    if (!hotel) {
      return fail(res, "Hotel not found", 404);
    }

    return success(res, hotel, "Delete hotel successfully");
  } catch (error) {
    return next(error);
  }
}

async function getHotelSuggestions(req, res, next) {
  try {
    const { q } = req.query;
    if (!q) return success(res, [], "No query provided");
    const suggestions = await hotelService.getHotelSuggestions(q);
    return success(res, suggestions, "Get suggestions successfully");
  } catch (error) {
    return next(error);
  }
}

async function seedHotels(req, res, next) {
    try {
        const newHotels = [
            {
                Name: "Vinpearl Resort & Spa Nha Trang",
                Location: "Nha Trang, Khánh Hòa",
                Amenities: ["Hồ bơi tràn bờ", "Bãi biển riêng", "Spa cao cấp", "Nhà hàng Buffet", "Đưa đón sân bay", "Kid Club"],
                Images: [
                    "https://images.unsplash.com/photo-1540541338287-41700207dee6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1400&q=80",
                    "https://images.unsplash.com/photo-1582719508461-905c673771fd?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
                    "https://images.unsplash.com/photo-1610641818989-c2051b5e2cfd?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
                    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
                ]
            },
            {
                Name: "JW Marriott Phu Quoc Emerald Bay",
                Location: "Phú Quốc, Kiên Giang",
                Amenities: ["Kiến trúc Pháp", "Bể bơi hình con sò", "Spa & Massage", "Bar bãi biển", "Phòng Gym 24/7"],
                Images: [
                    "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1400&q=80",
                    "https://images.unsplash.com/photo-1564501049412-61c2a3083791?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
                    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
                    "https://images.unsplash.com/photo-1590490359683-658d3d23f972?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
                ]
            },
            {
                Name: "Melia Ho Tram Beach Resort",
                Location: "Hồ Tràm, Vũng Tàu",
                Amenities: ["Biệt thự biển", "Yoga ngoài trời", "Hồ bơi nhiệt đới", "Quầy Bar", "Khu vui chơi trẻ em"],
                Images: [
                    "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1400&q=80",
                    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
                    "https://images.unsplash.com/photo-1571896349842-33c89424de2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
                    "https://images.unsplash.com/photo-1551882547-ff40c0d5857a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
                ]
            },
            {
                Name: "InterContinental Danang Sun Peninsula",
                Location: "Bán đảo Sơn Trà, Đà Nẵng",
                Amenities: ["Nhà hàng Michelin", "Cáp treo riêng", "Villa sát biển", "Trải nghiệm Spa đẳng cấp"],
                Images: [
                    "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1400&q=80",
                    "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
                    "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
                    "https://images.unsplash.com/photo-1501117716987-c8c394bb29bf?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
                ]
            },
            {
                Name: "Hôtel des Arts Saigon - MGallery",
                Location: "Quận 3, TP. Hồ Chí Minh",
                Amenities: ["Rooftop Bar", "Thiết kế Indochine", "Buffet chuẩn Pháp", "Gym & Spa"],
                Images: [
                    "https://images.unsplash.com/photo-1551882547-ff40c0d5857a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1400&q=80",
                    "https://images.unsplash.com/photo-1560662105-57f8ad6fa5f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
                    "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
                    "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
                ]
            }
        ];

        let roomCounter = Math.floor(Math.random() * 1000) + 1000;
        let insertedCount = 0;

        for (const h of newHotels) {
            const docId = new mongoose.Types.ObjectId();
            h._id = docId;
            h.SqlHotelId = docId.toString();
            
            await Hotel.create(h);
            
            const roomTypes = [
                { type: "Standard", price: 1200000 },
                { type: "Standard", price: 1200000 },
                { type: "Deluxe", price: 2500000 },
                { type: "Deluxe", price: 2500000 },
                { type: "Luxury", price: 5000000 }
            ];

            for (const rt of roomTypes) {
                const roomId = `R${roomCounter++}`;
                await mysqlPool.query(
                    `INSERT INTO Room (RoomId, HotelId, RoomType, BasePrice, CurrentPrice, Status) VALUES (?, ?, ?, ?, ?, ?)`,
                    [roomId, docId.toString(), rt.type, rt.price, rt.price, 1]
                );
            }
            insertedCount++;
        }

        return success(res, { count: insertedCount }, "Seed data successfully");
    } catch (error) {
        return next(error);
    }
}

module.exports = {
  createHotel,
  getHotels,
  getHotelById,
  updateHotel,
  deleteHotel,
  getHotelSuggestions,
  seedHotels
};
