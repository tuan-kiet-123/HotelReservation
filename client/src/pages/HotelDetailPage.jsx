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

function toDateInputValue(date) {
    return new Date(date).toISOString().slice(0, 16);
}

function toSearchIsoValue(dateValue) {
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) {
        return null;
    }
    return date.toISOString();
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
            <section className="relative overflow-hidden bg-slate-100">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.2),_rgba(255,255,255,0))]" />
                <div className="max-w-7xl mx-auto px-4 py-10 relative">
                    {loading && (
                        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
                            <p className="text-slate-500">Đang tải dữ liệu khách sạn...</p>
                        </div>
                    )}

                    {!loading && error && (
                        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-8 shadow-lg space-y-3">
                            <h2 className="text-xl font-semibold text-rose-800">Không thể hiển thị trang khách sạn</h2>
                            <p className="text-rose-700 text-sm">{error}</p>
                            <p className="text-slate-600 text-sm">Bạn hãy đảm bảo server đang chạy và có dữ liệu Mongo cho HotelId này.</p>
                        </div>
                    )}

                    {!loading && !error && hotel && (
                        <div className="space-y-8">
                            <div className="grid lg:grid-cols-5 gap-6">
                                <div className="lg:col-span-3 space-y-4">
                                    <div className="rounded-3xl overflow-hidden shadow-xl border border-slate-200 h-[380px]">
                                        <img
                                            src={coverImages[selectedImage] || demoGallery[0]}
                                            alt={hotel.Name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="grid grid-cols-4 gap-3">
                                        {coverImages.slice(0, 4).map((image, index) => (
                                            <button
                                                key={image + index}
                                                type="button"
                                                onClick={() => setSelectedImage(index)}
                                                className={`rounded-2xl overflow-hidden h-24 border-2 transition-all ${selectedImage === index ? "border-amber-500" : "border-transparent"
                                                    }`}
                                            >
                                                <img src={image} alt={`gallery-${index}`} className="w-full h-full object-cover" />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="lg:col-span-2 rounded-3xl bg-white border border-slate-200 p-6 shadow-xl space-y-5">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="text-xs uppercase tracking-wider text-amber-600 font-semibold">1.3 Hotel Detail</p>
                                            <h1 className="text-2xl font-bold text-slate-900 leading-tight mt-1">{hotel.Name || "Khách sạn"}</h1>
                                        </div>
                                        <button type="button" className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:text-rose-500">
                                            <Heart className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                                        <MapPin className="w-4 h-4 text-amber-500" />
                                        <span>{hotel.Location || "TP Hồ Chí Minh"}</span>
                                    </div>

                                    {/* <div className="rounded-2xl bg-amber-50 border border-amber-100 p-4">
                                        <p className="text-sm text-slate-600">Mã khách sạn MySQL</p>
                                        <p className="text-lg font-semibold text-slate-900">{hotel.SqlHotelId || "HT91000001"}</p>
                                    </div> */}

                                    <DatePickerCalendar
                                        checkIn={checkInDate}
                                        checkOut={checkOutDate}
                                        onCheckInChange={setCheckInDate}
                                        onCheckOutChange={setCheckOutDate}
                                        variant="light"
                                    />

                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (!currentUser) {
                                                alert("Vui lòng chọn user demo trước khi đặt phòng.");
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
                                        className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold shadow-md shadow-amber-500/30"
                                    >
                                        Đặt nhanh phòng đầu tiên
                                    </button>
                                </div>
                            </div>

                            <div className="grid lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2 rounded-3xl bg-white border border-slate-200 p-6 shadow-lg">
                                    <h2 className="text-xl font-bold text-slate-900">Danh sách phòng trống hôm nay</h2>
                                    <p className="text-sm text-slate-500 mt-1">Chọn phòng để chuyển qua trang thanh toán 1.4.</p>

                                    <div className="mt-5 grid sm:grid-cols-2 gap-4">
                                        {roomList.length === 0 && (
                                            <div className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-500">
                                                Không có phòng trống cho khoảng thời gian này.
                                            </div>
                                        )}
                                        {roomList.map((room) => (
                                            <article key={room.roomId} className="rounded-2xl border border-slate-200 p-4 hover:shadow-md transition-shadow">
                                                <div className="flex items-center justify-between gap-3">
                                                    <h3 className="font-semibold text-slate-900">{room.type}</h3>
                                                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">Trống</span>
                                                </div>
                                                <div className="mt-3 space-y-2 text-sm text-slate-500">
                                                    <p className="flex items-center gap-2"><BedDouble className="w-4 h-4 text-slate-400" /> {room.roomId}</p>
                                                    <p className="flex items-center gap-2"><Users className="w-4 h-4 text-slate-400" /> {room.type}</p>
                                                </div>
                                                <p className="mt-4 text-lg font-bold text-slate-900">{formatVnd(room.price)}<span className="text-sm text-slate-500 font-normal"> / đêm</span></p>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (!currentUser) {
                                                            alert("Vui lòng chọn user demo trước khi đặt phòng.");
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
                                                    className="mt-4 w-full py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800"
                                                >
                                                    Đặt phòng này
                                                </button>
                                            </article>
                                        ))}
                                    </div>
                                </div>

                                <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-lg">
                                    <h2 className="text-xl font-bold text-slate-900">Tiện ích nổi bật</h2>
                                    <div className="mt-5 grid grid-cols-2 gap-3">
                                        {amenities.map((item, index) => {
                                            const Icon = item.icon;
                                            return (
                                                <div key={item.label + index} className="rounded-2xl bg-slate-50 border border-slate-200 px-3 py-4 text-center">
                                                    <Icon className="w-5 h-5 text-amber-500 mx-auto mb-2" />
                                                    <p className="text-xs font-medium text-slate-600">{item.label}</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-lg">
                                <h2 className="text-xl font-bold text-slate-900">Review khách hàng ({reviews.length})</h2>
                                <div className="mt-5 grid gap-4">
                                    {reviews.length === 0 && (
                                        <p className="text-sm text-slate-500">Chưa có đánh giá nào. Sau khi booking Completed, bạn có thể gửi review ở trang 1.6.</p>
                                    )}

                                    {reviews.map((review) => (
                                        <article key={review._id} className="rounded-2xl border border-slate-200 p-4 bg-slate-50">
                                            <div className="flex items-center justify-between gap-3">
                                                <p className="font-semibold text-slate-800">{review.UserId?.FullName || review.UserId || "Khách lưu trú"}</p>
                                                <div className="flex items-center gap-1 text-amber-500">
                                                    {Array.from({ length: 5 }).map((_, index) => (
                                                        <Star
                                                            key={index}
                                                            className={`w-4 h-4 ${index < Number(review.Rating || 0) ? "fill-amber-400" : "text-slate-300"}`}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                            <p className="mt-2 text-sm text-slate-600 leading-relaxed">{review.Comment}</p>
                                        </article>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </SiteShell>
    );
}
