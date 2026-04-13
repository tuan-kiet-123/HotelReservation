import React, { useState } from 'react'
import { Search, MapPin, CalendarDays, Users } from 'lucide-react'

const HomePage = () => {
    const [searchQuery, setSearchQuery] = useState('')

    return (
        <div className="min-h-screen bg-background">
            <section className="relative w-full min-h-[600px] flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                <div className="absolute inset-0 opacity-10"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    }}
                />

                <div className="relative z-10 flex flex-col items-center gap-8 px-4 max-w-4xl mx-auto text-center">
                    {/* Heading */}
                    <div className="flex flex-col gap-4">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight">
                            Tìm kiếm <span className="text-amber-400">Khách sạn</span> hoàn hảo cho kỳ nghỉ của bạn
                        </h1>
                        <p className="text-lg text-slate-300 max-w-2xl mx-auto">
                            Khám phá hàng nghìn khách sạn nghỉ dưỡng cao cấp với giá tốt nhất. Đặt phòng nhanh chóng, dễ dàng và an toàn.
                        </p>
                    </div>

                    {/* Search Bar */}
                    <div className="w-full max-w-2xl">
                        <div className="flex items-center bg-white rounded-full shadow-xl overflow-hidden transition-all duration-300 hover:shadow-2xl">
                            <div className="flex items-center gap-3 flex-1 px-6 py-4">
                                <Search className="w-5 h-5 text-slate-400 shrink-0" />
                                <input
                                    type="text"
                                    placeholder="Tìm theo tên khách sạn, địa điểm..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-transparent outline-none text-slate-700 placeholder:text-slate-400 text-base"
                                />
                            </div>
                            <button className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-400 hover:from-amber-600 hover:to-orange-500 text-white font-semibold px-8 py-4 m-1.5 rounded-full transition-all duration-300 cursor-pointer shrink-0">
                                <Search className="w-4 h-4" />
                                Search
                            </button>
                        </div>
                    </div>

                    {/* Quick Filters */}
                    <div className="flex flex-wrap justify-center gap-3 mt-2">
                        {['Nha Trang', 'Đà Nẵng', 'Phú Quốc', 'Hội An', 'Đà Lạt'].map((city) => (
                            <button
                                key={city}
                                className="flex items-center gap-1.5 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white text-sm hover:bg-white/20 transition-all duration-200 cursor-pointer"
                            >
                                <MapPin className="w-3.5 h-3.5" />
                                {city}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-12 bg-white border-b border-slate-100">
                <div className="max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                    {[
                        { number: '500+', label: 'Khách sạn' },
                        { number: '10K+', label: 'Đánh giá' },
                        { number: '50K+', label: 'Khách hàng' },
                        { number: '100+', label: 'Thành phố' },
                    ].map((stat) => (
                        <div key={stat.label} className="flex flex-col gap-1">
                            <span className="text-3xl font-bold text-slate-800">{stat.number}</span>
                            <span className="text-sm text-slate-500">{stat.label}</span>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    )
}

export default HomePage