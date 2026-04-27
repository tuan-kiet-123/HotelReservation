import React, { useState, useMemo } from 'react';
import { Filter, Download, Search, CheckCircle2, XCircle, ArrowUpRight, ArrowDownLeft, Clock, Calendar } from 'lucide-react';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

// Dummy Data
const transactionData = [
    { id: 'TXN-001', date: '2026-04-27 10:30', type: 'Credit', category: 'Thanh toán toàn bộ', amount: 15000000, status: 'Completed', room: 'Presidential Suite' },
    { id: 'TXN-002', date: '2026-04-27 09:15', type: 'Credit', category: 'Đặt cọc', amount: 3000000, status: 'Completed', room: 'Ocean View Villa' },
    { id: 'TXN-003', date: '2026-04-26 15:45', type: 'Debit', category: 'Hoàn tiền', amount: 5000000, status: 'Processing', room: 'Deluxe Double' },
    { id: 'TXN-004', date: '2026-04-26 11:20', type: 'Credit', category: 'Phí phạt hủy', amount: 1500000, status: 'Completed', room: 'Standard Room' },
    { id: 'TXN-005', date: '2026-04-25 08:00', type: 'Debit', category: 'Hoàn tiền', amount: 2000000, status: 'Completed', room: 'Ocean View Villa' },
];

const pieData = [
    { name: 'Thanh toán', value: 65, color: '#10b981' }, // emerald-500
    { name: 'Đặt cọc', value: 20, color: '#f59e0b' },   // amber-500
    { name: 'Phí phạt', value: 5, color: '#3b82f6' },   // blue-500
    { name: 'Hoàn tiền', value: 10, color: '#ef4444' },  // red-500
];

const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
};

const StatusBadge = ({ status }) => {
    switch (status) {
        case 'Completed':
            return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"><CheckCircle2 className="w-3.5 h-3.5" /> Thành công</span>;
        case 'Processing':
            return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20"><Clock className="w-3.5 h-3.5" /> Đang xử lý</span>;
        case 'Failed':
            return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20"><XCircle className="w-3.5 h-3.5" /> Thất bại</span>;
        default:
            return null;
    }
};

const TypeBadge = ({ type }) => {
    const isCredit = type === 'Credit';
    return (
        <span className={`inline-flex items-center gap-1 text-sm font-semibold ${isCredit ? 'text-emerald-400' : 'text-red-400'}`}>
            {isCredit ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
            {type}
        </span>
    );
};


const AdminFinancialLedger = () => {
    const [filterType, setFilterType] = useState('All');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const filteredTransactions = useMemo(() => {
        return transactionData.filter(t => {
            const matchesType = filterType === 'All' || t.type === filterType;
            const matchesSearch = !searchTerm || 
                t.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                t.room.toLowerCase().includes(searchTerm.toLowerCase());
            
            let matchesDate = true;
            if (startDate || endDate) {
                // Dummy data date is "2026-04-27 10:30" format
                const txDateStr = t.date.split(' ')[0]; // "2026-04-27"
                if (startDate && txDateStr < startDate) matchesDate = false;
                if (endDate && txDateStr > endDate) matchesDate = false;
            }

            return matchesType && matchesSearch && matchesDate;
        });
    }, [filterType, searchTerm, startDate, endDate]);

    return (
        <div className="space-y-6">


            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Visual Summary: Donut Chart */}
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6 flex flex-col">
                    <h2 className="text-lg font-semibold text-white mb-2">Cấu trúc Dòng tiền</h2>
                    <p className="text-sm text-slate-400 mb-6">Thống kê phân bổ theo loại giao dịch.</p>

                    <div className="flex-1 relative" style={{ minHeight: '250px', minWidth: 0 }}>
                        <ResponsiveContainer width="99%" height="100%" debounce={50}>
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={90}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Center Text */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-2xl font-bold text-white">450M</span>
                            <span className="text-xs text-slate-400">Tổng Giao dịch</span>
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="grid grid-cols-2 gap-3 mt-4">
                        {pieData.map((item) => (
                            <div key={item.name} className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }}></div>
                                <span className="text-xs font-medium text-slate-300">{item.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Ledger Table */}
                <div className="lg:col-span-2 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6 flex flex-col">

                    {/* Filters & Search Row 1 */}
                    <div className="flex flex-col xl:flex-row items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-lg p-1 w-full xl:w-auto">
                            {['All', 'Credit', 'Debit'].map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setFilterType(type)}
                                    className={`flex-1 xl:flex-none px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${filterType === type
                                        ? 'bg-amber-500 text-white shadow'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                        }`}
                                >
                                    {type === 'All' ? 'Tất cả' : type}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-3 w-full xl:w-auto">
                            <div className="relative flex-1 xl:w-64">
                                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Tìm mã GD, loại phòng..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 focus:border-amber-500 outline-none transition-colors"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Date Range Row 2 */}
                    <div className="flex flex-wrap items-center gap-4 mb-8 p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
                        <div className="flex items-center gap-2 text-slate-400">
                            <Calendar className="w-4 h-4" />
                            <span className="text-sm font-medium">Khoảng ngày:</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:border-amber-500 outline-none"
                            />
                            <span className="text-slate-600">to</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:border-amber-500 outline-none"
                            />
                        </div>
                        <button
                            onClick={() => { setStartDate(''); setEndDate(''); }}
                            className="text-xs text-amber-500 hover:text-amber-400 font-medium"
                        >
                            Xóa lọc ngày
                        </button>
                    </div>

                    {/* Table */}
                    <div className="flex-1 overflow-x-auto rounded-lg border border-slate-700/50">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-900/80 border-b border-slate-700">
                                    <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Mã GD & Thời gian</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Phân loại</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Số tiền</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/50">
                                {filteredTransactions.map((txn) => (
                                    <tr key={txn.id} className="hover:bg-slate-700/20 transition-colors">
                                        <td className="px-4 py-4">
                                            <div className="text-sm font-semibold text-white">{txn.id}</div>
                                            <div className="text-xs text-slate-400 mt-0.5">{txn.date}</div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="text-sm font-medium text-slate-200">{txn.category}</div>
                                            <div className="text-xs text-slate-500 mt-0.5">{txn.room}</div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <TypeBadge type={txn.type} />
                                            <div className="text-sm font-bold text-white mt-1">{formatCurrency(txn.amount)}</div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <StatusBadge status={txn.status} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredTransactions.length === 0 && (
                            <div className="p-8 text-center text-slate-400 text-sm">
                                Không tìm thấy giao dịch nào.
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default AdminFinancialLedger;
