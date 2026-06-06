import React, { useMemo, useState, useEffect } from "react";
import { Link } from "react-router";
import { CalendarDays, ClipboardCheck, CircleDollarSign, LoaderCircle, LogIn, LogOut, MessageSquareHeart, OctagonX, ReceiptText } from "lucide-react";
import { toast } from "sonner";
import { io } from "socket.io-client";
import SiteShell from "../components/SiteShell";
import ReviewFormOverlay from "../components/ReviewFormOverlay";
import { cancelReservation, createReview, fetchHotels, fetchReservations, processCheckInPayment, processCheckOut } from "../lib/api";
import { useAuth } from "../lib/auth";

function formatDateTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }
    return date.toLocaleString("vi-VN");
}

function formatVnd(value) {
    return Number(value || 0).toLocaleString("vi-VN") + " VND";
}

function getStatusMeta(status) {
    const map = {
        Confirmed: "bg-sky-100 text-sky-700 border border-sky-200",
        CheckedIn: "bg-[#2EC4B6]/10 text-[#2EC4B6] border border-[#2EC4B6]/20",
        Completed: "bg-emerald-100 text-emerald-700 border border-emerald-200",
        Cancelled: "bg-rose-100 text-rose-700 border border-rose-200"
    };

    return map[status] || "bg-slate-100 text-slate-700 border border-slate-200";
}

