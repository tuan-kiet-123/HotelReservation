import React, { useMemo, useState, useEffect } from "react";
import { Link } from "react-router";
import { CalendarDays, ClipboardCheck, CircleDollarSign, LoaderCircle, LogIn, LogOut, MessageSquareHeart, OctagonX, ReceiptText } from "lucide-react";
import { toast } from "sonner";
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
        Confirmed: "bg-sky-100 text-sky-700",
        CheckedIn: "bg-amber-100 text-amber-700",
        Completed: "bg-emerald-100 text-emerald-700",
        Cancelled: "bg-rose-100 text-rose-700"
    };

    return map[status] || "bg-slate-100 text-slate-700";
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
                refundAmount: preview.refund,
                penaltyAmount: preview.penalty,
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
            <section className="relative overflow-hidden min-h-[calc(100vh-4rem)] bg-slate-100">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.2),_rgba(255,255,255,0))]" />
                <div className="max-w-6xl mx-auto px-4 py-10 relative">
                    <div className="mb-6">
                        <p className="text-s uppercase tracking-[0.2em] text-amber-600 font-semibold">Booking Management</p>
                        <h1 className="text-3xl font-bold text-slate-900 mt-2">Đơn đặt phòng của tôi</h1>
                        <p className="text-slate-600 mt-2">Theo dõi trạng thái Confirmed → CheckedIn → Completed, và mở modal review 1.6 khi hoàn tất.</p>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm">
                            <p className="text-xs text-slate-500 uppercase">Tổng đơn</p>
                            <p className="mt-1 text-2xl font-bold text-slate-900">{summary.total}</p>
                        </div>
                        <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm">
                            <p className="text-xs text-slate-500 uppercase">Confirmed</p>
                            <p className="mt-1 text-2xl font-bold text-sky-700">{summary.confirmed}</p>
                        </div>
                        <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm">
                            <p className="text-xs text-slate-500 uppercase">CheckedIn</p>
                            <p className="mt-1 text-2xl font-bold text-amber-700">{summary.checkedIn}</p>
                        </div>
                        <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm">
                            <p className="text-xs text-slate-500 uppercase">Completed</p>
                            <p className="mt-1 text-2xl font-bold text-emerald-700">{summary.completed}</p>
                        </div>
                    </div>

                    {bookings.length === 0 && (
                        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
                            <ReceiptText className="w-10 h-10 mx-auto text-slate-400" />
                            <h2 className="mt-3 text-xl font-semibold text-slate-800">Bạn chưa có đơn đặt phòng nào</h2>
                            <p className="mt-2 text-sm text-slate-500">Chọn user demo để xem các đơn từ DB, sau đó test check-in/check-out/review.</p>
                            <Link
                                to="/hotels/69ca837d9a90b3531e860c22"
                                className="inline-flex mt-5 px-5 py-2.5 rounded-xl bg-slate-900 text-white font-medium"
                            >
                                Đi tới trang chi tiết khách sạn
                            </Link>
                        </div>
                    )}

                    <div className="space-y-4">
                        {bookings.map((booking) => (
                            <article key={booking.reservationId} className="rounded-3xl bg-white border border-slate-200 p-5 shadow-md">
                                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <h3 className="text-lg font-bold text-slate-900">{booking.hotelName || "DaVinci Resort"}</h3>
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusMeta(booking.status)}`}>
                                                {booking.status}
                                            </span>
                                        </div>

                                        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2 text-sm text-slate-600">
                                            <p><span className="font-medium text-slate-700">Mã đơn:</span> {booking.reservationId || "-"}</p>
                                            <p><span className="font-medium text-slate-700">Khách hàng:</span> {booking.userFullName || booking.userId || "-"}</p>
                                            <p><span className="font-medium text-slate-700">Phòng:</span> {booking.roomLabel || booking.roomId}</p>
                                            <p className="flex items-center gap-1"><CalendarDays className="w-4 h-4 text-amber-500" /> {formatDateTime(booking.checkInDate)}</p>
                                            <p className="flex items-center gap-1"><CalendarDays className="w-4 h-4 text-amber-500" /> {formatDateTime(booking.checkOutDate)}</p>
                                            <p><span className="font-medium text-slate-700">Đã thanh toán:</span> {formatVnd(booking.amountPaid)}</p>
                                            <p><span className="font-medium text-slate-700">Tổng đơn:</span> {formatVnd(booking.totalAmount)}</p>
                                        </div>

                                        {booking.status === "Cancelled" && (
                                            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                                                <p>{booking.refundRule || "Đã hủy"}</p>
                                                <p>Hoàn: {formatVnd(booking.refundAmount || 0)} | Phí phạt: {formatVnd(booking.penaltyAmount || 0)}</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap gap-2 lg:justify-end">
                                        {booking.status === "Confirmed" && (
                                            <button
                                                type="button"
                                                onClick={() => handleCheckIn(booking.reservationId)}
                                                disabled={workingReservation === booking.reservationId}
                                                className="px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-60"
                                            >
                                                {workingReservation === booking.reservationId ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                                                Check-in
                                            </button>
                                        )}

                                        {booking.status === "CheckedIn" && (
                                            <button
                                                type="button"
                                                onClick={() => handleCheckOut(booking.reservationId)}
                                                disabled={workingReservation === booking.reservationId}
                                                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-60"
                                            >
                                                {workingReservation === booking.reservationId ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                                                Check-out
                                            </button>
                                        )}

                                        {(booking.status === "Confirmed" || booking.status === "CheckedIn") && (
                                            <button
                                                type="button"
                                                onClick={() => setCancelTarget(booking)}
                                                className="px-4 py-2 rounded-xl border border-rose-300 text-rose-600 text-sm font-semibold inline-flex items-center gap-2"
                                            >
                                                <OctagonX className="w-4 h-4" />
                                                Hủy đơn
                                            </button>
                                        )}

                                        {booking.status === "Completed" && !booking.reviewSubmitted && (
                                            <button
                                                type="button"
                                                onClick={() => setReviewTarget(booking)}
                                                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold inline-flex items-center gap-2"
                                            >
                                                <MessageSquareHeart className="w-4 h-4" />
                                                Đánh giá
                                            </button>
                                        )}

                                        {booking.reviewSubmitted && (
                                            <span className="px-3 py-2 rounded-xl bg-emerald-100 text-emerald-700 text-sm font-semibold inline-flex items-center gap-2">
                                                <ClipboardCheck className="w-4 h-4" /> Đã đánh giá
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>

                {cancelTarget && (
                    <div className="fixed inset-0 z-[60] bg-slate-950/65 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-xl p-6">
                            <h3 className="text-lg font-semibold text-slate-900">Xác nhận hủy đơn</h3>
                            <p className="text-sm text-slate-600 mt-2">Đơn đặt: ẩn (hiển thị trong thông báo)</p>

                            <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm">
                                {(() => {
                                    const preview = calculateRefundPreview(cancelTarget);
                                    return (
                                        <>
                                            <p className="font-semibold text-amber-800">{preview.label}</p>
                                            <p className="mt-1 text-amber-700">Hoàn dự kiến: {formatVnd(preview.refund)}</p>
                                            <p className="text-amber-700">Phí phạt dự kiến: {formatVnd(preview.penalty)}</p>
                                        </>
                                    );
                                })()}
                            </div>

                            <div className="mt-5 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setCancelTarget(null)}
                                    className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600"
                                >
                                    Đóng
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirmCancel}
                                    className="px-4 py-2 rounded-xl bg-rose-600 text-white inline-flex items-center gap-2"
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
