import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Calendar as CalendarIcon, Search, ChevronLeft, ChevronRight, UserCheck, AlertTriangle, Clock, XCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { fetchAdminBookings, fetchHotels } from '../../lib/adminApiService';

// Fallback Dummy Data
const DUMMY_BOOKINGS = [
    { id: 'BK-1001', guest: 'Nguyễn Văn A', hotelId: 'HOTEL001', room: 'Presidential Suite', checkIn: '2026-04-26', checkOut: '2026-04-29', status: 'CheckedIn', paid: true },
    { id: 'BK-1002', guest: 'Trần Thị B', hotelId: 'HOTEL002', room: 'Ocean View Villa', checkIn: '2026-04-27', checkOut: '2026-04-30', status: 'Confirmed', paid: false },
    { id: 'BK-1003', guest: 'Lê Văn C', hotelId: 'HOTEL001', room: 'Deluxe Double', checkIn: '2026-04-27', checkOut: '2026-04-28', status: 'Confirmed', paid: true },
    { id: 'BK-1004', guest: 'Phạm Thị D', hotelId: 'HOTEL003', room: 'Standard Room', checkIn: '2026-04-25', checkOut: '2026-04-27', status: 'Completed', paid: true },
    { id: 'BK-1005', guest: 'Hoàng Văn E', hotelId: 'HOTEL002', room: 'Ocean View Villa', checkIn: '2026-04-27', checkOut: '2026-05-02', status: 'Cancelled', paid: false },
];

const StatusIndicator = ({ status }) => {
    switch (status) {
        case 'Confirmed':
            return <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20"><Clock className="w-3.5 h-3.5" /> Đã xác nhận</div>;
        case 'CheckedIn':
            return <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"><UserCheck className="w-3.5 h-3.5" /> Đã nhận phòng</div>;
        case 'Completed':
            return <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"><CheckCircle2 className="w-3.5 h-3.5" /> Hoàn thành</div>;
        case 'Cancelled':
            return <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-800 text-slate-500 border border-slate-700"><XCircle className="w-3.5 h-3.5" /> Đã hủy</div>;
        default:
            return null;
    }
};

const toTimestamp = (value) => {
    const ts = new Date(value).getTime();
    return Number.isFinite(ts) ? ts : 0;
};