function calculateRefundPreview(booking) {
    const totalAmount = Number(booking.totalAmount || 0);
    const amountPaid = Number(booking.amountPaid || 0);
    const now = new Date();
    const checkIn = new Date(booking.checkInDate);
    const dayDiff = Math.floor((checkIn.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (dayDiff >= 7) {
        return {
            label: "Hoàn 100% số tiền đã thanh toán",
            refund: amountPaid,
            penalty: 0
        };
    }

    if (dayDiff > 0) {
        const penalty = totalAmount * 0.3;
        return {
            label: "Mất 30% tiền cọc",
            refund: Math.max(0, amountPaid - penalty),
            penalty
        };
    }

    return {
        label: "Không hoàn tiền",
        refund: 0,
        penalty: amountPaid
    };
}

function canCheckIn(checkInDate) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const checkIn = new Date(checkInDate);
    checkIn.setHours(0, 0, 0, 0);
    return checkIn <= now;
}

function getCheckInBlockMessage(checkInDate) {
    const now = new Date();
    const checkIn = new Date(checkInDate);
    const daysUntil = Math.ceil((checkIn.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return `Check-in từ ${formatDateTime(checkInDate)} (còn ${daysUntil} ngày)`;
}

export default function MyBookingsPage() {
    const { currentUser } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [workingReservation, setWorkingReservation] = useState("");
    const [cancelTarget, setCancelTarget] = useState(null);
    const [reviewTarget, setReviewTarget] = useState(null);
    const [hotelMetaMap, setHotelMetaMap] = useState({});

    const summary = useMemo(() => {
        return {
            total: bookings.length,
            confirmed: bookings.filter((item) => item.status === "Confirmed").length,
            checkedIn: bookings.filter((item) => item.status === "CheckedIn").length,
            completed: bookings.filter((item) => item.status === "Completed").length
        };
    }, [bookings]);

    function updateOneBooking(reservationId, patch) {
        setBookings((prev) =>
            prev.map((item) => (item.reservationId === reservationId ? { ...item, ...patch } : item))
        );
    }

    async function loadBookings(userId) {
        if (!userId) {
            setBookings([]);
            return;
        }

        try {
            const data = await fetchReservations({ userId });
            const mapped = data.map((row) => {
                const meta = hotelMetaMap[row.HotelId] || {};
                return {
                    reservationId: row.ReservationId,
                    roomId: row.RoomId,
                    roomLabel: row.RoomType || "",
                    userId: row.UserId,
                    userFullName: currentUser?.FullName || "",
                    hotelId: meta.mongoId || "",
                    hotelSqlId: row.HotelId,
                    hotelName: meta.name || "",
                    checkInDate: row.CheckInDate,
                    checkOutDate: row.CheckOutDate,
                    pricePerNight: Number(row.CurrentPrice || 0),
                    nights: Number(row.Nights || 0),
                    totalAmount: Number(row.TotalAmount || 0),
                    amountPaid: Number(row.AmountPaid || 0),
                    refundAmount: Number(row.RefundAmount || 0),
                    penaltyAmount: Number(row.PenaltyAmount || 0),
                    refundProcessedAt: row.RefundProcessedAt || null,
                    status: row.Status,
                    reviewSubmitted: false
                };
            });

            setBookings(mapped);
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message || "Không tải được danh sách đặt phòng");
        }
    }

    useEffect(() => {
        let active = true;

        async function loadHotels() {
            try {
                const hotels = await fetchHotels();
                if (!active) return;
                const map = {};
                hotels.forEach((h) => {
                    if (h?.SqlHotelId) {
                        map[h.SqlHotelId] = {
                            name: h.Name || "",
                            mongoId: h._id || ""
                        };
                    }
                });
                setHotelMetaMap(map);
            } catch (error) {
                // ignore
            }
        }

        loadHotels();
        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        if (!currentUser?.UserId) {
            setBookings([]);
            return;
        }

        loadBookings(currentUser.UserId);
    }, [currentUser, hotelMetaMap]);

    useEffect(() => {
        const socketUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";
        const socket = io(socketUrl);

        socket.on("payment_success", (data) => {
            if (currentUser?.UserId) {
                // Tải lại toàn bộ dữ liệu đơn hàng nếu có thông báo thanh toán thành công
                toast.success(`Hệ thống ghi nhận thanh toán thành công (Mã GD: ${data.paymentId}). Đang cập nhật dữ liệu...`);
                loadBookings(currentUser.UserId);
            }
        });

        return () => {
            socket.disconnect();
        };
    }, [currentUser]);

    async function handleCheckIn(reservationId) {
        setWorkingReservation(reservationId);
        try {
            const response = await processCheckInPayment({ reservationId });

            if (!response?.success) {
                throw new Error(response?.message || "Check-in thất bại");
            }

            updateOneBooking(reservationId, {
                status: "CheckedIn",
                checkedInAt: new Date().toISOString()
            });
            toast.success(`Check-in thành công: ${reservationId}`);
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message || "Check-in không thành công");
        } finally {
            setWorkingReservation("");
        }
    }

    async function handleCheckOut(reservationId) {
        setWorkingReservation(reservationId);
        try {
            const response = await processCheckOut({ reservationId });

            if (!response?.success) {
                throw new Error(response?.message || "Check-out thất bại");
            }

            updateOneBooking(reservationId, {
                status: "Completed",
                checkedOutAt: new Date().toISOString()
            });
            toast.success(`Check-out thành công: ${reservationId}`);
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message || "Check-out không thành công");
        } finally {
            setWorkingReservation("");
        }
    }

    async function handleConfirmCancel() {
        if (!cancelTarget) {
            return;
        }

        const preview = calculateRefundPreview(cancelTarget);

        try {
            const response = await cancelReservation({ reservationId: cancelTarget.reservationId });

            if (!response?.success) {
                throw new Error(response?.message || "Hủy đơn thất bại");
            }

            updateOneBooking(cancelTarget.reservationId, {
                status: "Cancelled",
                cancelledAt: new Date().toISOString(),
                refundAmount: Number(response?.data?.refundAmount ?? preview.refund),
                penaltyAmount: Number(response?.data?.penaltyAmount ?? preview.penalty),
                refundProcessedAt: response?.data?.refundProcessedAt || null,
                refundRule: preview.label
            });

            toast.success("Đã hủy đơn và cập nhật trạng thái trong DB");
            setCancelTarget(null);
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message || "Hủy đơn không thành công");
        }
    }

    async function submitReview(payload) {
        if (!reviewTarget) {
            return;
        }

        if (!reviewTarget.hotelId) {
            throw new Error("Booking này chưa có HotelId Mongo để gửi review");
        }

        const body = {
            HotelId: payload.HotelId || reviewTarget.hotelId,
            UserId: payload.UserId || reviewTarget.userId,
            ReservationId: payload.ReservationId || reviewTarget.reservationId,
            Rating: payload.Rating,
            Comment: payload.Comment,
            Images: payload.Images || []
        };

        const response = await createReview(body);
        if (!response?.success) {
            throw new Error(response?.message || "Gửi review thất bại");
        }

        updateOneBooking(reviewTarget.reservationId, { reviewSubmitted: true });
        toast.success("Gửi đánh giá thành công");
    }

    return (
        <SiteShell>
            <section className="relative overflow-hidden min-h-[calc(100vh-4rem)] bg-slate-50">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(46,196,182,0.15),_rgba(255,255,255,0))]" />
                <div className="max-w-6xl mx-auto px-4 py-10 relative">
                    <div className="mb-8">
                        <p className="text-sm uppercase tracking-[0.2em] text-[#2EC4B6] font-bold">Quản lý đặt phòng</p>
                        <h1 className="text-4xl font-black text-slate-800 mt-2">Đơn đặt phòng của tôi</h1>
                        <p className="text-slate-500 font-medium mt-2">Theo dõi, cập nhật và quản lý các chuyến đi của bạn dễ dàng.</p>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                        <div className="rounded-3xl bg-white border border-slate-100 p-6 shadow-xl">
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Tổng số đơn</p>
                            <p className="mt-2 text-3xl font-black text-slate-800">{summary.total}</p>
                        </div>
                        <div className="rounded-3xl bg-white border border-slate-100 p-6 shadow-xl">
                            <p className="text-xs text-sky-500 font-bold uppercase tracking-wider">Chờ Check-in</p>
                            <p className="mt-2 text-3xl font-black text-sky-600">{summary.confirmed}</p>
                        </div>
                        <div className="rounded-3xl bg-white border border-slate-100 p-6 shadow-xl">
                            <p className="text-xs text-[#2EC4B6] font-bold uppercase tracking-wider">Đang lưu trú</p>
                            <p className="mt-2 text-3xl font-black text-[#2EC4B6]">{summary.checkedIn}</p>
                        </div>
                        <div className="rounded-3xl bg-white border border-slate-100 p-6 shadow-xl">
                            <p className="text-xs text-emerald-500 font-bold uppercase tracking-wider">Hoàn tất</p>
                            <p className="mt-2 text-3xl font-black text-emerald-600">{summary.completed}</p>
                        </div>
                    </div>

                    {!currentUser ? (
                        <div className="rounded-3xl border border-dashed border-[#2EC4B6]/30 bg-white p-12 text-center shadow-xl">
                            <div className="w-20 h-20 bg-[#2EC4B6]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <LogIn className="w-10 h-10 text-[#2EC4B6]" />
                            </div>
                            <h2 className="mt-4 text-2xl font-black text-slate-800">Vui lòng đăng nhập</h2>
                            <p className="mt-2 text-slate-500 font-medium">Bạn cần đăng nhập để xem danh sách các đơn đặt phòng của mình.</p>
                        </div>
                    ) : bookings.length === 0 ? (
                        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-xl">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <ReceiptText className="w-10 h-10 text-slate-300" />
                            </div>
                            <h2 className="mt-4 text-2xl font-black text-slate-800">Bạn chưa có đơn đặt phòng nào</h2>
                            <p className="mt-2 text-slate-500 font-medium">Hãy tìm kiếm và đặt ngay một chuyến đi tuyệt vời.</p>
                            <Link
                                to="/"
                                className="inline-flex mt-6 px-8 py-3.5 rounded-xl bg-[#FF6F61] hover:bg-[#FF5A4A] shadow-lg shadow-[#FF6F61]/30 transition-all text-white font-bold"
                            >
                                Bắt đầu tìm kiếm
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {bookings.map((booking) => (
                                <article key={booking.reservationId} className="rounded-3xl bg-white border border-slate-100 p-6 shadow-xl hover:shadow-2xl transition-all duration-300">
                                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                                        <div className="space-y-4 flex-1">
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <h3 className="text-xl font-black text-slate-800">{booking.hotelName || "DaVinci Resort"}</h3>
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusMeta(booking.status)}`}>
                                                    {booking.status}
                                                </span>
                                            </div>

                                            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3 text-sm text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                                <p><span className="font-bold text-slate-700">Mã đơn:</span> <span className="font-medium text-slate-500">{booking.reservationId || "-"}</span></p>
                                                <p><span className="font-bold text-slate-700">Khách hàng:</span> <span className="font-medium text-slate-500">{booking.userFullName || booking.userId || "-"}</span></p>
                                                <p><span className="font-bold text-slate-700">Phòng:</span> <span className="font-medium text-slate-500">{booking.roomLabel || booking.roomId}</span></p>
                                                <p><span className="font-bold text-slate-700">Tổng đơn:</span> <span className="font-black text-[#FF6F61]">{formatVnd(booking.totalAmount)}</span></p>
                                                <p className="flex items-center gap-1.5 font-medium"><CalendarDays className="w-4 h-4 text-[#2EC4B6]" /> {formatDateTime(booking.checkInDate)}</p>
                                                <p className="flex items-center gap-1.5 font-medium"><CalendarDays className="w-4 h-4 text-[#FF6F61]" /> {formatDateTime(booking.checkOutDate)}</p>
                                            </div>

                                            {booking.status === "Cancelled" && (
                                                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                                                    <p className="font-bold">{booking.refundRule || "Đã hủy"}</p>
                                                    <p className="mt-1 font-medium">Hoàn: {formatVnd(booking.refundAmount || 0)} | Phí phạt: {formatVnd(booking.penaltyAmount || 0)}</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap gap-3 lg:flex-col lg:justify-start lg:w-48 shrink-0">
                                            {booking.status === "Confirmed" && (
                                                <div className="relative group w-full">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCheckIn(booking.reservationId)}
                                                        disabled={workingReservation === booking.reservationId || !canCheckIn(booking.checkInDate)}
                                                        className="w-full px-5 py-3 rounded-xl bg-[#2EC4B6] hover:bg-[#1DA69A] text-white text-sm font-bold shadow-lg shadow-[#2EC4B6]/30 inline-flex justify-center items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                                                    >
                                                        {workingReservation === booking.reservationId ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                                                        Check-in ngay
                                                    </button>
                                                    {!canCheckIn(booking.checkInDate) && (
                                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10 whitespace-nowrap bg-slate-800 text-white text-xs px-3 py-1.5 rounded-lg font-medium shadow-lg">
                                                            {getCheckInBlockMessage(booking.checkInDate)}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {booking.status === "CheckedIn" && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleCheckOut(booking.reservationId)}
                                                    disabled={workingReservation === booking.reservationId}
                                                    className="w-full px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold shadow-lg shadow-emerald-500/30 inline-flex justify-center items-center gap-2 disabled:opacity-60 transition-colors"
                                                >
                                                    {workingReservation === booking.reservationId ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                                                    Check-out
                                                </button>
                                            )}

                                            {(booking.status === "Confirmed" || booking.status === "CheckedIn") && (
                                                <button
                                                    type="button"
                                                    onClick={() => setCancelTarget(booking)}
                                                    className="w-full px-5 py-3 rounded-xl border-2 border-rose-100 hover:border-rose-200 hover:bg-rose-50 text-rose-600 text-sm font-bold inline-flex justify-center items-center gap-2 transition-colors"
                                                >
                                                    <OctagonX className="w-4 h-4" />
                                                    Hủy đơn
                                                </button>
                                            )}

                                            {booking.status === "Completed" && !booking.reviewSubmitted && (
                                                <button
                                                    type="button"
                                                    onClick={() => setReviewTarget(booking)}
                                                    className="w-full px-5 py-3 rounded-xl bg-[#FF6F61] hover:bg-[#FF5A4A] text-white text-sm font-bold shadow-lg shadow-[#FF6F61]/30 inline-flex justify-center items-center gap-2 transition-colors"
                                                >
                                                    <MessageSquareHeart className="w-4 h-4" />
                                                    Đánh giá ngay
                                                </button>
                                            )}

                                            {booking.reviewSubmitted && (
                                                <div className="w-full px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 text-sm font-bold inline-flex justify-center items-center gap-2">
                                                    <ClipboardCheck className="w-4 h-4" /> Đã đánh giá
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </div>

                {cancelTarget && (
                    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="w-full max-w-md rounded-3xl bg-white border border-white shadow-2xl p-8 transform transition-all">
                            <h3 className="text-xl font-black text-slate-800">Xác nhận hủy đơn</h3>
                            <p className="text-sm font-medium text-slate-500 mt-2">Bạn có chắc chắn muốn huỷ chuyến đi này không?</p>

                            <div className="mt-6 rounded-2xl bg-amber-50 border border-amber-200 p-5 text-sm">
                                {(() => {
                                    const preview = calculateRefundPreview(cancelTarget);
                                    return (
                                        <>
                                            <p className="font-bold text-amber-800">{preview.label}</p>
                                            <p className="mt-2 font-medium text-amber-700">Hoàn dự kiến: <span className="font-bold">{formatVnd(preview.refund)}</span></p>
                                            <p className="mt-1 font-medium text-amber-700">Phí phạt dự kiến: <span className="font-bold">{formatVnd(preview.penalty)}</span></p>
                                        </>
                                    );
                                })()}
                            </div>

                            <div className="mt-8 flex flex-col sm:flex-row justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setCancelTarget(null)}
                                    className="px-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors"
                                >
                                    Giữ lại đơn
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirmCancel}
                                    className="px-6 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold shadow-lg shadow-rose-500/30 inline-flex justify-center items-center gap-2 transition-colors"
                                >
                                    <CircleDollarSign className="w-4 h-4" /> Xác nhận hủy
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <ReviewFormOverlay
                    open={Boolean(reviewTarget)}
                    onClose={() => setReviewTarget(null)}
                    onSubmit={submitReview}
                    initialHotelId={reviewTarget?.hotelId || ""}
                    initialUserId={reviewTarget?.userId || ""}
                    initialReservationId={reviewTarget?.reservationId || ""}
                />
            </section>
        </SiteShell>
    );
}
