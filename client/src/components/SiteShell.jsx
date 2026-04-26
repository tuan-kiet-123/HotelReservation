import React, { useState } from "react";
import { NavLink } from "react-router";
import { Menu, X, MapPin, Mail, Phone, Globe, Link2, ExternalLink } from "lucide-react";

const navLinks = [
    { to: "/", label: "Trang chủ" },
    { to: "/hotels/69ca837d9a90b3531e860c22", label: "Chi tiết KS" },
    { to: "/checkout", label: "Thanh toán" },
    { to: "/my-bookings", label: "Đơn đặt phòng" }
];

function LinkItem({ to, label, onClick }) {
    return (
        <NavLink
            to={to}
            onClick={onClick}
            className={({ isActive }) =>
                `px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${isActive
                    ? "bg-white/15 text-amber-400"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                }`
            }
        >
            {label}
        </NavLink>
    );
}

export default function SiteShell({ children }) {
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-slate-900 border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
                    <NavLink to="/" className="flex items-center gap-2 text-xl font-bold text-white tracking-tight">
                        <img src="/Logo.png" alt="Logo" className="w-8 h-8 object-contain" />
                        <span>
                            DaVinci<span className="text-amber-400">Resort</span>
                        </span>
                    </NavLink>

                    <nav className="hidden md:flex items-center gap-1">
                        {navLinks.map((link) => (
                            <LinkItem key={link.to} to={link.to} label={link.label} />
                        ))}
                    </nav>

                    <div className="hidden md:flex items-center gap-3">
                        <button className="px-4 py-2 text-sm font-medium text-white/80 hover:text-white transition-colors cursor-pointer">
                            Đăng ký
                        </button>
                        <button className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-400 rounded-full hover:from-amber-600 hover:to-orange-500 shadow-md shadow-amber-500/30 transition-all duration-300 cursor-pointer">
                            Đăng nhập
                        </button>
                    </div>

                    <button
                        className="md:hidden p-2 text-white/80 hover:text-white cursor-pointer"
                        onClick={() => setMobileOpen((prev) => !prev)}
                    >
                        {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>

                {mobileOpen && (
                    <div className="md:hidden absolute top-16 left-0 right-0 bg-slate-900/95 border-b border-white/10 shadow-lg">
                        <nav className="flex flex-col p-4 gap-1">
                            {navLinks.map((link) => (
                                <LinkItem
                                    key={link.to}
                                    to={link.to}
                                    label={link.label}
                                    onClick={() => setMobileOpen(false)}
                                />
                            ))}
                        </nav>
                    </div>
                )}
            </header>

            <main className="flex-1 pt-16">{children}</main>

            <footer className="bg-slate-900 text-slate-300 mt-10">
                <div className="max-w-7xl mx-auto px-4 py-14">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
                        <div className="flex flex-col gap-4">
                            <NavLink to="/" className="flex items-center gap-2 text-xl font-bold text-white tracking-tight">
                                <img src="/Logo.png" alt="Logo" className="w-8 h-8 object-contain" />
                                <span>
                                    DaVinci<span className="text-amber-400">Resort</span>
                                </span>
                            </NavLink>
                            <p className="text-sm text-slate-400 leading-relaxed">
                                Nền tảng đặt phòng nghỉ dưỡng với luồng đặt phòng, thanh toán và đánh giá đồng bộ cho đồ án CSDL nâng cao.
                            </p>
                            <div className="flex gap-3 mt-1">
                                {[Globe, Link2, ExternalLink].map((Icon, index) => (
                                    <button
                                        key={index}
                                        className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:bg-amber-500 hover:text-white transition-all duration-300"
                                    >
                                        <Icon className="w-4 h-4" />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h4 className="text-white font-semibold mb-5 text-sm uppercase tracking-wider">Liên hệ</h4>
                            <ul className="space-y-4 text-sm">
                                <li className="flex items-center gap-3">
                                    <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                                    <span>19 Nguyễn Hữu Thọ, TP Hồ Chí Minh</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                                    <span>+84 909 000 999</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                                    <span>team.davinci@tdtu.edu.vn</span>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-white font-semibold mb-5 text-sm uppercase tracking-wider">Tính năng</h4>
                            <ul className="space-y-3 text-sm text-slate-400">
                                <li>Đặt phòng theo thời gian thực</li>
                                <li>Thanh toán cọc 30% hoặc 100%</li>
                                <li>Check-in/check-out tự động</li>
                                <li>Đánh giá sau khi hoàn tất lưu trú</li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-white font-semibold mb-5 text-sm uppercase tracking-wider">Điều hướng nhanh</h4>
                            <ul className="space-y-2 text-sm">
                                {navLinks.map((item) => (
                                    <li key={item.to}>
                                        <NavLink to={item.to} className="text-slate-400 hover:text-amber-400 transition-colors">
                                            {item.label}
                                        </NavLink>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="border-t border-slate-800">
                    <div className="max-w-7xl mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
                        <p>© {new Date().getFullYear()} DaVinciResort. All rights reserved.</p>
                        <p>Made by Team DaVinci</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
