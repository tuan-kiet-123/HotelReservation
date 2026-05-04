import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import SiteShell from "../components/SiteShell";
import ReviewFormOverlay from "../components/ReviewFormOverlay";
import { createReview } from "../lib/api";

export default function ReviewOverlayPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [open, setOpen] = useState(true);

    async function handleSubmit(payload) {
        const response = await createReview(payload);
        if (!response?.success) {
            throw new Error(response?.message || "Không thể gửi review");
        }
        toast.success("Review đã được gửi");
    }

    function handleClose() {
        setOpen(false);
        navigate("/my-bookings");
    }

    return (
        <SiteShell>
            <section className="min-h-[calc(100vh-4rem)] bg-[linear-gradient(145deg,#fff8eb_0%,#f8fafc_60%)] px-4 py-16">
                <div className="max-w-3xl mx-auto rounded-3xl border border-slate-200 bg-white p-8 shadow-lg text-center">
                    <p className="text-xs uppercase tracking-[0.2em] text-amber-600 font-semibold">1.6 Review Overlay</p>
                    <h1 className="mt-2 text-3xl font-bold text-slate-900">Trang yêu cầu đánh giá sau checkout</h1>
                    <p className="mt-3 text-slate-600">
                        Đây là phiên bản trang độc lập cho modal review. Bạn có thể mở trực tiếp bằng URL và nhập tay HotelId/UserId/ReservationId.
                    </p>
                </div>

                <ReviewFormOverlay
                    open={open}
                    onClose={handleClose}
                    onSubmit={handleSubmit}
                    initialHotelId={searchParams.get("hotelId") || ""}
                    initialUserId={searchParams.get("userId") || ""}
                    initialReservationId={searchParams.get("reservationId") || ""}
                    title="Đánh giá sau khi hoàn tất lưu trú"
                />
            </section>
        </SiteShell>
    );
}
