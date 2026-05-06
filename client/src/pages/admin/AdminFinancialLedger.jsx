import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Filter, Download, Search, CheckCircle2, XCircle, ArrowUpRight, ArrowDownLeft, Clock, Calendar, Loader2 } from 'lucide-react';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

import { fetchFinancialLedger } from '../../lib/adminApiService';

// Dummy Data (fallback khi API chưa sẵn sàng)
const DUMMY_TRANSACTIONS = [
    { id: 'TXN-001', date: '2026-04-27 10:30', type: 'Credit', category: 'Thanh toán toàn bộ', amount: 15000000, status: 'Completed', room: 'Presidential Suite' },
    { id: 'TXN-002', date: '2026-04-27 09:15', type: 'Credit', category: 'Đặt cọc', amount: 3000000, status: 'Completed', room: 'Ocean View Villa' },
    { id: 'TXN-003', date: '2026-04-26 15:45', type: 'Debit', category: 'Hoàn tiền', amount: 5000000, status: 'Processing', room: 'Deluxe Double' },
    { id: 'TXN-004', date: '2026-04-26 11:20', type: 'Credit', category: 'Phí phạt hủy', amount: 1500000, status: 'Completed', room: 'Standard Room' },
    { id: 'TXN-005', date: '2026-04-25 08:00', type: 'Debit', category: 'Hoàn tiền', amount: 2000000, status: 'Completed', room: 'Ocean View Villa' },
];

const CATEGORY_MAP = {
    'Deposit': { display: 'Đặt cọc', color: '#f59e0b' },
    'FinalPayment': { display: 'Thanh toán', color: '#10b981' },
    'FullPayment': { display: 'Thanh toán', color: '#10b981' },
    'PenaltyRevenue': { display: 'Phí phạt', color: '#3b82f6' },
    'RefundPayout': { display: 'Hoàn tiền', color: '#ef4444' },
};

const formatCurrency = (value) => {
    const num = Number(value);
    if (isNaN(num)) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
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
    const [transactions, setTransactions] = useState(DUMMY_TRANSACTIONS);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const loadLedger = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page, pageSize: 10 };
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;
            if (filterType !== 'All') params.type = filterType;

            const result = await fetchFinancialLedger(params);
            if (result.totalPages) setTotalPages(result.totalPages);
            
            const data = result.data ?? result.transactions ?? result;
            
            if (Array.isArray(data) && data.length > 0) {
                // Ánh xạ dữ liệu từ API (DebitAmount/CreditAmount) sang format của UI (amount/type)
                const mappedData = data.map(item => {
                    // Format date
                    const dateObj = new Date(item.Date);
                    const formattedDate = !isNaN(dateObj) 
                        ? new Intl.DateTimeFormat('vi-VN', { 
                            day: '2-digit', month: '2-digit', year: 'numeric', 
                            hour: '2-digit', minute: '2-digit' 
                          }).format(dateObj)
                        : item.Date;

                    return {
                        id: item.LedgerId || item.ReferenceId || 'N/A',
                        date: formattedDate,
                        rawDate: item.Date,
                        type: Number(item.CreditAmount) > 0 ? 'Credit' : 'Debit',
                        category: item.EventType || 'Giao dịch',
                        amount: Number(item.CreditAmount) > 0 ? item.CreditAmount : item.DebitAmount,
                        status: 'Completed', // Ledger thường là giao dịch đã hoàn tất
                        room: item.ReferenceId ? `Mã TC: ${item.ReferenceId}` : ''
                    };
                });
                setTransactions(mappedData);
            }
        } catch {
            // Interceptor already fired toast; keep current data
        } finally {
            setLoading(false);
        }
    }, [startDate, endDate, filterType, page]);

    useEffect(() => {
        loadLedger();
    }, [loadLedger]);

    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            const matchesType = filterType === 'All' || t.type === filterType;
            const matchesSearch = !searchTerm ||
                t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.room.toLowerCase().includes(searchTerm.toLowerCase());

            let matchesDate = true;
            if (startDate || endDate) {
                // Sử dụng rawDate (ISO string) để so sánh chuỗi (YYYY-MM-DD) chuẩn xác hơn
                const txDateStr = t.rawDate ? t.rawDate.split('T')[0] : t.date.split(' ')[0];
                if (startDate && txDateStr < startDate) matchesDate = false;
                if (endDate && txDateStr > endDate) matchesDate = false;
            }

            return matchesType && matchesSearch && matchesDate;
        });
    }, [transactions, filterType, searchTerm, startDate, endDate]);

    const dynamicPieData = useMemo(() => {
        const categoryTotals = {};
        transactions.forEach(t => {
            const categoryInfo = CATEGORY_MAP[t.category];
            if (categoryInfo) {
                const key = categoryInfo.display;
                if (!categoryTotals[key]) {
                    categoryTotals[key] = { amount: 0, color: categoryInfo.color };
                }
                categoryTotals[key].amount += Number(t.amount) || 0;
            }
        });

        const total = Object.values(categoryTotals).reduce((sum, cat) => sum + cat.amount, 0);
        const pieData = Object.entries(categoryTotals).map(([name, data]) => ({
            name,
            value: total > 0 ? Math.round((data.amount / total) * 100) : 0,
            color: data.color,
            amount: data.amount
        }));
        
        return { pieData, total };
    }, [transactions]);

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
                                    data={dynamicPieData.pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={90}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {dynamicPieData.pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem' }}
                                    itemStyle={{ color: '#fff' }}
                                    formatter={(value, name, props) => {
                                        const amount = props.payload.amount;
                                        return [formatCurrency(amount), props.payload.name];
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Center Text */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-2xl font-bold text-white">{dynamicPieData.total > 0 ? (dynamicPieData.total / 1000000).toFixed(0) + 'M' : '0'}</span>
                            <span className="text-xs text-slate-400">Tổng Giao dịch</span>
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="grid grid-cols-2 gap-3 mt-4">
                        {dynamicPieData.pieData.map((item) => (
                            <div key={item.name} className="flex items-center gap-2">
                                <div className="shrink-0" style={{ width: 12, height: 12, borderRadius: '9999px', backgroundColor: item.color }} />
                                <span className="text-xs font-medium text-slate-300">{item.name} ({item.value}%)</span>
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
                                    onClick={() => { setFilterType(type); setPage(1); }}
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
                                onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:border-amber-500 outline-none"
                            />
                            <span className="text-slate-600">to</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:border-amber-500 outline-none"
                            />
                        </div>
                        <button
                            onClick={() => { setStartDate(''); setEndDate(''); setPage(1); }}
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
                            <tbody className="divide-y divide-slate-700/50 relative">
                                {loading ? (
                                    <tr>
                                        <td colSpan="4" className="py-20 text-center">
                                            <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
                                        </td>
                                    </tr>
                                ) : (
                                    filteredTransactions.map((txn) => (
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
                                    ))
                                )}
                            </tbody>
                        </table>
                        {filteredTransactions.length === 0 && (
                            <div className="p-8 text-center text-slate-400 text-sm">
                                Không tìm thấy giao dịch nào.
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-6 px-2">
                            <span className="text-sm text-slate-400">Trang {page} / {totalPages}</span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="px-3 py-1.5 text-sm font-medium text-slate-300 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Trang trước
                                </button>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="px-3 py-1.5 text-sm font-medium text-slate-300 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Trang sau
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default AdminFinancialLedger;
