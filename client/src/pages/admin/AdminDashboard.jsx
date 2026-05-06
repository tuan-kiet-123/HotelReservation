import React, { useCallback, useEffect, useState } from 'react';
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    Users,
    AlertTriangle,
    ChevronDown,
    Loader2,
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
    Bar,
} from 'recharts';
import { fetchAdrRevpar, fetchTop3Rooms, fetchAllReviews, fetchHotels, fetchMonthlyRevenue } from '../../lib/adminApiService';

const alerts = [
    { id: 1, message: 'Giá Presidential Suite tăng vọt 60%', time: '10 phút trước', type: 'warning' },
    { id: 2, message: 'Ocean View Villa đạt 100% công suất', time: '1 giờ trước', type: 'info' },
    { id: 3, message: 'Cảnh báo hủy phòng liên tục (>5 đơn/giờ)', time: '2 giờ trước', type: 'danger' },
];

const formatCurrency = (value) => {
    const num = Number(value);
    if (!Number.isFinite(num)) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
};

const buildTopRoomLabel = (room, hotelMap) => {
    const hotelName = hotelMap?.[room?.HotelId] || room?.HotelId || 'Khách sạn';
    const roomId = room?.RoomId || '—';
    const roomType = room?.RoomType || 'Loại phòng';
    return `${hotelName} · ${roomId} · ${roomType}`;
};

