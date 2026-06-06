import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import {
    Bath,
    BedDouble,
    Car,
    Coffee,
    Dumbbell,
    Heart,
    MapPin,
    ShieldCheck,
    Sparkles,
    Star,
    Tv,
    Users,
    Waves,
    Wifi
} from "lucide-react";
import SiteShell from "../components/SiteShell";
import DatePickerCalendar from "../components/DatePickerCalendar";
import { fetchAvailableRooms, fetchHotelById, fetchReviewsByHotel } from "../lib/api";
import { useAuth } from "../lib/auth";

const demoGallery = [
    "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1400&q=80",
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80"
];

const amenityMeta = {
    "wifi": { icon: Wifi, label: "Wifi tốc độ cao" },
    "pool": { icon: Waves, label: "Hồ bơi" },
    "gym": { icon: Dumbbell, label: "Phòng gym" },
    "breakfast": { icon: Coffee, label: "Buffet sáng" },
    "parking": { icon: Car, label: "Bãi xe" },
    "security": { icon: ShieldCheck, label: "An ninh 24/7" },
    "tv": { icon: Tv, label: "Smart TV" },
    "bath": { icon: Bath, label: "Bồn tắm" }
};

function formatVnd(value) {
    return Number(value || 0).toLocaleString("vi-VN") + " VND";
}

function mapRoomsFromSearch(rooms = []) {
    return rooms.map((room) => ({
        roomId: room.RoomId,
        type: room.RoomType || "Standard",
        price: Number(room.CurrentPrice || 0),
        hotelId: room.HotelId
    }));
}

function parseAmenities(amenitiesRaw) {
    const normalized = String(amenitiesRaw || "wifi,pool,gym,breakfast,parking,security")
        .split(",")
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean);

    return normalized.map((item) => amenityMeta[item] || { icon: Sparkles, label: item });
}

