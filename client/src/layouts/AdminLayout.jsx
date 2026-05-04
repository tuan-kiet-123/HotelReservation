import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router';
// Let's use lucide-react as used in HomePage
import {
    LayoutDashboard as LayoutDashboardIcon,
    Wallet as WalletIcon,
    CalendarCheck as CalendarCheckIcon,
    BarChart3 as BarChart3Icon,
    Activity as ActivityIcon,
    LogOut as LogOutIcon,
    Bell as BellIcon,
    Search as SearchIcon,
    Menu as MenuIcon,
    X as XIcon,
    User as UserIcon,
    ChevronDown
} from 'lucide-react';

const navItems = [
    { name: 'Tổng quan', path: '/admin', icon: LayoutDashboardIcon },
    { name: 'Sổ cái Tài chính', path: '/admin/ledger', icon: WalletIcon },
    { name: 'Quản lý Đặt phòng', path: '/admin/bookings', icon: CalendarCheckIcon },
    { name: 'Báo cáo Phân tích', path: '/admin/analytics', icon: BarChart3Icon },
    { name: 'Nhật ký Giá', path: '/admin/price-logs', icon: ActivityIcon },
];

const AdminLayout = () => {
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        navigate('/');
    };

    const getPageTitle = (pathname) => {
        switch (pathname) {
            case '/admin': return { title: 'Tổng quan Quản trị', desc: 'Dữ liệu phân tích hiệu suất khách sạn.' };
            case '/admin/ledger': return { title: 'Sổ cái Tài chính', desc: 'Theo dõi dòng tiền vào/ra, hoàn tiền và đặt cọc.' };
            case '/admin/analytics': return { title: 'Phân tích Nâng cao', desc: 'Báo cáo chi tiết về rủi ro và đánh giá.' };
            case '/admin/bookings': return { title: 'Quản lý Đặt phòng', desc: 'Kiểm soát và xử lý các yêu cầu đặt phòng.' };
            case '/admin/price-logs': return { title: 'Nhật ký Giá', desc: 'Lịch sử thay đổi và điều chỉnh giá phòng.' };
            default: return { title: 'Quản trị hệ thống', desc: 'Giao diện quản lý khách sạn.' };
        }
    };

    const { title, desc } = getPageTitle(location.pathname);

    return (
        <div className="min-h-screen bg-slate-900 text-slate-200 flex overflow-hidden">

            {/* Mobile Sidebar Overlay */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`fixed lg:static inset-y-0 left-0 w-64 bg-slate-950 border-r border-slate-800 z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>

                {/* Logo Area */}
                <div className="h-16 flex items-center px-6 border-b border-slate-800">
                    <div className="flex items-center gap-2 text-xl font-bold text-white tracking-tight cursor-pointer" onClick={() => navigate('/admin')}>
                        <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-400 flex items-center justify-center text-white text-sm font-black shadow-lg shadow-amber-500/20">D</span>
                        <span>DaVinci<span className="text-amber-500">Admin</span></span>
                    </div>
                </div>

                {/* Navigation Links */}
                <div className="flex-1 overflow-y-auto py-6 px-3 flex flex-col gap-1">
                    <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Quản trị viên</p>
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === '/admin'}
                            onClick={() => setIsMobileOpen(false)}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                                    ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                                }`
                            }
                        >
                            <item.icon className="w-5 h-5 shrink-0" />
                            {item.name}
                        </NavLink>
                    ))}
                </div>

                {/* Bottom Actions */}
                <div className="p-4 border-t border-slate-800">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                    >
                        <LogOutIcon className="w-5 h-5 shrink-0" />
                        Đăng xuất
                    </button>
                </div>
            </aside>

            {/* Main Content Wrapper */}
            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">

                {/* Topbar */}
                <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-4 lg:px-8 z-30 shrink-0">

                    <div className="flex items-center gap-4">
                        <button
                            className="lg:hidden p-2 -ml-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5"
                            onClick={() => setIsMobileOpen(true)}
                        >
                            <MenuIcon className="w-6 h-6" />
                        </button>

                        <div className="hidden md:block">
                            <h1 className="text-lg font-bold text-white tracking-tight">{title}</h1>
                            <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 sm:gap-5">
                        <button className="relative p-2 text-slate-400 hover:text-amber-500 transition-colors rounded-full hover:bg-amber-500/10">
                            <BellIcon className="w-5 h-5" />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-slate-900"></span>
                        </button>

                        <div className="w-px h-6 bg-slate-800 hidden sm:block"></div>

                        <button className="flex items-center gap-3 hover:bg-white/5 p-1.5 pr-3 rounded-full transition-colors border border-transparent hover:border-slate-800">
                            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden">
                                <UserIcon className="w-4 h-4 text-slate-400" />
                            </div>
                            <div className="hidden sm:flex flex-col items-start">
                                <span className="text-sm font-medium text-slate-200 leading-tight">Admin User</span>
                                <span className="text-[10px] text-amber-500 font-semibold uppercase tracking-wider">Manager</span>
                            </div>
                            <ChevronDown className="w-4 h-4 text-slate-500 ml-1 hidden sm:block" />
                        </button>
                    </div>

                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
