import React, { useState } from 'react';
import { Filter, Search, AlertTriangle, ArrowRight, Activity, CalendarDays } from 'lucide-react';

// Dummy Data
const priceLogsData = [
    { id: 'LOG-001', room: 'Presidential Suite', oldPrice: 20000000, newPrice: 32000000, date: '2026-04-27 10:15', updatedBy: 'System (Trigger)' },
    { id: 'LOG-002', room: 'Ocean View Villa', oldPrice: 15000000, newPrice: 16500000, date: '2026-04-26 14:30', updatedBy: 'Admin User' },
    { id: 'LOG-003', room: 'Deluxe Double', oldPrice: 5000000, newPrice: 8000000, date: '2026-04-25 09:00', updatedBy: 'System (Trigger)' },
    { id: 'LOG-004', room: 'Standard Room', oldPrice: 2000000, newPrice: 1800000, date: '2026-04-24 16:20', updatedBy: 'Admin User' },
];

const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
};

const AdminPriceLogs = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterWarning, setFilterWarning] = useState(false);

    const filteredLogs = React.useMemo(() => {
        return priceLogsData.filter(log => {
            const diff = log.newPrice - log.oldPrice;
            const percentChange = (diff / log.oldPrice) * 100;
            const isWarning = Math.abs(percentChange) >= 50;

            const matchesSearch = !searchTerm ||
                log.room.toLowerCase().includes(searchTerm.toLowerCase()) ||
                log.updatedBy.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesWarning = !filterWarning || isWarning;

            return matchesSearch && matchesWarning;
        });
    }, [searchTerm, filterWarning]);

    return (
        <div className="space-y-6 h-full flex flex-col">


            <div className="flex-1 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl flex flex-col overflow-hidden">

                {/* Toolbar */}
                <div className="p-4 border-b border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3 bg-slate-900 border border-slate-700 rounded-lg p-1">
                        <button
                            onClick={() => setFilterWarning(false)}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md shadow flex items-center gap-2 transition-colors ${!filterWarning ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                        >
                            <Activity className="w-4 h-4" /> Tất cả
                        </button>
                        <button
                            onClick={() => setFilterWarning(true)}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${filterWarning ? 'bg-amber-500 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                        >
                            <AlertTriangle className="w-4 h-4" /> Bất thường (&gt;50%)
                        </button>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-72">
                            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Tìm theo tên phòng, người cập nhật..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 focus:border-amber-500 outline-none transition-colors"
                            />
                        </div>
                    </div>
                </div>

                {/* Data Table */}
                <div className="flex-1 overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-slate-900/80 border-b border-slate-700">
                                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Thời gian & Phòng</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">Biến động Giá</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Tỷ lệ</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Người cập nhật</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-8 text-center text-slate-400">Không tìm thấy nhật ký giá phù hợp.</td>
                                </tr>
                            ) : filteredLogs.map((log) => {
                                const diff = log.newPrice - log.oldPrice;
                                const percentChange = (diff / log.oldPrice) * 100;
                                const isWarning = Math.abs(percentChange) >= 50;

                                return (
                                    <tr key={log.id} className={`transition-colors ${isWarning ? 'bg-red-500/5 hover:bg-red-500/10' : 'hover:bg-slate-700/20'}`}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isWarning ? 'bg-red-500/20 text-red-500' : 'bg-slate-800 border border-slate-700 text-slate-400'}`}>
                                                    {isWarning ? <AlertTriangle className="w-5 h-5" /> : <CalendarDays className="w-5 h-5" />}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-white">{log.room}</p>
                                                    <p className="text-xs font-medium text-slate-400 mt-0.5">{log.date}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-3">
                                                <span className="text-sm font-medium text-slate-500 line-through decoration-red-500/50">{formatCurrency(log.oldPrice)}</span>
                                                <ArrowRight className="w-4 h-4 text-slate-600" />
                                                <span className={`text-sm font-bold ${diff > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>{formatCurrency(log.newPrice)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${isWarning
                                                ? 'bg-red-500/10 text-red-500 border-red-500/20'
                                                : diff > 0
                                                    ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                                    : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                                }`}>
                                                {diff > 0 ? '+' : ''}{percentChange.toFixed(1)}%
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-400 uppercase">
                                                    {log.updatedBy.charAt(0)}
                                                </div>
                                                <span className="text-sm font-medium text-slate-300">{log.updatedBy}</span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

            </div>
        </div>
    );
};

export default AdminPriceLogs;