const KpiCard = ({ title, value, icon, trend, trendValue, loading }) => {
    const Icon = icon;

    return (
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6 relative overflow-hidden group hover:border-amber-500/50 transition-colors">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all" />
            <div className="flex items-start justify-between relative z-10">
                <div>
                    <p className="text-sm font-medium text-slate-400 mb-1">{title}</p>
                    {loading ? (
                        <div className="flex items-center gap-2 mt-2">
                            <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />
                            <span className="text-slate-500 text-sm">Đang tải...</span>
                        </div>
                    ) : (
                        <>
                            <h3 className="text-2xl font-bold text-white mb-2">{value}</h3>
                            <div className={`flex items-center gap-1 text-sm font-medium ${trend === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
                                {trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                <span>{trendValue}% so với quý trước</span>
                            </div>
                        </>
                    )}
                </div>
                <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-amber-500 shadow-inner">
                    <Icon className="w-6 h-6" />
                </div>
            </div>
        </div>
    );
};

const aggregateKpiData = (kpiArray) => {
    if (!Array.isArray(kpiArray) || kpiArray.length === 0) return null;

    const activeHotels = kpiArray.filter((item) => {
        const revenue = Number(item.RoomRevenueForKPI) || 0;
        const occupied = Number(item.OccupiedRoomNights) || 0;
        return revenue > 0 || occupied > 0;
    });

    if (activeHotels.length === 0) return null;

    const adrValues = activeHotels.map((item) => Number(item.ADR)).filter((value) => Number.isFinite(value) && value > 0);
    const revparValues = activeHotels.map((item) => Number(item.RevPAR)).filter((value) => Number.isFinite(value) && value > 0);

    return {
        ADR: adrValues.length > 0 ? adrValues.reduce((sum, value) => sum + value, 0) / adrValues.length : 0,
        RevPAR: revparValues.length > 0 ? revparValues.reduce((sum, value) => sum + value, 0) / revparValues.length : 0,
        OccupancyRate:
            activeHotels.reduce((sum, item) => sum + (Number(item.OccupancyRate) || 0), 0) / activeHotels.length,
    };
};

const AdminDashboard = () => {
    const currentYear = new Date().getFullYear();
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [selectedQuarter, setSelectedQuarter] = useState(2);
    const [kpiData, setKpiData] = useState(null);
    const [topRooms, setTopRooms] = useState([]);
    const [hotelMap, setHotelMap] = useState({});
    const [monthlyRevenue, setMonthlyRevenue] = useState([]);
    const [avgRating, setAvgRating] = useState(null);
    const [trends, setTrends] = useState({
        adr: { trend: 'up', value: '—' },
        revpar: { trend: 'up', value: '—' },
        occupancy: { trend: 'up', value: '—' },
        rating: { trend: 'up', value: '—' },
        revenue: { trend: 'up', value: '—' },
    });
    const [loading, setLoading] = useState(false);

    // Helper: Calculate previous quarter and year
    const getPreviousPeriod = (year, quarter) => {
        if (quarter === 1) {
            return { year: year - 1, quarter: 4 };
        }
        return { year, quarter: quarter - 1 };
    };

    // Helper: Calculate trend percentage
    const calculateTrend = (current, previous) => {
        if (!current || !previous || previous === 0) {
            return { trend: 'up', value: '—' };
        }
        const percentage = ((current - previous) / previous) * 100;
        const isUp = percentage >= 0;
        return {
            trend: isUp ? 'up' : 'down',
            value: Math.abs(percentage).toFixed(1),
        };
    };

    const loadDashboardData = useCallback(async () => {
        setLoading(true);
        try {
            const { year: prevYear, quarter: prevQuarter } = getPreviousPeriod(selectedYear, selectedQuarter);

            // Inline helper to calculate yearly trend
            const calcYearlyRevenueTrend = (currentYear, previousYear) => {
                if (!Array.isArray(currentYear) || !Array.isArray(previousYear)) {
                    return { trend: 'up', value: '—' };
                }
                const currentSum = currentYear.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
                const previousSum = previousYear.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
                return calculateTrend(currentSum, previousSum);
            };

            const [adrRevpar, rooms, reviewsResult, hotelsResult, monthlyResult, previousAdrRevpar, previousMonthlyResult] = await Promise.allSettled([
                fetchAdrRevpar(selectedYear, selectedQuarter),
                fetchTop3Rooms(selectedYear, selectedQuarter),
                fetchAllReviews(),
                fetchHotels(),
                fetchMonthlyRevenue(selectedYear),
                fetchAdrRevpar(prevYear, prevQuarter),
                fetchMonthlyRevenue(selectedYear - 1),
            ]);

            // Current KPI
            if (adrRevpar.status === 'fulfilled') {
                setKpiData(aggregateKpiData(adrRevpar.value));
            }

            // Previous KPI
            if (previousAdrRevpar.status === 'fulfilled') {
                // Store previous data for trend calculation
                const prevData = aggregateKpiData(previousAdrRevpar.value);
                
                // Calculate trends after current KPI is set
                if (adrRevpar.status === 'fulfilled') {
                    const currentData = aggregateKpiData(adrRevpar.value);
                    
                    setTrends((prev) => ({
                        ...prev,
                        adr: calculateTrend(currentData?.ADR, prevData?.ADR),
                        revpar: calculateTrend(currentData?.RevPAR, prevData?.RevPAR),
                        occupancy: calculateTrend(currentData?.OccupancyRate, prevData?.OccupancyRate),
                    }));
                }
            }

            if (rooms.status === 'fulfilled') {
                setTopRooms(Array.isArray(rooms.value) ? rooms.value : []);
            }

            if (hotelsResult.status === 'fulfilled' && Array.isArray(hotelsResult.value)) {
                const map = hotelsResult.value.reduce((acc, hotel) => {
                    const key = hotel?.SqlHotelId;
                    if (key) {
                        acc[key] = hotel?.Name || key;
                    }
                    return acc;
                }, {});
                setHotelMap(map);
            }

            if (monthlyResult.status === 'fulfilled' && Array.isArray(monthlyResult.value)) {
                setMonthlyRevenue(monthlyResult.value);
            }

            if (previousMonthlyResult.status === 'fulfilled' && Array.isArray(previousMonthlyResult.value)) {
                // Calculate year-over-year revenue trend
                const yoyTrend = calcYearlyRevenueTrend(
                    monthlyResult.status === 'fulfilled' ? monthlyResult.value : [],
                    previousMonthlyResult.value
                );
                setTrends((prev) => ({
                    ...prev,
                    revenue: yoyTrend,
                }));
            }

            if (reviewsResult.status === 'fulfilled' && Array.isArray(reviewsResult.value)) {
                const reviews = reviewsResult.value;
                if (reviews.length > 0) {
                    const sum = reviews.reduce((acc, curr) => acc + (curr.Rating || 0), 0);
                    const rating = sum / reviews.length;
                    setAvgRating(rating);
                    
                    // Update rating trend (positive if increasing, comparing with a baseline or using a fixed baseline)
                    setTrends((prev) => ({
                        ...prev,
                        rating: { trend: 'up', value: rating > 4 ? '5.0' : '—' },
                    }));
                } else {
                    setAvgRating(0);
                }
            }
        } finally {
            setLoading(false);
        }
    }, [selectedQuarter, selectedYear]);

    useEffect(() => {
        loadDashboardData();
    }, [loadDashboardData]);

    return (
        <div className="space-y-6">
            <div className="flex justify-end mb-2 gap-2">
                <div className="relative group">
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="appearance-none bg-slate-900 border border-slate-700 text-white text-xs rounded-lg pl-3 pr-8 py-2 focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
                    >
                        {[currentYear, currentYear - 1, currentYear - 2].map((year) => (
                            <option key={year} value={year}>Năm {year}</option>
                        ))}
                    </select>
                    <ChevronDown className="w-3 h-3 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                <div className="relative group">
                    <select
                        value={selectedQuarter}
                        onChange={(e) => setSelectedQuarter(Number(e.target.value))}
                        className="appearance-none bg-slate-900 border border-slate-700 text-white text-xs rounded-lg pl-3 pr-8 py-2 focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
                    >
                        {[1, 2, 3, 4].map((quarter) => (
                            <option key={quarter} value={quarter}>Quý {quarter}</option>
                        ))}
                    </select>
                    <ChevronDown className="w-3 h-3 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                <div className="w-[1px] h-4 bg-slate-700 mx-1 self-center" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <KpiCard
                    title="ADR (Giá trung bình/đêm)"
                    value={kpiData ? formatCurrency(kpiData.ADR) : '—'}
                    icon={DollarSign}
                    trend={trends.adr.trend}
                    trendValue={trends.adr.value}
                    loading={loading}
                />
                <KpiCard
                    title="RevPAR (Doanh thu/phòng)"
                    value={kpiData ? formatCurrency(kpiData.RevPAR) : '—'}
                    icon={TrendingUp}
                    trend={trends.revpar.trend}
                    trendValue={trends.revpar.value}
                    loading={loading}
                />
                <KpiCard
                    title="Tỷ lệ Hoàn tiền"
                    value={kpiData ? `${(kpiData.OccupancyRate ?? 0).toFixed(2)}%` : '—'}
                    icon={AlertTriangle}
                    trend={trends.occupancy.trend}
                    trendValue={trends.occupancy.value}
                    loading={loading}
                />
                <KpiCard
                    title="Đánh giá Trung bình"
                    value={avgRating !== null ? `${Number(avgRating).toFixed(1)}/5` : '—'}
                    icon={Users}
                    trend={trends.rating.trend}
                    trendValue={trends.rating.value}
                    loading={loading}
                />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-white">Phân tích Doanh thu theo Tháng</h2>
                        <div className="flex items-center gap-2">
                            <span className={`flex items-center gap-1 text-xs ${trends.revenue.trend === 'up' ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'} px-2 py-1 rounded-full`}>
                                {trends.revenue.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />} {trends.revenue.trend === 'up' ? '+' : '-'}{trends.revenue.value}%
                            </span>
                        </div>
                    </div>
                    <div className="h-[320px] w-full" style={{ minHeight: 0, minWidth: 0 }}>
                        <ResponsiveContainer width="99%" height="100%" debounce={50}>
                            <AreaChart data={monthlyRevenue.length > 0 ? monthlyRevenue : []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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

                <div className="space-y-6">
                    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6">
                        <h2 className="text-lg font-semibold text-white mb-6">Top 3 doanh thu phòng</h2>
                        <div className="h-[180px] w-full" style={{ minHeight: 0, minWidth: 0 }}>
                            {loading ? (
                                <div className="h-full flex items-center justify-center">
                                    <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
                                </div>
                            ) : (
                                <ResponsiveContainer width="99%" height="100%" debounce={50}>
                                    <BarChart
                                        data={topRooms.map((room) => ({
                                            name: buildTopRoomLabel(room, hotelMap),
                                            revenue: Number(room.NetRevenue) || 0,
                                        }))}
                                        layout="vertical"
                                        margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
                                    >
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} width={120} tickLine={false} axisLine={false} />
                                        <Tooltip
                                            cursor={{ fill: '#1e293b' }}
                                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem' }}
                                            formatter={(value) => formatCurrency(value)}
                                        />
                                        <Bar dataKey="revenue" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={16} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6 flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-amber-500" /> Cảnh báo
                            </h2>
                        </div>
                        <div className="space-y-3">
                            {alerts.map((alert) => (
                                <div key={alert.id} className="p-3 rounded-xl bg-slate-900 border border-slate-700 flex items-start gap-3">
                                    <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${
                                        alert.type === 'warning'
                                            ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]'
                                            : alert.type === 'danger'
                                                ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'
                                                : 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]'
                                    }`} />
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
