import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
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
import { fetchHotelById, fetchReviewsByHotel } from "../lib/api";

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

function buildRoomList(sqlHotelId) {
    const roomProfiles = [
        { type: "Deluxe Twin", capacity: 2, area: 32, price: 1300000 },
        { type: "Grand Premier", capacity: 3, area: 38, price: 1850000 },
        { type: "Executive Sea View", capacity: 4, area: 45, price: 2400000 },
        { type: "Royal Suite", capacity: 4, area: 58, price: 3250000 }
    ];

    const idsByHotel = {
        HT91000001: ["RM91000001", "RM91000002", "RM91000003", "RM91000004"],
        HT92000001: ["RM92000001", "RM92000002", "RM92000003", "RM92000004"]
    };

    const fallbackIds = idsByHotel.HT91000001;
    const selectedIds = idsByHotel[sqlHotelId] || fallbackIds;

    return roomProfiles.map((profile, index) => ({
        ...profile,
        roomId: selectedIds[index]
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

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [hotel, setHotel] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [selectedImage, setSelectedImage] = useState(0);
    const [userId, setUserId] = useState("USR2000001");
    const [checkInDate, setCheckInDate] = useState(() => toDateInputValue(new Date()));
    const [checkOutDate, setCheckOutDate] = useState(() => {
        const next = new Date();
        next.setDate(next.getDate() + 2);
        return toDateInputValue(next);
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

    const roomList = useMemo(() => buildRoomList(hotel?.SqlHotelId), [hotel?.SqlHotelId]);
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

                                    <div className="rounded-2xl bg-amber-50 border border-amber-100 p-4">
                                        <p className="text-sm text-slate-600">Mã khách sạn MySQL</p>
                                        <p className="text-lg font-semibold text-slate-900">{hotel.SqlHotelId || "HT91000001"}</p>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs font-semibold text-slate-500">Check-in</label>
                                            <input
                                                type="datetime-local"
                                                value={checkInDate}
                                                onChange={(event) => setCheckInDate(event.target.value)}
                                                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-slate-500">Check-out</label>
                                            <input
                                                type="datetime-local"
                                                value={checkOutDate}
                                                onChange={(event) => setCheckOutDate(event.target.value)}
                                                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-semibold text-slate-500">UserId để đặt phòng</label>
                                        <input
                                            value={userId}
                                            onChange={(event) => setUserId(event.target.value)}
                                            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                                        />
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            navigate("/checkout", {
                                                state: {
                                                    hotel,
                                                    room: roomList[0],
                                                    userId,
                                                    checkInDate,
                                                    checkOutDate
                                                }
                                            })
                                        }
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
                                        {roomList.map((room) => (
                                            <article key={room.roomId} className="rounded-2xl border border-slate-200 p-4 hover:shadow-md transition-shadow">
                                                <div className="flex items-center justify-between gap-3">
                                                    <h3 className="font-semibold text-slate-900">{room.type}</h3>
                                                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">Trống</span>
                                                </div>
                                                <div className="mt-3 space-y-2 text-sm text-slate-500">
                                                    <p className="flex items-center gap-2"><BedDouble className="w-4 h-4 text-slate-400" /> {room.roomId}</p>
                                                    <p className="flex items-center gap-2"><Users className="w-4 h-4 text-slate-400" /> {room.capacity} khách</p>
                                                    <p className="flex items-center gap-2"><Bath className="w-4 h-4 text-slate-400" /> {room.area} m²</p>
                                                </div>
                                                <p className="mt-4 text-lg font-bold text-slate-900">{formatVnd(room.price)}<span className="text-sm text-slate-500 font-normal"> / đêm</span></p>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        navigate("/checkout", {
                                                            state: {
                                                                hotel,
                                                                room,
                                                                userId,
                                                                checkInDate,
                                                                checkOutDate
                                                            }
                                                        })
                                                    }
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
