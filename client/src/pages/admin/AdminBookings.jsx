import React, { useState } from 'react';
import { Calendar as CalendarIcon, Filter, Search, ChevronLeft, ChevronRight, UserCheck, AlertTriangle, Clock, XCircle, CheckCircle2 } from 'lucide-react';

// Dummy Bookings Data
const bookingsData = [
    { id: 'BK-1001', guest: 'Nguyễn Văn A', room: 'Presidential Suite', checkIn: '2026-04-26', checkOut: '2026-04-29', status: 'CheckedIn', paid: true, autoCancel: false },
    { id: 'BK-1002', guest: 'Trần Thị B', room: 'Ocean View Villa', checkIn: '2026-04-27', checkOut: '2026-04-30', status: 'PendingCheckIn', paid: false, autoCancel: true },
    { id: 'BK-1003', guest: 'Lê Văn C', room: 'Deluxe Double', checkIn: '2026-04-27', checkOut: '2026-04-28', status: 'PendingCheckIn', paid: true, autoCancel: false },
    { id: 'BK-1004', guest: 'Phạm Thị D', room: 'Standard Room', checkIn: '2026-04-25', checkOut: '2026-04-27', status: 'CheckedOut', paid: true, autoCancel: false },
    { id: 'BK-1005', guest: 'Hoàng Văn E', room: 'Ocean View Villa', checkIn: '2026-04-27', checkOut: '2026-05-02', status: 'Cancelled', paid: false, autoCancel: false },
];

const StatusIndicator = ({ status, autoCancel }) => {
    if (autoCancel && status === 'PendingCheckIn') {
        return (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20">
                <AlertTriangle className="w-3.5 h-3.5" /> Sắp hủy (23:59 nay)
            </div>
        );
    }
    switch (status) {
        case 'CheckedIn':
            return <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"><UserCheck className="w-3.5 h-3.5" /> Đã nhận phòng</div>;
        case 'PendingCheckIn':
            return <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20"><Clock className="w-3.5 h-3.5" /> Chờ nhận phòng</div>;
        case 'CheckedOut':
            return <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20"><CheckCircle2 className="w-3.5 h-3.5" /> Đã trả phòng</div>;
        case 'Cancelled':
            return <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-800 text-slate-500 border border-slate-700"><XCircle className="w-3.5 h-3.5" /> Đã hủy</div>;
        default:
            return null;
    }
};

const AdminBookings = () => {
    const [currentDate, setCurrentDate] = useState(new Date('2026-04-27'));
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterPayment, setFilterPayment] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');

    const formatDisplayDate = (date) => {
        return `${date.getDate()} Tháng ${date.getMonth() + 1}, ${date.getFullYear()}`;
    };

    const filteredBookings = bookingsData.filter((booking) => {
        if (filterStatus !== 'All' && booking.status !== filterStatus) return false;
        if (filterPayment === 'Paid' && !booking.paid) return false;
        if (filterPayment === 'Unpaid' && booking.paid) return false;
        if (searchTerm && !booking.guest.toLowerCase().includes(searchTerm.toLowerCase()) && !booking.room.toLowerCase().includes(searchTerm.toLowerCase()) && !booking.id.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        return true;
    });

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex justify-end">
                <div className="flex items-center gap-3 bg-slate-900 border border-slate-700 rounded-lg p-1 w-full sm:w-auto">
                    <button
                        onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate() - 1); setCurrentDate(d); }}
                        className="p-1.5 hover:bg-slate-800 rounded-md text-slate-400 hover:text-white transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-2 px-2">
                        <CalendarIcon className="w-4 h-4 text-amber-500" />
                        <input
                            type="date"
                            value={`${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`}
                            onChange={(e) => {
                                if (e.target.value) {
                                    setCurrentDate(new Date(e.target.value));
                                }
                            }}
                            className="bg-transparent text-sm font-medium text-slate-200 outline-none cursor-pointer [&::-webkit-calendar-picker-indicator]:invert-[0.8] hover:text-amber-500 transition-colors"
                        />
                    </div>
                    <button
                        onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate() + 1); setCurrentDate(d); }}
                        className="p-1.5 hover:bg-slate-800 rounded-md text-slate-400 hover:text-white transition-colors"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="flex-1 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl flex flex-col overflow-hidden">

                {/* Toolbar */}
                <div className="p-4 border-b border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1.5 text-xs font-medium text-slate-400 px-3 py-1.5 bg-slate-900 rounded-full border border-slate-800">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Đã nhận phòng
                        </span>
                        <span className="flex items-center gap-1.5 text-xs font-medium text-slate-400 px-3 py-1.5 bg-slate-900 rounded-full border border-slate-800">
                            <span className="w-2 h-2 rounded-full bg-amber-500"></span> Chờ nhận phòng
                        </span>
                        <span className="flex items-center gap-1.5 text-xs font-medium text-slate-400 px-3 py-1.5 bg-slate-900 rounded-full border border-slate-800">
                            <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></span> Sắp hủy tự động
                        </span>
                    </div>

                    <div className="flex flex-col xl:flex-row items-center gap-3 w-full sm:w-auto">
                        <select 
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="appearance-none bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500 transition-colors w-full xl:w-auto"
                        >
                            <option value="All">Trạng thái: Tất cả</option>
                            <option value="CheckedIn">Đã nhận phòng</option>
                            <option value="PendingCheckIn">Chờ nhận phòng</option>
                            <option value="CheckedOut">Đã trả phòng</option>
                            <option value="Cancelled">Đã hủy</option>
                        </select>

                        <select 
                            value={filterPayment}
                            onChange={(e) => setFilterPayment(e.target.value)}
                            className="appearance-none bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500 transition-colors w-full xl:w-auto"
                        >
                            <option value="All">Thanh toán: Tất cả</option>
                            <option value="Paid">Đã thanh toán</option>
                            <option value="Unpaid">Chưa thanh toán</option>
                        </select>

                        <div className="relative flex-1 w-full xl:w-64">
                            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Tên khách, Mã phòng..."
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 focus:border-amber-500 outline-none transition-colors"
                            />
                        </div>
                    </div>
                </div>

                {/* Bookings Grid/List View */}
                <div className="flex-1 overflow-auto p-4 custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredBookings.map((booking) => (
                            <div
                                key={booking.id}

                                className={`bg-slate-900 border rounded-xl p-5 flex flex-col gap-4 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 ${booking.autoCancel && booking.status === 'PendingCheckIn'
                                    ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.1)]'
                                    : 'border-slate-700 hover:border-slate-600 shadow-lg'
                                    }`}
                            >
                                {/* Left accent border */}
                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${booking.status === 'CheckedIn' ? 'bg-emerald-500' :
                                    booking.status === 'PendingCheckIn' && booking.autoCancel ? 'bg-red-500' :
                                        booking.status === 'PendingCheckIn' ? 'bg-amber-500' :
                                            'bg-slate-600'
                                    }`}></div>

                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 mb-1">{booking.id}</p>
                                        <h3 className="text-base font-bold text-white line-clamp-1">{booking.guest}</h3>
                                        <p className="text-sm font-medium text-amber-500 mt-0.5">{booking.room}</p>
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
                                    <StatusIndicator status={booking.status} autoCancel={booking.autoCancel} />

                                    <button className="text-xs font-semibold text-amber-500 hover:text-amber-400 hover:underline">
                                        Chi tiết
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AdminBookings;