const AdminBookings = () => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [filterHotel, setFilterHotel] = useState('All');
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterPayment, setFilterPayment] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [bookings, setBookings] = useState(DUMMY_BOOKINGS);
    const [hotels, setHotels] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    const hotelMap = useMemo(() => {
        return hotels.reduce((acc, hotel) => {
            if (hotel?.SqlHotelId) {
                acc[hotel.SqlHotelId] = hotel?.Name || hotel?.HotelName || hotel?.name || hotel.SqlHotelId;
            }
            return acc;
        }, {});
    }, [hotels]);

    const loadHotels = useCallback(async () => {
        try {
            const data = await fetchHotels();
            if (Array.isArray(data)) {
                setHotels(data);
            }
        } catch {
            // Keep fallback booking data if hotel lookup fails.
        }
    }, []);

    useEffect(() => {
        loadHotels();
    }, [loadHotels]);

    const loadBookings = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page, pageSize: 10 };
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;
            if (filterHotel !== 'All') params.hotelId = filterHotel;
            if (filterStatus !== 'All') params.status = filterStatus;
            if (filterPayment !== 'All') params.paid = filterPayment === 'Paid';
            if (searchTerm.trim()) params.search = searchTerm.trim();

            const result = await fetchAdminBookings(params);
            const data = Array.isArray(result.data) ? result.data : [];

            setBookings(data);
            setTotalPages(Math.max(1, Number(result.totalPages) || 1));
            setTotalItems(Number(result.total) || data.length);
        } catch {
            // Interceptor already fired toast
        } finally {
            setLoading(false);
        }
    }, [page, startDate, endDate, filterHotel, filterStatus, filterPayment, searchTerm]);

    useEffect(() => { loadBookings(); }, [loadBookings]);

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex-1 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl flex flex-col overflow-hidden">

                {/* Toolbar */}
                <div className="p-4 border-b border-slate-700 space-y-4">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="flex items-center gap-1.5 text-xs font-medium text-slate-400 px-3 py-1.5 bg-slate-900 rounded-full border border-slate-800">
                            <span className="w-2 h-2 rounded-full bg-amber-500"></span> Đã xác nhận
                        </span>
                        <span className="flex items-center gap-1.5 text-xs font-medium text-slate-400 px-3 py-1.5 bg-slate-900 rounded-full border border-slate-800">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Đã nhận phòng
                        </span>
                        <span className="flex items-center gap-1.5 text-xs font-medium text-slate-400 px-3 py-1.5 bg-slate-900 rounded-full border border-slate-800">
                            <span className="w-2 h-2 rounded-full bg-cyan-400"></span> Hoàn thành
                        </span>
                    </div>

                    <div className="flex flex-col xl:flex-row items-center gap-3 w-full">
                        <select
                            value={filterHotel}
                            onChange={(e) => { setFilterHotel(e.target.value); setPage(1); }}
                            className="appearance-none bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500 transition-colors w-full xl:w-64"
                        >
                            <option value="All">Khách sạn: Tất cả</option>
                            {hotels.map((hotel, index) => {
                                const hotelKey = hotel?.SqlHotelId || hotel?.id || hotel?._id || `hotel-${index}`;
                                const hotelLabel = hotel?.Name || hotel?.HotelName || hotel?.name || hotelKey;

                                return (
                                <option key={hotelKey} value={hotel?.SqlHotelId || hotelKey}>
                                    {hotelLabel}
                                </option>
                                );
                            })}
                        </select>

                        <select
                            value={filterStatus}
                            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
                            className="appearance-none bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500 transition-colors w-full xl:w-56"
                        >
                            <option value="All">Trạng thái: Tất cả</option>
                            <option value="Confirmed">Đã xác nhận</option>
                            <option value="CheckedIn">Đã nhận phòng</option>
                            <option value="Completed">Hoàn thành</option>
                            <option value="Cancelled">Đã hủy</option>
                        </select>

                        <select
                            value={filterPayment}
                            onChange={(e) => { setFilterPayment(e.target.value); setPage(1); }}
                            className="appearance-none bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500 transition-colors w-full xl:w-56"
                        >
                            <option value="All">Thanh toán: Tất cả</option>
                            <option value="Paid">Đã thanh toán</option>
                            <option value="Unpaid">Chưa thanh toán</option>
                        </select>

                        <div className="relative flex-1 w-full xl:w-72">
                            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                                placeholder="Mã đặt phòng, mã user, phòng..."
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 focus:border-amber-500 outline-none transition-colors"
                            />
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
                        <div className="flex items-center gap-2 text-slate-400">
                            <CalendarIcon className="w-4 h-4" />
                            <span className="text-sm font-medium">Khoảng ngày check-in:</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:border-amber-500 outline-none"
                            />
                            <span className="text-slate-600">đến</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:border-amber-500 outline-none"
                            />
                        </div>
                        <button
                            onClick={() => {
                                setStartDate('');
                                setEndDate('');
                                setPage(1);
                            }}
                            className="text-xs text-amber-500 hover:text-amber-400 font-medium"
                        >
                            Xóa lọc ngày
                        </button>
                    </div>
                </div>

                {/* Bookings Grid/List View */}
                <div className="flex-1 overflow-auto p-4 custom-scrollbar">
                    {loading ? (
                        <div className="h-full flex items-center justify-center">
                            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                        </div>
                    ) : (
                    <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {[...bookings]
                            .sort((a, b) => {
                                const dateDiff = toTimestamp(b.createdAt || b.checkIn) - toTimestamp(a.createdAt || a.checkIn);
                                if (dateDiff !== 0) return dateDiff;
                                return String(b.id || '').localeCompare(String(a.id || ''));
                            })
                            .map((booking) => (
                            <div
                                key={booking.id}
                                className={`bg-slate-900 border rounded-xl p-5 flex flex-col gap-4 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 ${booking.autoCancel && booking.status === 'PendingCheckIn'
                                    ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.1)]'
                                    : 'border-slate-700 hover:border-slate-600 shadow-lg'
                                    }`}
                            >
                                {/* Left accent border */}
                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${booking.status === 'Confirmed' ? 'bg-amber-500' :
                                    booking.status === 'CheckedIn' ? 'bg-emerald-500' :
                                        booking.status === 'Completed' ? 'bg-cyan-400' :
                                            'bg-slate-600'
                                    }`}></div>

                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 mb-1">{booking.id}</p>
                                        <h3 className="text-base font-bold text-white line-clamp-1">{booking.guest}</h3>
                                        <p className="text-sm font-medium text-amber-500 mt-0.5">{booking.room}</p>
                                        <p className="text-xs text-slate-500 mt-1">{hotelMap[booking.hotelId] || booking.hotelId || 'Khách sạn'}</p>
                                    </div>
                                    <div className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded text-xs font-medium text-slate-300">
                                        {booking.paid ? <span className="text-emerald-400">Đã thanh toán</span> : <span className="text-amber-400">Chưa TT</span>}
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 text-sm bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                                    <div className="flex-1">
                                        <p className="text-xs text-slate-500 mb-0.5">Check-in</p>
                                        <p className="font-semibold text-slate-200">{booking.checkIn}</p>
                                    </div>
                                    <div className="w-px h-8 bg-slate-700"></div>
                                    <div className="flex-1 text-right">
                                        <p className="text-xs text-slate-500 mb-0.5">Check-out</p>
                                        <p className="font-semibold text-slate-200">{booking.checkOut}</p>
                                    </div>
                                </div>

                                <div className="mt-auto pt-2 flex items-center justify-between">
                                    <StatusIndicator status={booking.status} />

                                    <button className="text-xs font-semibold text-amber-500 hover:text-amber-400 hover:underline">
                                        Chi tiết
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    {bookings.length === 0 && (
                        <div className="py-16 text-center text-slate-400 text-sm">
                            Không tìm thấy đặt phòng phù hợp.
                        </div>
                    )}
                    <div className="flex items-center justify-between mt-6 px-2">
                        <span className="text-sm text-slate-400">
                            Trang {page} / {totalPages} · {totalItems} đặt phòng
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage((current) => Math.max(1, current - 1))}
                                disabled={page === 1}
                                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-300 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Trang trước
                            </button>
                            <button
                                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                                disabled={page === totalPages}
                                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-300 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Trang sau
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                    </>
                    )}
                </div>

            </div>
        </div>
    );
};

export default AdminBookings;
