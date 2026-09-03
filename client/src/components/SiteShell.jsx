import React, { useState } from "react";
import { NavLink } from "react-router";
import { Menu, X, MapPin, Mail, Phone, Globe, Link2, ExternalLink } from "lucide-react";
import { useAuth } from "../lib/auth";
import AuthModal from "./AuthModal";

const navLinks = [
    { to: "/", label: "Trang chủ" },
    { to: "/hotels", label: "Chi tiết KS" },
    { to: "/my-bookings", label: "Đơn đặt phòng" }
];

function LinkItem({ to, label, onClick }) {
    return (
        <NavLink
            to={to}
            onClick={onClick}
            className={({ isActive }) =>
                `px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${isActive
                    ? "bg-[#2EC4B6]/10 text-[#2EC4B6]"
                    : "text-slate-600 hover:text-[#2EC4B6] hover:bg-slate-50"
                }`
            }
        >
            {label}
        </NavLink>
    );
}

export default function SiteShell({ children }) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [authOpen, setAuthOpen] = useState(false);
    const [authView, setAuthView] = useState('login');
    const { currentUser, logout } = useAuth();

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-[#2EC4B6]/20 selection:text-[#2EC4B6]">
            {/* Header / Navbar */}
            <header className="fixed top-0 left-0 right-0 z-50 h-[72px] bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm transition-all duration-300">
                <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
                    {/* Logo */}
                    <NavLink to="/" className="flex items-center gap-2 text-2xl font-black text-slate-800 tracking-tight cursor-pointer">
                        <img src="/Logo.png" alt="Logo" className="w-9 h-9 object-contain" />
                        <span>
                            DaVinci<span className="text-[#FF6F61]">Resort</span>
                        </span>
                    </NavLink>

                    {/* Navigation */}
                    <nav className="hidden md:flex items-center gap-1">
                        {navLinks.map((link) => (
                            <LinkItem key={link.to} to={link.to} label={link.label} />
                        ))}
                    </nav>

                    {/* Authentication Section */}
                    <div className="hidden md:flex items-center gap-4">
                        {!currentUser ? (
                            <>
                                <button 
                                    onClick={() => { setAuthView('login'); setAuthOpen(true); }}
                                    className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-[#2EC4B6] transition-colors cursor-pointer"
                                >
                                    Đăng nhập
                                </button>
                                <button 
                                    onClick={() => { setAuthView('register'); setAuthOpen(true); }}
                                    className="px-6 py-2.5 text-sm font-bold bg-[#FF6F61] text-white rounded-full hover:bg-[#FF5A4A] transition-all shadow-md shadow-[#FF6F61]/20 cursor-pointer"
                                >
                                    Đăng ký
                                </button>
                            </>
                        ) : (
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 bg-[#2EC4B6]/10 px-4 py-2 rounded-full border border-[#2EC4B6]/20">
                                    <div className="w-7 h-7 bg-[#2EC4B6] rounded-full flex items-center justify-center text-white font-bold text-xs">
                                        {currentUser.FullName.charAt(0)}
                                    </div>
                                    <span className="text-sm font-bold text-[#2EC4B6]">{currentUser.FullName}</span>
                                </div>
                                <button
                                    onClick={logout}
                                    className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-red-500 transition-colors cursor-pointer"
                                >
                                    Đăng xuất
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button
                        className="md:hidden p-2 text-slate-600 hover:text-[#2EC4B6] cursor-pointer"
                        onClick={() => setMobileOpen((prev) => !prev)}
                    >
                        {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>

                {/* Mobile Navigation */}
                {mobileOpen && (
                    <div className="md:hidden absolute top-[72px] left-0 right-0 bg-white border-b border-slate-100 shadow-xl py-4 px-4 flex flex-col gap-2">
                        {navLinks.map((link) => (
                            <LinkItem
                                key={link.to}
                                to={link.to}
                                label={link.label}
                                onClick={() => setMobileOpen(false)}
                            />
                        ))}
                        <div className="h-px bg-slate-100 my-2"></div>
                        {!currentUser ? (
                            <button onClick={() => { setAuthView('login'); setAuthOpen(true); setMobileOpen(false); }} className="w-full py-3 bg-[#FF6F61] text-white font-bold rounded-xl shadow-md">
                                Đăng nhập / Đăng ký
                            </button>
                        ) : (
                            <button onClick={() => { logout(); setMobileOpen(false); }} className="w-full py-3 bg-slate-100 text-slate-600 font-bold rounded-xl">
                                Đăng xuất
                            </button>
                        )}
                    </div>
                )}
            </header>

            <main className="flex-1 pt-[72px]">{children}</main>

            {/* Footer */}
            <footer className="bg-white border-t border-slate-200 mt-16 pt-16 pb-8">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
                        <div className="flex flex-col gap-5">
                            <NavLink to="/" className="flex items-center gap-2 text-2xl font-black text-slate-800 tracking-tight">
                                <img src="/Logo.png" alt="Logo" className="w-9 h-9 object-contain" />
                                <span>
                                    DaVinci<span className="text-[#FF6F61]">Resort</span>
                                </span>
                            </NavLink>
                            <p className="text-sm font-medium text-slate-500 leading-relaxed">
                                Nền tảng đặt phòng nghỉ dưỡng với luồng đặt phòng, thanh toán và đánh giá hiện đại mang phong cách tươi mát.
                            </p>
                            <div className="flex gap-3 mt-2">
                                {[Globe, Link2, ExternalLink].map((Icon, index) => (
                                    <button
                                        key={index}
                                        className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-[#2EC4B6] hover:text-white transition-all duration-300 cursor-pointer"
                                    >
                                        <Icon className="w-4 h-4" />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h4 className="text-slate-800 font-bold mb-6 text-sm uppercase tracking-wider">Liên hệ</h4>
                            <ul className="space-y-4 text-sm font-medium text-slate-500">
                                <li className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-[#2EC4B6]/10 flex items-center justify-center shrink-0">
                                        <MapPin className="w-4 h-4 text-[#2EC4B6]" />
                                    </div>
                                    <span>19 Nguyễn Hữu Thọ, TP Hồ Chí Minh</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-[#2EC4B6]/10 flex items-center justify-center shrink-0">
                                        <Phone className="w-4 h-4 text-[#2EC4B6]" />
                                    </div>
                                    <span>+84 909 000 999</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-[#2EC4B6]/10 flex items-center justify-center shrink-0">
                                        <Mail className="w-4 h-4 text-[#2EC4B6]" />
                                    </div>
                                    <span>team.davinci@tdtu.edu.vn</span>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-slate-800 font-bold mb-6 text-sm uppercase tracking-wider">Tính năng</h4>
                            <ul className="space-y-3 text-sm font-medium text-slate-500">
                                <li className="hover:text-[#2EC4B6] cursor-pointer transition-colors">Đặt phòng theo thời gian thực</li>
                                <li className="hover:text-[#2EC4B6] cursor-pointer transition-colors">Thanh toán an toàn bảo mật</li>
                                <li className="hover:text-[#2EC4B6] cursor-pointer transition-colors">Check-in/check-out tiện lợi</li>
                                <li className="hover:text-[#2EC4B6] cursor-pointer transition-colors">Đánh giá và nhận ưu đãi</li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-slate-800 font-bold mb-6 text-sm uppercase tracking-wider">Điều hướng nhanh</h4>
                            <ul className="space-y-3 text-sm font-medium">
                                {navLinks.map((item) => (
                                    <li key={item.to}>
                                        <NavLink to={item.to} className="text-slate-500 hover:text-[#2EC4B6] transition-colors">
                                            {item.label}
                                        </NavLink>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-slate-100 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-slate-400">
                        <p>© {new Date().getFullYear()} DaVinciResort. All rights reserved.</p>
                        <p>Redesigned with ❤️ in Mint Green Style</p>
                    </div>
                </div>
            </footer>

            {/* Auth Modal */}
            <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} defaultView={authView} />
        </div>
    );
}
