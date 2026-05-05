import React, { useEffect, useMemo, useState } from "react";
import { ImagePlus, Star, X } from "lucide-react";

function StarButton({ filled, onClick, onHover }) {
    return (
        <button
            type="button"
            onClick={onClick}
            onMouseEnter={onHover}
            className="p-1 rounded-md hover:bg-amber-100 transition-colors"
        >
            <Star
                className={`w-7 h-7 transition-colors ${filled ? "fill-amber-400 text-amber-500" : "text-slate-300"}`}
            />
        </button>
    );
}

export default function ReviewFormOverlay({
    open,
    onClose,
    onSubmit,
    initialHotelId = "",
    initialUserId = "",
    initialReservationId = "",
    title = "Gửi đánh giá kỳ nghỉ"
}) {
    const [hotelId, setHotelId] = useState(initialHotelId);
    const [userId, setUserId] = useState(initialUserId);
    const [reservationId, setReservationId] = useState(initialReservationId);
    const [rating, setRating] = useState(5);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState("");
    const [files, setFiles] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!open) {
            return;
        }

        setHotelId(initialHotelId || "");
        setUserId(initialUserId || "");
        setReservationId(initialReservationId || "");
    }, [initialHotelId, initialReservationId, initialUserId, open]);

    const previews = useMemo(() => {
        return files.map((file) => ({
            name: file.name,
            url: URL.createObjectURL(file)
        }));
    }, [files]);

    useEffect(() => {
        return () => {
            previews.forEach((item) => URL.revokeObjectURL(item.url));
        };
    }, [previews]);

    if (!open) {
        return null;
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setSubmitting(true);

        try {
            await onSubmit({
                HotelId: hotelId,
                UserId: userId,
                ReservationId: reservationId,
                Rating: rating,
                Comment: comment,
                Images: files.map((file) => file.name)
            });

            setFiles([]);
            setComment("");
            setRating(5);
            onClose();
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="fixed inset-0 z-[70] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-xl rounded-3xl bg-white shadow-2xl border border-slate-100 overflow-hidden">
                <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between">
                    <div>
                        <p className="text-xs uppercase tracking-wider text-amber-300">Review</p>
                        <h3 className="text-lg font-semibold">{title}</h3>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form className="p-6 space-y-5" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                            <label className="text-xs font-semibold text-slate-500">HotelId</label>
                            <input
                                value={hotelId}
                                readOnly
                                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm"
                                required
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-500">UserId</label>
                            <input
                                value={userId}
                                readOnly
                                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm"
                                required
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-500">ReservationId</label>
                            <input
                                value={reservationId}
                                readOnly
                                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <p className="text-sm font-semibold text-slate-700 mb-2">Bạn chấm trải nghiệm bao nhiêu sao?</p>
                        <div className="flex items-center gap-1" onMouseLeave={() => setHoverRating(0)}>
                            {[1, 2, 3, 4, 5].map((value) => (
                                <StarButton
                                    key={value}
                                    filled={(hoverRating || rating) >= value}
                                    onClick={() => setRating(value)}
                                    onHover={() => setHoverRating(value)}
                                />
                            ))}
                            <span className="ml-2 text-sm font-medium text-slate-500">{hoverRating || rating}/5</span>
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-semibold text-slate-700">Bình luận chi tiết</label>
                        <textarea
                            value={comment}
                            onChange={(event) => setComment(event.target.value)}
                            className="mt-2 min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm leading-relaxed"
                            placeholder="Ví dụ: Phòng sạch, check-in nhanh, buffet sáng ngon..."
                            required
                        />
                    </div>

                    <div>
                        <label className="text-sm font-semibold text-slate-700">Ảnh trải nghiệm (tùy chọn)</label>
                        <label className="mt-2 flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 px-4 py-6 cursor-pointer hover:border-amber-400 transition-colors text-slate-500 text-sm">
                            <ImagePlus className="w-5 h-5" />
                            Tải ảnh từ máy
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                className="hidden"
                                onChange={(event) => {
                                    const nextFiles = Array.from(event.target.files || []);
                                    setFiles(nextFiles);
                                }}
                            />
                        </label>

                        {previews.length > 0 && (
                            <div className="mt-3 grid grid-cols-3 gap-2">
                                {previews.map((preview) => (
                                    <div key={preview.url} className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                                        <img src={preview.url} alt={preview.name} className="w-full h-20 object-cover" />
                                        <p className="px-2 py-1 text-[11px] text-slate-500 truncate">{preview.name}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-medium hover:bg-slate-100"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold shadow-md shadow-amber-500/30 disabled:opacity-60"
                        >
                            {submitting ? "Đang gửi..." : "Gửi đánh giá"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
