import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Calendar as CalendarIcon, BarChart2, Hotel, Loader2 } from 'lucide-react';

import {
    ComposedChart,
    Bar,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';
import { fetchAllReviews, fetchHotels, fetchQuarterlyRefundRatio } from '../../lib/adminApiService';

const currentYear = new Date().getFullYear();
const quarterLabels = ['Q1', 'Q2', 'Q3', 'Q4'];
const monthLabels = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];

const normalizeHotelId = (value) => {
    if (!value) return '';
    if (typeof value === 'object') {
        return String(value?._id || value?.id || value?.SqlHotelId || '');
    }
    return String(value);
};

const getHotelId = (hotel) => hotel?.SqlHotelId || hotel?.id || hotel?._id || '';

const getHotelLabel = (hotel) => hotel?.Name || hotel?.HotelName || hotel?.name || getHotelId(hotel) || 'Khách sạn';

const formatCurrency = (value) => {
    const number = Number(value) || 0;
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(number);
};

const AdminAnalytics = () => {
    const [selectedHotelId, setSelectedHotelId] = useState('ALL');
    const [hotels, setHotels] = useState([]);
    const [refundRiskData, setRefundRiskData] = useState([]);
    const [ratingTrendData, setRatingTrendData] = useState([]);
    const [loadingHotels, setLoadingHotels] = useState(false);
    const [loadingReports, setLoadingReports] = useState(false);

    const selectedHotelLabel = useMemo(() => {
        if (selectedHotelId === 'ALL') {
            return 'Tất cả khách sạn';
        }

        const hotel = hotels.find((item) => getHotelId(item) === selectedHotelId);
        return hotel ? getHotelLabel(hotel) : selectedHotelId;
    }, [hotels, selectedHotelId]);

    const loadHotels = useCallback(async () => {
        setLoadingHotels(true);
        try {
            const hotelData = await fetchHotels();
            if (Array.isArray(hotelData)) {
                setHotels(hotelData);
            }
        } finally {
            setLoadingHotels(false);
        }
    }, []);

    const loadAnalyticsData = useCallback(async () => {
        setLoadingReports(true);
        try {
            const [q1, q2, q3, q4, reviewsResult] = await Promise.allSettled([
                fetchQuarterlyRefundRatio(currentYear, 1),
                fetchQuarterlyRefundRatio(currentYear, 2),
                fetchQuarterlyRefundRatio(currentYear, 3),
                fetchQuarterlyRefundRatio(currentYear, 4),
                fetchAllReviews(),
            ]);

            const quarterlyResults = [q1, q2, q3, q4].map((result) => (result.status === 'fulfilled' && Array.isArray(result.value) ? result.value : []));

            const nextRefundRiskData = quarterlyResults.map((rows, index) => {
                const relevantRows = selectedHotelId === 'ALL'
                    ? rows
                    : rows.filter((row) => normalizeHotelId(row?.HotelId) === selectedHotelId);

                const totals = relevantRows.reduce((accumulator, row) => {
                    accumulator.revenue += Number(row?.TotalRevenueIn) || 0;
                    accumulator.refund += Number(row?.TotalRefundPayout) || 0;
                    return accumulator;
                }, { revenue: 0, refund: 0 });

                const refundRatio = totals.revenue > 0 ? Number(((totals.refund * 100) / totals.revenue).toFixed(2)) : 0;

                return {
                    name: quarterLabels[index],
                    revenue: totals.revenue,
                    refund: totals.refund,
                    ratio: refundRatio,
                };
            });

            setRefundRiskData(nextRefundRiskData);

            if (reviewsResult.status === 'fulfilled' && Array.isArray(reviewsResult.value)) {
                const buckets = monthLabels.map((label) => ({ name: label, totalRating: 0, count: 0 }));

                reviewsResult.value.forEach((review) => {
                    const reviewHotelId = normalizeHotelId(review?.HotelId);
                    if (selectedHotelId !== 'ALL' && reviewHotelId !== selectedHotelId) {
                        return;
                    }

                    const reviewDate = new Date(review?.CreatedAt || review?.createdAt || review?.created_at);
                    if (Number.isNaN(reviewDate.getTime()) || reviewDate.getFullYear() !== currentYear) {
                        return;
                    }

                    const monthIndex = reviewDate.getMonth();
                    const rating = Number(review?.Rating);
                    if (!Number.isFinite(rating)) {
                        return;
                    }

                    buckets[monthIndex].totalRating += rating;
                    buckets[monthIndex].count += 1;
                });

                setRatingTrendData(buckets.map((bucket) => ({
                    name: bucket.name,
                    rating: bucket.count > 0 ? Number((bucket.totalRating / bucket.count).toFixed(2)) : null,
                })));
            }
        } finally {
            setLoadingReports(false);
        }
    }, [selectedHotelId]);

    useEffect(() => {
        loadHotels();
    }, [loadHotels]);

    useEffect(() => {
        loadAnalyticsData();
    }, [loadAnalyticsData]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <p className="text-sm text-slate-400">Bộ lọc báo cáo theo khách sạn</p>
                    <h1 className="text-2xl font-semibold text-white mt-1">{selectedHotelLabel}</h1>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                    <div className="relative w-full sm:w-72">
                        <Hotel className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <select
                            value={selectedHotelId}
                            onChange={(e) => setSelectedHotelId(e.target.value)}
                            disabled={loadingHotels}
                            className="appearance-none bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg pl-9 pr-3 py-2.5 focus:outline-none focus:border-amber-500 transition-colors w-full disabled:opacity-60"
                        >
                            <option value="ALL">Tất cả khách sạn</option>
                            {hotels.map((hotel, index) => {
                                const hotelId = getHotelId(hotel) || `hotel-${index}`;
                                return (
                                    <option key={hotelId} value={hotelId}>
                                        {getHotelLabel(hotel)}
                                    </option>
                                );
                            })}
                        </select>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-400 px-3 py-2.5 rounded-lg border border-slate-700 bg-slate-900">
                        <CalendarIcon className="w-3.5 h-3.5" />
                        <span>Năm {currentYear}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="lg:col-span-2 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <BarChart2 className="w-5 h-5 text-amber-500" />
                        <h2 className="text-lg font-semibold text-white">Doanh thu và Hoàn tiền theo Quý</h2>
                    </div>
                    <div className="h-[350px] w-full" style={{ minHeight: 0, minWidth: 0 }}>
                        {loadingReports ? (
                            <div className="h-full flex items-center justify-center">
                                <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                            </div>
                        ) : (
                            <ResponsiveContainer width="99%" height="100%" debounce={50}>
                                <ComposedChart data={refundRiskData} margin={{ top: 20, right: 30, left: -10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis yAxisId="left" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${Math.round(Number(value) / 1000000)}M`} />
                                    <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} domain={[0, 100]} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem' }}
                                        itemStyle={{ color: '#fff' }}
                                        formatter={(value, name) => {
                                            if (name === 'Tỷ lệ hoàn tiền') {
                                                return [`${Number(value || 0).toFixed(2)}%`, name];
                                            }

                                            return [formatCurrency(value), name];
                                        }}
                                    />
                                    <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
                                    <Bar yAxisId="left" dataKey="revenue" name="Doanh thu" fill="#10b981" radius={[4, 4, 0, 0]} />
                                    <Bar yAxisId="left" dataKey="refund" name="Hoàn tiền" fill="#ef4444" radius={[4, 4, 0, 0]} />
                                    <Line yAxisId="right" type="monotone" dataKey="ratio" name="Tỷ lệ hoàn tiền" stroke="#f59e0b" strokeWidth={3} dot={{ fill: '#0f172a', stroke: '#f59e0b', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                <div className="lg:col-span-2 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <BarChart2 className="w-5 h-5 text-amber-500" />
                        <h2 className="text-lg font-semibold text-white">Xu hướng Đánh giá Trung bình theo Tháng</h2>
                    </div>
                    <div className="h-[300px] w-full" style={{ minHeight: 0, minWidth: 0 }}>
                        {loadingReports ? (
                            <div className="h-full flex items-center justify-center">
                                <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                            </div>
                        ) : (
                            <ResponsiveContainer width="99%" height="100%" debounce={50}>
                                <LineChart data={ratingTrendData} margin={{ top: 20, right: 30, left: -20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis domain={[0, 5]} stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem' }}
                                        itemStyle={{ color: '#f59e0b' }}
                                        formatter={(value) => [`${Number(value || 0).toFixed(2)}/5`, 'Đánh giá']}
                                    />
                                    <Line type="monotone" dataKey="rating" name="Đánh giá" stroke="#f59e0b" strokeWidth={3} dot={{ fill: '#0f172a', stroke: '#f59e0b', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} connectNulls />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AdminAnalytics;
