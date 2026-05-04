import React from 'react';
import { Calendar as CalendarIcon, Download, BarChart2 } from 'lucide-react';

import {
    BarChart,
    Bar,
    LineChart,
    Line,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';

// Dummy Data
const refundRiskData = [
    { name: 'Q1', revenue: 400, refund: 24, penalty: 10 },
    { name: 'Q2', revenue: 300, refund: 40, penalty: 15 },
    { name: 'Q3', revenue: 550, refund: 20, penalty: 5 },
    { name: 'Q4', revenue: 700, refund: 60, penalty: 25 },
];

const ratingTrendData = [
    { name: 'T1', rating: 4.2 },
    { name: 'T2', rating: 4.3 },
    { name: 'T3', rating: 4.1 },
    { name: 'T4', rating: 4.5 },
    { name: 'T5', rating: 4.6 },
    { name: 'T6', rating: 4.8 },
];



const formatCurrency = (value) => {
    return `${value}M`;
};

const AdminAnalytics = () => {
    return (
        <div className="space-y-6">


            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Stacked Bar Chart: Refund Risk */}
                <div className="lg:col-span-2 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <BarChart2 className="w-5 h-5 text-amber-500" />
                        <h2 className="text-lg font-semibold text-white">Rủi ro Hoàn tiền / Doanh thu</h2>
                    </div>
                    <div className="h-[350px] w-full" style={{ minHeight: 0, minWidth: 0 }}>
                        <ResponsiveContainer width="99%" height="100%" debounce={50}>
                            <BarChart data={refundRiskData} margin={{ top: 20, right: 30, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={formatCurrency} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem' }}
                                    itemStyle={{ color: '#fff' }}
                                    cursor={{ fill: '#1e293b' }}
                                />
                                <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
                                <Bar dataKey="revenue" name="Doanh thu thuần" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
                                <Bar dataKey="penalty" name="Phí phạt giữ lại" stackId="a" fill="#f59e0b" />
                                <Bar dataKey="refund" name="Hoàn tiền (Rủi ro)" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>



                {/* Line Chart: Rating Trend */}
                <div className="lg:col-span-2 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <BarChart2 className="w-5 h-5 text-amber-500" />
                        <h2 className="text-lg font-semibold text-white">Xu hướng Đánh giá Trung bình</h2>
                    </div>
                    <div className="h-[300px] w-full" style={{ minHeight: 0, minWidth: 0 }}>
                        <ResponsiveContainer width="99%" height="100%" debounce={50}>
                            <LineChart data={ratingTrendData} margin={{ top: 20, right: 30, left: -20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis domain={[0, 5]} stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem' }}
                                    itemStyle={{ color: '#f59e0b' }}
                                />
                                <Line type="monotone" dataKey="rating" name="Rating" stroke="#f59e0b" strokeWidth={3} dot={{ fill: '#0f172a', stroke: '#f59e0b', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AdminAnalytics;