export default function HotelDetailPage() {
    const { hotelId } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    const [urlSearchParams] = useSearchParams();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [hotel, setHotel] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [availableRooms, setAvailableRooms] = useState([]);
    const [selectedImage, setSelectedImage] = useState(0);
    const [checkInDate, setCheckInDate] = useState(() => {
        const fromUrl = urlSearchParams.get('checkIn');
        if (fromUrl) return new Date(fromUrl + 'T00:00:00');
        return new Date();
    });
    const [checkOutDate, setCheckOutDate] = useState(() => {
        const fromUrl = urlSearchParams.get('checkOut');
        if (fromUrl) return new Date(fromUrl + 'T00:00:00');
        const next = new Date();
        next.setDate(next.getDate() + 2);
        return next;
    });

    useEffect(() => {
        let alive = true;

        async function loadPageData() {
            setLoading(true);
            setError("");

            try {
                const [hotelData, reviewData] = await Promise.all([
                    fetchHotelById(hotelId),
                    fetchReviewsByHotel(hotelId)
                ]);

                if (!alive) {
                    return;
                }

                setHotel(hotelData || null);
                setReviews(Array.isArray(reviewData) ? reviewData : []);
            } catch (loadError) {
                if (!alive) {
                    return;
                }

                setError(loadError?.response?.data?.message || "Không tải được dữ liệu khách sạn. Kiểm tra backend rồi thử lại.");
            } finally {
                if (alive) {
                    setLoading(false);
                }
            }
        }

        loadPageData();

        return () => {
            alive = false;
        };
    }, [hotelId]);

    useEffect(() => {
        let active = true;

        async function loadAvailableRooms() {
            if (!hotelId) {
                setAvailableRooms([]);
                return;
            }

            const checkInIso = checkInDate ? checkInDate.toISOString() : null;
            const checkOutIso = checkOutDate ? checkOutDate.toISOString() : null;

            if (!checkInIso || !checkOutIso) {
                setAvailableRooms([]);
                return;
            }

            try {
                const hotels = await fetchAvailableRooms({
                    checkIn: checkInIso,
                    checkOut: checkOutIso
                });
                if (!active) return;

                const targetHotel = hotels.find((item) => item?._id === hotelId);
                const rooms = mapRoomsFromSearch(targetHotel?.availableRooms || []);
                setAvailableRooms(rooms);
            } catch (roomError) {
                if (!active) return;
                setAvailableRooms([]);
            }
        }

        loadAvailableRooms();
        return () => {
            active = false;
        };
    }, [hotelId, checkInDate, checkOutDate]);

    const roomList = useMemo(() => availableRooms, [availableRooms]);
    const amenities = useMemo(() => parseAmenities(hotel?.Amenities), [hotel?.Amenities]);
    const coverImages = useMemo(() => {
        return [hotel?.Images?.[0], ...demoGallery].filter(Boolean);
    }, [hotel?.Images]);

    return (
        <SiteShell>
            <section className="relative overflow-hidden bg-slate-50 min-h-screen">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(46,196,182,0.1),_rgba(255,255,255,0))]" />
                <div className="max-w-7xl mx-auto px-4 py-10 relative">
                    {loading && (
                        <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-xl flex justify-center items-center">
                            <p className="text-slate-500 font-bold animate-pulse">Đang tải thông tin khách sạn...</p>
                        </div>
                    )}

                    {!loading && error && (
                        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-8 shadow-xl space-y-3">
                            <h2 className="text-xl font-bold text-rose-800">Không thể hiển thị trang khách sạn</h2>
                            <p className="text-rose-700 text-sm font-semibold">{error}</p>
                            <p className="text-slate-600 text-sm">Vui lòng thử lại sau.</p>
                        </div>
                    )}

                    {!loading && !error && hotel && (
                        <div className="space-y-8">
                            <div className="grid lg:grid-cols-5 gap-8">
                                <div className="lg:col-span-3 space-y-4">
                                    <div className="rounded-3xl overflow-hidden shadow-2xl border border-white h-[450px] relative group">
                                        <img
                                            src={coverImages[selectedImage] || demoGallery[0]}
                                            alt={hotel.Name}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                                    </div>
                                    <div className="grid grid-cols-4 gap-4">
                                        {coverImages.slice(0, 4).map((image, index) => (
                                            <button
                                                key={image + index}
                                                type="button"
                                                onClick={() => setSelectedImage(index)}
                                                className={`rounded-2xl overflow-hidden h-28 border-[3px] transition-all duration-300 cursor-pointer ${selectedImage === index ? "border-[#2EC4B6] shadow-lg shadow-[#2EC4B6]/30" : "border-transparent opacity-70 hover:opacity-100"
                                                    }`}
                                            >
                                                <img src={image} alt={`gallery-${index}`} className="w-full h-full object-cover" />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="lg:col-span-2 rounded-3xl bg-white border border-white p-8 shadow-2xl space-y-6">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <div className="flex items-center gap-1 text-[#FF6F61] mb-2">
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                    <Star key={i} className="w-4 h-4 fill-[#FF6F61]" />
                                                ))}
                                            </div>
                                            <h1 className="text-3xl font-black text-slate-800 leading-tight">{hotel.Name || "Khách sạn"}</h1>
                                        </div>
                                        <button type="button" className="p-3 rounded-full bg-slate-50 text-slate-400 hover:text-[#FF6F61] hover:bg-rose-50 transition-colors shadow-sm cursor-pointer border border-slate-100">
                                            <Heart className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-2 text-slate-500 text-sm font-semibold">
                                        <MapPin className="w-5 h-5 text-[#2EC4B6]" />
                                        <span>{hotel.Location || "TP Hồ Chí Minh"}</span>
                                    </div>

                                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                                        <DatePickerCalendar
                                            checkIn={checkInDate}
                                            checkOut={checkOutDate}
                                            onCheckInChange={setCheckInDate}
                                            onCheckOutChange={setCheckOutDate}
                                            variant="light"
                                        />
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (!currentUser) {
                                                alert("Vui lòng đăng nhập trước khi đặt phòng.");
                                                return;
                                            }
                                            if (roomList.length === 0) {
                                                alert("Không có phòng trống cho khoảng thời gian này.");
                                                return;
                                            }
                                            navigate("/checkout", {
                                                state: {
                                                    hotel,
                                                    room: roomList[0],
                                                    userId: currentUser.UserId,
                                                    checkInDate,
                                                    checkOutDate
                                                }
                                            });
                                        }}
                                        disabled={roomList.length === 0}
                                        className="w-full py-4 rounded-xl bg-[#FF6F61] hover:bg-[#FF5A4A] text-white font-bold shadow-xl shadow-[#FF6F61]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                    >
                                        Đặt ngay phòng đầu tiên
                                    </button>
                                </div>
                            </div>

                            <div className="grid lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 rounded-3xl bg-white border border-white p-8 shadow-xl">
                                    <h2 className="text-2xl font-black text-slate-800 border-b border-slate-100 pb-4 mb-6">Danh sách phòng trống</h2>
                                    
                                    <div className="grid gap-6">
                                        {roomList.length === 0 && (
                                            <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center bg-slate-50">
                                                <p className="text-slate-500 font-semibold text-lg">Hết phòng trống</p>
                                                <p className="text-slate-400 text-sm mt-1">Vui lòng chọn khoảng thời gian khác.</p>
                                            </div>
                                        )}
                                        {roomList.map((room) => (
                                            <article key={room.roomId} className="flex flex-col sm:flex-row items-center gap-6 rounded-2xl border border-slate-100 p-5 hover:shadow-xl hover:border-[#2EC4B6]/30 transition-all bg-white group">
                                                <div className="w-full sm:w-48 h-32 rounded-xl bg-slate-100 overflow-hidden shrink-0">
                                                    <img src={demoGallery[2]} alt={room.type} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                </div>
                                                <div className="flex-1 w-full">
                                                    <div className="flex items-center justify-between gap-3 mb-2">
                                                        <h3 className="text-lg font-bold text-slate-800">{room.type}</h3>
                                                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#2EC4B6]/10 text-[#2EC4B6]">Có sẵn</span>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-sm font-semibold text-slate-500 mb-4">
                                                        <p className="flex items-center gap-1.5"><BedDouble className="w-4 h-4 text-[#2EC4B6]" /> {room.roomId}</p>
                                                        <p className="flex items-center gap-1.5"><Users className="w-4 h-4 text-[#2EC4B6]" /> Tiêu chuẩn</p>
                                                    </div>
                                                    <div className="flex items-end justify-between border-t border-slate-50 pt-4">
                                                        <p className="text-2xl font-black text-[#FF6F61]">{formatVnd(room.price)}<span className="text-sm text-slate-400 font-semibold"> / đêm</span></p>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                if (!currentUser) {
                                                                    alert("Vui lòng đăng nhập trước khi đặt phòng.");
                                                                    return;
                                                                }
                                                                navigate("/checkout", {
                                                                    state: {
                                                                        hotel,
                                                                        room,
                                                                        userId: currentUser.UserId,
                                                                        checkInDate,
                                                                        checkOutDate
                                                                    }
                                                                });
                                                            }}
                                                            className="py-2.5 px-6 rounded-xl bg-[#2EC4B6] text-white text-sm font-bold shadow-lg shadow-[#2EC4B6]/30 hover:bg-[#1DA69A] transition-colors cursor-pointer"
                                                        >
                                                            Chọn phòng
                                                        </button>
                                                    </div>
                                                </div>
                                            </article>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <div className="rounded-3xl bg-white border border-white p-8 shadow-xl">
                                        <h2 className="text-xl font-black text-slate-800 mb-6">Tiện ích nổi bật</h2>
                                        <div className="grid grid-cols-2 gap-4">
                                            {amenities.map((item, index) => {
                                                const Icon = item.icon;
                                                return (
                                                    <div key={item.label + index} className="rounded-2xl bg-slate-50 border border-slate-100 p-4 flex items-center gap-3 hover:bg-[#2EC4B6]/5 transition-colors cursor-default">
                                                        <div className="w-10 h-10 rounded-full bg-[#2EC4B6]/10 flex items-center justify-center shrink-0">
                                                            <Icon className="w-5 h-5 text-[#2EC4B6]" />
                                                        </div>
                                                        <p className="text-sm font-bold text-slate-700">{item.label}</p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="rounded-3xl bg-white border border-white p-8 shadow-xl">
                                        <div className="flex items-center justify-between mb-6">
                                            <h2 className="text-xl font-black text-slate-800">Đánh giá khách hàng</h2>
                                            <div className="bg-[#2EC4B6] text-white px-3 py-1 rounded-lg font-bold text-sm">
                                                {reviews.length > 0 ? "9.5/10" : "N/A"}
                                            </div>
                                        </div>
                                        
                                        <div className="grid gap-4 max-h-[500px] overflow-y-auto pr-2">
                                            {reviews.length === 0 && (
                                                <div className="text-center py-6 bg-slate-50 rounded-2xl border border-slate-100">
                                                    <p className="text-sm font-semibold text-slate-500">Chưa có đánh giá nào.</p>
                                                    <p className="text-xs text-slate-400 mt-1">Hãy là người đầu tiên trải nghiệm.</p>
                                                </div>
                                            )}

                                            {reviews.map((review) => (
                                                <article key={review._id} className="rounded-2xl border border-slate-100 p-5 bg-white shadow-sm hover:shadow-md transition-shadow">
                                                    <div className="flex items-center justify-between gap-3 mb-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-[#FF6F61]/10 flex items-center justify-center text-[#FF6F61] font-bold">
                                                                {(review.UserId?.FullName || review.UserId || "K")[0]}
                                                            </div>
                                                            <p className="font-bold text-slate-800 text-sm">{review.UserId?.FullName || review.UserId || "Khách lưu trú"}</p>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            {Array.from({ length: 5 }).map((_, index) => (
                                                                <Star
                                                                    key={index}
                                                                    className={`w-3.5 h-3.5 ${index < Number(review.Rating || 0) ? "fill-[#FF6F61] text-[#FF6F61]" : "text-slate-200"}`}
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <p className="text-sm font-medium text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl">{review.Comment}</p>
                                                </article>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </SiteShell>
    );
}
