import React, { useState } from 'react'
import { Search, MapPin, Hotel, Globe, Link2, ExternalLink, Phone, Mail, Menu, X } from 'lucide-react'
import { NavLink } from 'react-router'

const navLinks = [
    { to: '/', label: 'Trang chủ' },
    { to: '/search', label: 'Tìm kiếm' },
    { to: '/offers', label: 'Ưu đãi' },
    { to: '/contact', label: 'Liên hệ' },
]

const HomePage = () => {
    const [searchQuery, setSearchQuery] = useState('')
    const [mobileOpen, setMobileOpen] = useState(false)

    return (
        <div className="min-h-screen bg-background flex flex-col">

            {/* ===== HEADER ===== */}
            <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200/60">
                <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
                    <NavLink to="/" className="flex items-center gap-2 text-xl font-bold text-slate-800 tracking-tight">
                        <Hotel className="w-6 h-6 text-amber-500" />
                        <span>DaVinci<span className="text-amber-500">Resort</span></span>
                    </NavLink>

                    <nav className="hidden md:flex items-center gap-1">
                        {navLinks.map((link) => (
                            <NavLink
                                key={link.to}
                                to={link.to}
                                className={({ isActive }) =>
                                    `px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${isActive
                                        ? 'bg-amber-50 text-amber-600'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                    }`
                                }
                            >
                                {link.label}
                            </NavLink>
                        ))}
                    </nav>

                    <div className="hidden md:flex items-center gap-3">
                        <button className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer">
                            Đăng nhập
                        </button>
                        <button className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-400 rounded-full hover:from-amber-600 hover:to-orange-500 shadow-md shadow-amber-200/50 transition-all duration-300 cursor-pointer">
                            Đặt phòng
                        </button>
                    </div>

                    <button
                        className="md:hidden p-2 text-slate-600 hover:text-slate-900 cursor-pointer"
                        onClick={() => setMobileOpen(!mobileOpen)}
                    >
                        {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>

                {mobileOpen && (
                    <div className="md:hidden absolute top-16 left-0 right-0 bg-white border-b border-slate-200 shadow-lg">
                        <nav className="flex flex-col p-4 gap-1">
                            {navLinks.map((link) => (
                                <NavLink
                                    key={link.to}
                                    to={link.to}
                                    onClick={() => setMobileOpen(false)}
                                    className={({ isActive }) =>
                                        `px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive
                                            ? 'bg-amber-50 text-amber-600'
                                            : 'text-slate-600 hover:bg-slate-100'
                                        }`
                                    }
                                >
                                    {link.label}
                                </NavLink>
                            ))}
                            <hr className="my-2 border-slate-100" />
                            <button className="px-4 py-3 text-sm font-medium text-slate-600 text-left hover:bg-slate-100 rounded-lg cursor-pointer">
                                Đăng nhập
                            </button>
                            <button className="mx-4 mt-1 py-3 text-sm font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-400 rounded-full text-center cursor-pointer">
                                Đặt phòng
                            </button>
                        </nav>
                    </div>
                )}
            </header>

            {/* ===== MAIN CONTENT ===== */}
            <main className="flex-1 pt-16">
                {/* Hero Section */}
                <section className="relative w-full min-h-[600px] flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                    <div className="absolute inset-0 opacity-10"
                        style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                        }}
                    />

                    <div className="relative z-10 flex flex-col items-center gap-8 px-4 max-w-4xl mx-auto text-center">
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
            </main>

            {/* ===== FOOTER ===== */}
            <footer className="bg-slate-900 text-slate-300">
                <div className="max-w-7xl mx-auto px-4 py-16">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
                        {/* Brand */}
                        <div className="flex flex-col gap-4">
                            <NavLink to="/" className="flex items-center gap-2 text-xl font-bold text-white tracking-tight">
                                <Hotel className="w-6 h-6 text-amber-400" />
                                <span>DaVinci<span className="text-amber-400">Resort</span></span>
                            </NavLink>
                            <p className="text-sm leading-relaxed text-slate-400">
                                Nền tảng đặt phòng khách sạn nghỉ dưỡng hàng đầu Tôn Đức Thắng University. Trải nghiệm dịch vụ 5 sao với mức giá tốt nhất.
                            </p>
                            <div className="flex gap-3 mt-2">
                                {[Globe, Link2, ExternalLink].map((Icon, i) => (
                                    <a key={i} href="#" className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:bg-amber-500 hover:text-white transition-all duration-300">
                                        <Icon className="w-4 h-4" />
                                    </a>
                                ))}
                            </div>
                        </div>

                        {/* Khám phá */}
                        <div>
                            <h4 className="text-white font-semibold mb-5 text-sm uppercase tracking-wider">Khám phá</h4>
                            <ul className="flex flex-col gap-3">
                                {[
                                    { to: '/search', label: 'Tìm khách sạn' },
                                    { to: '/offers', label: 'Ưu đãi hôm nay' },
                                    { to: '/destinations', label: 'Điểm đến phổ biến' },
                                    { to: '/reviews', label: 'Đánh giá từ khách' },
                                ].map((link) => (
                                    <li key={link.to}>
                                        <NavLink to={link.to} className="text-sm text-slate-400 hover:text-amber-400 transition-colors duration-200">
                                            {link.label}
                                        </NavLink>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Hỗ trợ */}
                        <div>
                            <h4 className="text-white font-semibold mb-5 text-sm uppercase tracking-wider">Hỗ trợ</h4>
                            <ul className="flex flex-col gap-3">
                                {[
                                    { to: '/faq', label: 'Câu hỏi thường gặp' },
                                    { to: '/policy', label: 'Chính sách đặt phòng' },
                                    { to: '/privacy', label: 'Bảo mật thông tin' },
                                    { to: '/terms', label: 'Điều khoản sử dụng' },
                                ].map((link) => (
                                    <li key={link.to}>
                                        <NavLink to={link.to} className="text-sm text-slate-400 hover:text-amber-400 transition-colors duration-200">
                                            {link.label}
                                        </NavLink>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Liên hệ */}
                        <div>
                            <h4 className="text-white font-semibold mb-5 text-sm uppercase tracking-wider">Liên hệ</h4>
                            <ul className="flex flex-col gap-4">
                                <li className="flex items-start gap-3 text-sm">
                                    <MapPin className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                                    <span>Bình Chánh, TP.HCM</span>
                                </li>
                                <li className="flex items-center gap-3 text-sm">
                                    <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                                    <span>093 8422398</span>
                                </li>
                                <li className="flex items-center gap-3 text-sm">
                                    <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                                    <span>52300051@student.tdtu.edu.vn</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="border-t border-slate-800">
                    <div className="max-w-7xl mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
                        <p>&copy; {new Date().getFullYear()} DaVinciResort. All rights reserved.</p>
                        <p>Made by Team DaVinci</p>
                    </div>
                </div>
            </footer>
        </div>
    )
}

export default HomePage