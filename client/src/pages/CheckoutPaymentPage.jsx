import React, { useMemo, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { AlertTriangle, CalendarDays, CreditCard, Landmark, LoaderCircle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import SiteShell from "../components/SiteShell";
import { createBooking } from "../lib/api";
import { upsertBooking } from "../lib/bookingStorage";
import { useAuth } from "../lib/auth";

function toDateTimeLocalValue(dateValue) {
    if (!dateValue) {
        return "";
    }

    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) {
        return "";
    }

    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function toMysqlDateTime(localValue) {
    if (!localValue) {
        return "";
    }

    const normalized = localValue.replace("T", " ");
    return normalized.length === 16 ? `${normalized}:00` : normalized;
}

function calculateNights(start, end) {
    const checkIn = new Date(start);
    const checkOut = new Date(end);
    if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime())) {
        return 1;
    }

    const diffMs = checkOut.getTime() - checkIn.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return Math.max(1, diffDays);
}

function formatVnd(value) {
    return Number(value || 0).toLocaleString("vi-VN") + " VND";
}

export default function CheckoutPaymentPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser } = useAuth();

    const selectedHotel = location.state?.hotel || null;
    const selectedRoom = location.state?.room || null;

    const [userId, setUserId] = useState(location.state?.userId || "");
    const [roomId, setRoomId] = useState(selectedRoom?.roomId || selectedRoom?.RoomId || "");
    const [checkInDate, setCheckInDate] = useState(
        toDateTimeLocalValue(location.state?.checkInDate || new Date())
    );
    const [checkOutDate, setCheckOutDate] = useState(() => {
        const fallback = new Date();
        fallback.setDate(fallback.getDate() + 2);
        return toDateTimeLocalValue(location.state?.checkOutDate || fallback);
    });

    const [cardNumber, setCardNumber] = useState("");
    const [cardOwner, setCardOwner] = useState("");
    const [processing, setProcessing] = useState(false);

    const pricePerNight = Number(selectedRoom?.price || selectedRoom?.CurrentPrice || 0);
    const nights = useMemo(() => calculateNights(checkInDate, checkOutDate), [checkInDate, checkOutDate]);
    const totalAmount = pricePerNight * nights;

    const daysUntilCheckIn = useMemo(() => {
        const checkIn = new Date(checkInDate);
        const now = new Date();
        const diffMs = checkIn.getTime() - now.getTime();
        return Math.floor(diffMs / (1000 * 60 * 60 * 24));
    }, [checkInDate]);

    const payPercent = daysUntilCheckIn > 7 ? 30 : 100;
    const payNow = payPercent === 30 ? totalAmount * 0.3 : totalAmount;

    useEffect(() => {
        if (!location.state) {
            toast.warning("Checkout chỉ mở từ trang Chi tiết khách sạn");
            navigate("/");
            return;
        }

        if (!currentUser) {
            toast.warning("Vui lòng chọn user demo trước khi thanh toán");
            navigate(-1);
            return;
        }

        if (currentUser?.UserId) {
            setUserId(currentUser.UserId);
        }
    }, [location.state, currentUser, navigate]);

    async function handleCheckout(event) {
        event.preventDefault();

        if (!roomId || !userId || !checkInDate || !checkOutDate) {
            toast.error("Thiếu thông tin bắt buộc");
            return;
        }

        if (new Date(checkOutDate) <= new Date(checkInDate)) {
            toast.error("Check-out phải sau Check-in");
            return;
        }

        setProcessing(true);

        try {
            const payload = {
                roomId,
                userId,
                checkInDate: toMysqlDateTime(checkInDate),
                checkOutDate: toMysqlDateTime(checkOutDate)
            };

            const response = await createBooking(payload);
            const bookingData = response?.data || {};

            if (!response?.success) {
                throw new Error(response?.message || "Đặt phòng thất bại");
            }

            const reservationId = bookingData.reservationId;

            upsertBooking({
                reservationId,
                roomId,
                roomLabel: selectedRoom?.type || "",
                userId,
                userFullName: currentUser?.FullName || "",
                hotelId: selectedHotel?._id || "",
                hotelSqlId: selectedHotel?.SqlHotelId || "",
                hotelName: selectedHotel?.Name || "DaVinci Resort",
                checkInDate,
                checkOutDate,
                pricePerNight,
                nights,
                totalAmount,
                amountPaid: bookingData.amountPaid || payNow,
                paymentType: bookingData.paymentType || (payPercent === 30 ? "Deposit" : "FullPayment"),
                status: "Confirmed",
                createdAt: new Date().toISOString(),
                reviewSubmitted: false
            });

            toast.success(`Đặt phòng thành công: ${reservationId}`);
            navigate("/my-bookings");
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message || "Đặt phòng không thành công");
        } finally {
            setProcessing(false);
        }
    }

    return (
        <SiteShell>
            <section className="relative overflow-hidden min-h-[calc(100vh-4rem)] bg-slate-100">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(245,158,11,0.22),_rgba(255,255,255,0.1))]" />
                <div className="max-w-6xl mx-auto px-4 py-10 relative">
                    <div className="mb-6">
                        <p className="text-s uppercase tracking-[0.2em] text-amber-600 font-semibold">Checkout and Payment</p>
                        <h1 className="text-3xl font-bold text-slate-900 mt-2">Thanh toán đặt phòng</h1>
                        <p className="text-slate-600 mt-2">Trang này xử lý đúng quy tắc cọc 30% nếu đặt trước hơn 7 ngày, ngược lại thu 100%.</p>
                    </div>

                    <div className="grid lg:grid-cols-5 gap-6">
                        <form onSubmit={handleCheckout} className="lg:col-span-3 rounded-3xl bg-white border border-slate-200 p-6 shadow-lg space-y-5">
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-slate-500">RoomId</label>
                                    <input
                                        value={roomId}
                                        onChange={(event) => setRoomId(event.target.value)}
                                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-500">UserId</label>
                                    <input
                                        value={userId}
                                        onChange={(event) => setUserId(event.target.value)}
                                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-slate-500">Check-in</label>
                                    <input
                                        type="datetime-local"
                                        value={checkInDate}
                                        onChange={(event) => setCheckInDate(event.target.value)}
                                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-500">Check-out</label>
                                    <input
                                        type="datetime-local"
                                        value={checkOutDate}
                                        onChange={(event) => setCheckOutDate(event.target.value)}
                                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50">
                                <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                    <CreditCard className="w-4 h-4 text-amber-500" /> Thông tin thanh toán giả lập
                                </h2>

                                <div className="mt-3 grid sm:grid-cols-2 gap-3">
                                    <input
                                        value={cardOwner}
                                        onChange={(event) => setCardOwner(event.target.value)}
                                        placeholder="Tên chủ thẻ"
                                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                                        required
                                    />
                                    <input
                                        value={cardNumber}
                                        onChange={(event) => setCardNumber(event.target.value)}
                                        placeholder="Số thẻ (demo)"
                                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold shadow-md shadow-amber-500/30 disabled:opacity-60"
                            >
                                {processing ? "Đang xử lý giao dịch..." : "Thanh toán và xác nhận đặt phòng"}
                            </button>
                        </form>

                        <aside className="lg:col-span-2 space-y-4">
                            <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-lg">
                                <h3 className="text-lg font-bold text-slate-900">Tóm tắt đơn</h3>
                                <div className="mt-4 space-y-2 text-sm text-slate-600">
                                    <p className="flex items-center justify-between"><span>Khách sạn</span><span className="font-medium text-slate-900">{selectedHotel?.Name || "DaVinci Resort"}</span></p>
                                    <p className="flex items-center justify-between"><span>Phòng</span><span className="font-medium text-slate-900">{roomId}</span></p>
                                    <p className="flex items-center justify-between"><span>Số đêm</span><span className="font-medium text-slate-900">{nights}</span></p>
                                    <p className="flex items-center justify-between"><span>Đơn giá/đêm</span><span className="font-medium text-slate-900">{formatVnd(pricePerNight)}</span></p>
                                    <p className="pt-2 mt-2 border-t border-slate-200 flex items-center justify-between text-base font-semibold text-slate-900">
                                        <span>Tổng cộng</span>
                                        <span>{formatVnd(totalAmount)}</span>
                                    </p>
                                </div>
                            </div>

                            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-lg">
                                <h3 className="text-sm font-semibold text-amber-900 flex items-center gap-2">
                                    <Landmark className="w-4 h-4" /> Chính sách thu tiền
                                </h3>
                                <p className="text-sm text-amber-800 mt-2 leading-relaxed">
                                    {payPercent === 30
                                        ? "Bạn đang đặt trước hơn 7 ngày, hệ thống chỉ thu cọc 30% lúc đặt phòng."
                                        : "Bạn đặt gần ngày check-in, hệ thống thu 100% tại thời điểm đặt phòng."}
                                </p>
                                <p className="mt-3 text-lg font-bold text-amber-900">Thanh toán ngay: {formatVnd(payNow)}</p>
                            </div>

                            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg text-sm text-slate-600 space-y-2">
                                <p className="flex items-center gap-2"><CalendarDays className="w-4 h-4 text-amber-500" /> Ngày check-in còn lại: {daysUntilCheckIn} ngày</p>
                                <p className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-amber-500" /> Giao dịch được xử lý atomically bằng procedure MySQL</p>
                                <p className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-500" /> Nếu mạng lỗi, transaction sẽ rollback</p>
                            </div>
                        </aside>
                    </div>
                </div>

                {processing && (
                    <div className="fixed inset-0 z-[80] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center px-4">
                        <div className="rounded-2xl bg-white px-6 py-5 shadow-xl border border-slate-200 flex items-center gap-3">
                            <LoaderCircle className="w-5 h-5 animate-spin text-amber-500" />
                            <p className="text-sm font-medium text-slate-700">Đang khóa giao dịch và gọi SP_BookRoom...</p>
                        </div>
                    </div>
                )}
            </section>
        </SiteShell>
    );
}
