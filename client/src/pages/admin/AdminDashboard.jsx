import React from 'react';
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    Users,
    Key,
    Percent,
    AlertTriangle,
    ArrowUpRight,
    CalendarCheck,
    ChevronDown,
    Filter
} from 'lucide-react';

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar
} from 'recharts';


// Dummy Data for Monthly Trend (Can be derived from Financial Ledger)
const monthlyRevenueData = [
    { name: 'Th.1', total: 450000000 },
    { name: 'Th.2', total: 520000000 },
    { name: 'Th.3', total: 480000000 },
    { name: 'Th.4', total: 610000000 },
    { name: 'Th.5', total: 550000000 },
    { name: 'Th.6', total: 670000000 },
    { name: 'Th.7', total: 820000000 },
    { name: 'Th.8', total: 790000000 },
    { name: 'Th.9', total: 620000000 },
    { name: 'Th.10', total: 580000000 },
    { name: 'Th.11', total: 510000000 },
    { name: 'Th.12', total: 750000000 },
];

const topRoomsData = [
    { name: 'Presidential Suite', revenue: 120000000 },
    { name: 'Ocean View Villa', revenue: 95000000 },
    { name: 'Deluxe Double', revenue: 64000000 },
];

const alerts = [
    { id: 1, message: 'Giá Presidential Suite tăng vọt 60%', time: '10 phút trước', type: 'warning' },
    { id: 2, message: 'Ocean View Villa đạt 100% công suất', time: '1 giờ trước', type: 'info' },
    { id: 3, message: 'Cảnh báo hủy phòng liên tục (>5 đơn/giờ)', time: '2 giờ trước', type: 'danger' },
];

const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
};

const KpiCard = ({ title, value, icon, trend, trendValue }) => {
    const Icon = icon;
    return (
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6 relative overflow-hidden group hover:border-amber-500/50 transition-colors">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all"></div>
            <div className="flex items-start justify-between relative z-10">
                <div>
                    <p className="text-sm font-medium text-slate-400 mb-1">{title}</p>
                    <h3 className="text-2xl font-bold text-white mb-2">{value}</h3>
                    <div className={`flex items-center gap-1 text-sm font-medium ${trend === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        <span>{trendValue}% so với quý trước</span>
                    </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-amber-500 shadow-inner">
                    <Icon className="w-6 h-6" />
                </div>
            </div>
        </div>
    );
};



const AdminDashboard = () => {
    return (
        <div className="space-y-6">
            <div className="flex justify-end mb-2">
                {/* Year Selector */}
                <div className="relative group">
                    <select className="appearance-none bg-slate-900 border border-slate-700 text-white text-xs rounded-lg pl-3 pr-8 py-2 focus:outline-none focus:border-amber-500 transition-colors cursor-pointer">
                        <option>Năm 2026</option>
                        <option>Năm 2025</option>
                        <option>Năm 2024</option>
                    </select>
                    <ChevronDown className="w-3 h-3 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-amber-500 transition-colors" />
                </div>

                {/* Quarter Selector */}
                <div className="relative group">
                    <select className="appearance-none bg-slate-900 border border-slate-700 text-white text-xs rounded-lg pl-3 pr-8 py-2 focus:outline-none focus:border-amber-500 transition-colors cursor-pointer">
                        <option>Quý 1</option>
                        <option>Quý 2</option>
                        <option>Quý 3</option>
                        <option>Quý 4</option>
                    </select>
                    <ChevronDown className="w-3 h-3 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-amber-500 transition-colors" />
                </div>

                <div className="w-[1px] h-4 bg-slate-700 mx-1"></div>

            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <KpiCard title="ADR (Giá trung bình/đêm)" value="2.450.000 ₫" icon={DollarSign} trend="up" trendValue="5.2" />
                <KpiCard title="RevPAR (Doanh thu/phòng)" value="1.850.000 ₫" icon={TrendingUp} trend="up" trendValue="8.4" />
                <KpiCard title="Tỷ lệ Hoàn tiền" value="4.2%" icon={AlertTriangle} trend="down" trendValue="1.5" />
                <KpiCard title="Đánh giá Trung bình" value="4.8/5" icon={Users} trend="up" trendValue="0.2" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* Monthly Revenue Trend Chart */}
                <div className="xl:col-span-2 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-white">Phân tích Doanh thu theo Tháng</h2>
                        <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">
                                <TrendingUp className="w-3 h-3" /> +15.8%
                            </span>
                        </div>
                    </div>
                    <div className="h-[320px] w-full" style={{ minHeight: 0, minWidth: 0 }}>
                        <ResponsiveContainer width="99%" height="100%" debounce={50}>
                            <AreaChart data={monthlyRevenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} />
                                <YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `${value / 1000000}M`} />
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', color: '#fff' }}
                                    itemStyle={{ color: '#f59e0b' }}
                                    formatter={(value) => formatCurrency(value)}
                                />
                                <Area type="monotone" dataKey="total" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Right Column: Top Rooms & Alerts */}
                <div className="space-y-6">
                    {/* Top Rooms Summary */}
                    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6">
                        <h2 className="text-lg font-semibold text-white mb-6">Top 3 doanh thu phòng</h2>
                        <div className="h-[180px] w-full" style={{ minHeight: 0, minWidth: 0 }}>
                            <ResponsiveContainer width="99%" height="100%" debounce={50}>
                                <BarChart data={topRoomsData} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} width={100} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        cursor={{ fill: '#1e293b' }}
                                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem' }}
                                        formatter={(value) => formatCurrency(value)}
                                    />
                                    <Bar dataKey="revenue" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={16} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Alerts Widget */}
                    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6 flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-amber-500" /> Cảnh báo
                            </h2>
                        </div>
                        <div className="space-y-3">
                            {alerts.map((alert) => (
                                <div key={alert.id} className="p-3 rounded-xl bg-slate-900 border border-slate-700 flex items-start gap-3">
                                    <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${alert.type === 'warning' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]' :
                                        alert.type === 'danger' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' :
                                            'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]'
                                        }`}></div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-200 leading-tight">{alert.message}</p>
                                        <p className="text-[10px] text-slate-500 mt-1">{alert.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AdminDashboard;
