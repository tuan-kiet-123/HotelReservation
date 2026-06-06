import React, { useMemo, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { AlertTriangle, CalendarDays, CreditCard, Landmark, LoaderCircle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import SiteShell from "../components/SiteShell";
import { createBooking, simulatePaymentWebhook } from "../lib/api";
import { upsertBooking } from "../lib/bookingStorage";
import { useAuth } from "../lib/auth";

function toDateTimeLocalValue(dateValue) {
    if (!dateValue) return "";
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "";
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function toMysqlDateTime(localValue) {
    if (!localValue) return "";
    const normalized = localValue.replace("T", " ");
    return normalized.length === 16 ? `${normalized}:00` : normalized;
}

function calculateNights(start, end) {
    const checkIn = new Date(start);
    const checkOut = new Date(end);
    if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime())) return 1;
    const diffMs = checkOut.getTime() - checkIn.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return Math.max(1, diffDays);
}

function toDateOnly(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    date.setHours(0, 0, 0, 0);
    return date;
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
    const [checkInDate, setCheckInDate] = useState(toDateTimeLocalValue(location.state?.checkInDate || new Date()));
    const [checkOutDate, setCheckOutDate] = useState(() => {
        const fallback = new Date();
        fallback.setDate(fallback.getDate() + 2);
        return toDateTimeLocalValue(location.state?.checkOutDate || fallback);
    });

    const [cardNumber, setCardNumber] = useState("");
    const [cardOwner, setCardOwner] = useState("");
    const [processing, setProcessing] = useState(false);
    const [processingMessage, setProcessingMessage] = useState("");

    const pricePerNight = Number(selectedRoom?.price || selectedRoom?.CurrentPrice || 0);
    const nights = useMemo(() => calculateNights(checkInDate, checkOutDate), [checkInDate, checkOutDate]);
    const totalAmount = pricePerNight * nights;

    const daysUntilCheckIn = useMemo(() => {
        const checkIn = toDateOnly(checkInDate);
        const today = toDateOnly(new Date());
        if (!checkIn || !today) return 0;
        const diffMs = checkIn.getTime() - today.getTime();
        return Math.floor(diffMs / (1000 * 60 * 60 * 24));
    }, [checkInDate]);

    const payPercent = daysUntilCheckIn >= 7 ? 30 : 100;
    const payNow = payPercent === 30 ? totalAmount * 0.3 : totalAmount;

    useEffect(() => {
        if (!location.state) {
            toast.warning("Checkout chỉ mở từ trang Chi tiết khách sạn");
            navigate("/");
            return;
        }

        if (!currentUser) {
            toast.warning("Vui lòng đăng nhập trước khi thanh toán");
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
        setProcessingMessage("Đang khởi tạo giao dịch an toàn...");

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
            const paymentId = bookingData.paymentId; // Lấy paymentId từ Backend

            setProcessingMessage("Đang chuyển hướng sang Cổng thanh toán (VNPay/MoMo)...");
            
            // Giả lập: User thanh toán trên app mất khoảng 3 giây
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            setProcessingMessage("Đang chờ xác nhận từ Webhook...");

            // Bắn Webhook để backend cập nhật Pending -> Completed/Confirmed
            await simulatePaymentWebhook({ paymentId });

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

            toast.success(`Đặt phòng & Thanh toán thành công: ${reservationId}`);
            navigate("/my-bookings");
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message || "Đặt phòng không thành công");
        } finally {
            setProcessing(false);
            setProcessingMessage("");
        }
    }

    return (
        <SiteShell>
            <section className="relative overflow-hidden min-h-[calc(100vh-4rem)] bg-slate-50">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(46,196,182,0.15),_rgba(255,255,255,0.1))]" />
                <div className="max-w-6xl mx-auto px-4 py-10 relative">
                    <div className="mb-8">
                        <p className="text-sm uppercase tracking-[0.2em] text-[#FF6F61] font-bold">Thanh toán an toàn</p>
                        <h1 className="text-4xl font-black text-slate-800 mt-2">Xác nhận đặt phòng</h1>
                        <p className="text-slate-500 font-medium mt-2">Bảo mật đa lớp, xử lý nhanh chóng chỉ với vài thao tác.</p>
                    </div>

                    <div className="grid lg:grid-cols-5 gap-8">
                        <form onSubmit={handleCheckout} className="lg:col-span-3 rounded-3xl bg-white border border-white p-8 shadow-2xl space-y-6">
                            <div className="grid sm:grid-cols-2 gap-5">
                                <div>
                                    <label className="text-xs font-bold text-slate-700 mb-1.5 block">RoomId</label>
                                    <input
                                        value={roomId}
                                        readOnly
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600 outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-700 mb-1.5 block">UserId</label>
                                    <input
                                        value={userId}
                                        readOnly
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600 outline-none"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-5">
                                <div>
                                    <label className="text-xs font-bold text-slate-700 mb-1.5 block">Check-in</label>
                                    <input
                                        type="datetime-local"
                                        value={checkInDate}
                                        readOnly
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600 outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-700 mb-1.5 block">Check-out</label>
                                    <input
                                        type="datetime-local"
                                        value={checkOutDate}
                                        readOnly
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600 outline-none"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="rounded-2xl border border-[#2EC4B6]/20 p-5 bg-[#2EC4B6]/5">
                                <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
                                    <CreditCard className="w-4 h-4 text-[#2EC4B6]" /> Thông tin thanh toán (Mock)
                                </h2>

                                <div className="grid sm:grid-cols-2 gap-4">
                                    <input
                                        value={cardOwner}
                                        onChange={(event) => setCardOwner(event.target.value)}
                                        placeholder="Tên in trên thẻ"
                                        className="w-full rounded-xl border border-white bg-white px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-[#2EC4B6]/30 outline-none transition-all shadow-sm"
                                        required
                                    />
                                    <input
                                        value={cardNumber}
                                        onChange={(event) => setCardNumber(event.target.value)}
                                        placeholder="Số thẻ (VD: 4123...)"
                                        className="w-full rounded-xl border border-white bg-white px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-[#2EC4B6]/30 outline-none transition-all shadow-sm"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full py-4 rounded-xl bg-[#FF6F61] hover:bg-[#FF5A4A] text-white font-bold shadow-xl shadow-[#FF6F61]/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer text-base mt-4"
                            >
                                {processing ? "Đang xử lý giao dịch..." : "Thanh toán và Xác nhận"}
                            </button>
                        </form>

                        <aside className="lg:col-span-2 space-y-6">
                            <div className="rounded-3xl bg-white border border-white p-6 shadow-xl">
                                <h3 className="text-xl font-black text-slate-800 mb-4 pb-4 border-b border-slate-100">Tóm tắt đơn đặt phòng</h3>
                                <div className="space-y-3 text-sm font-medium text-slate-500">
                                    <p className="flex items-center justify-between"><span>Khách sạn</span><span className="font-bold text-slate-800 text-right w-1/2 truncate">{selectedHotel?.Name || "DaVinci Resort"}</span></p>
                                    <p className="flex items-center justify-between"><span>Phòng</span><span className="font-bold text-slate-800">{roomId}</span></p>
                                    <p className="flex items-center justify-between"><span>Số đêm</span><span className="font-bold text-slate-800">{nights}</span></p>
                                    <p className="flex items-center justify-between"><span>Đơn giá/đêm</span><span className="font-bold text-slate-800">{formatVnd(pricePerNight)}</span></p>
                                    <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between text-lg font-black text-slate-800">
                                        <span>Tổng cộng</span>
                                        <span>{formatVnd(totalAmount)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-3xl border border-[#FF6F61]/20 bg-[#FF6F61]/5 p-6 shadow-xl">
                                <h3 className="text-sm font-bold text-[#FF6F61] flex items-center gap-2">
                                    <Landmark className="w-5 h-5" /> Chính sách thu tiền
                                </h3>
                                <p className="text-sm font-medium text-slate-700 mt-3 leading-relaxed">
                                    {payPercent === 30
                                        ? "Bạn đang đặt trước hơn 7 ngày, hệ thống hỗ trợ chỉ thu cọc 30% lúc đặt phòng."
                                        : "Ngày Check-in sắp đến, hệ thống yêu cầu thu 100% tại thời điểm đặt phòng."}
                                </p>
                                <p className="mt-4 pt-4 border-t border-[#FF6F61]/10 text-xl font-black text-[#FF6F61]">
                                    Thanh toán ngay: {formatVnd(payNow)}
                                </p>
                            </div>

                            <div className="rounded-3xl border border-white bg-white p-6 shadow-xl text-xs font-semibold text-slate-500 space-y-3">
                                <p className="flex items-center gap-2"><CalendarDays className="w-4 h-4 text-[#2EC4B6]" /> Ngày check-in còn lại: <span className="text-slate-700">{daysUntilCheckIn} ngày</span></p>
                                <p className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-[#2EC4B6]" /> Giao dịch được bảo mật tuyệt đối an toàn</p>
                                <p className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-[#FF6F61]" /> Tiền sẽ được hoàn 100% nếu bạn huỷ trước 48h</p>
                            </div>
                        </aside>
                    </div>
                </div>

                {processing && (
                    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center px-4">
                        <div className="rounded-3xl bg-white px-8 py-6 shadow-2xl flex flex-col items-center gap-4">
                            <LoaderCircle className="w-10 h-10 animate-spin text-[#2EC4B6]" />
                            <p className="text-base font-bold text-slate-700">{processingMessage || "Đang xử lý giao dịch an toàn..."}</p>
                        </div>
                    </div>
                )}
            </section>
        </SiteShell>
    );
}
