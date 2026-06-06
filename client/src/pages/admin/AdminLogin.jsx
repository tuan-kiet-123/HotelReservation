import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router';
import { useAuth } from '../../lib/auth';
import { Lock, Mail, ArrowRight, ShieldCheck, Hotel } from 'lucide-react';
import { toast } from 'sonner';

const AdminLogin = () => {
    const { login, currentUser } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Nếu đã đăng nhập và là Admin, tự động chuyển vào dashboard
    if (currentUser?.Role === 'Admin') {
        return <Navigate to="/admin" replace />;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!email || !password) {
            toast.error("Vui lòng nhập đầy đủ email và mật khẩu");
            return;
        }

        setIsLoading(true);
        const res = await login(email, password);
        setIsLoading(false);

        if (res.success) {
            // Lấy dữ liệu user mới nhất từ localStorage (do AuthContext vừa cập nhật)
            const userData = JSON.parse(localStorage.getItem("current_user"));
            if (userData?.Role === 'Admin') {
                toast.success("Đăng nhập quyền quản trị thành công!");
                navigate('/admin');
            } else {
                toast.error("Tài khoản của bạn không có quyền truy cập trang quản trị!");
            }
        } else {
            toast.error(res.message || "Thông tin đăng nhập không chính xác");
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
            
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-amber-500/10 blur-[100px] rounded-full mix-blend-screen"></div>
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/10 blur-[100px] rounded-full mix-blend-screen"></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
            </div>

            <div className="relative z-10 w-full max-w-md">
                
                {/* Logo Section */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 shadow-xl mb-6">
                        <ShieldCheck className="w-8 h-8 text-amber-500" />
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
                        DaVinci<span className="text-amber-500">Admin</span>
                    </h1>
                    <p className="text-slate-400 text-sm">Hệ thống quản trị trung tâm Hotel Reservation</p>
                </div>

                {/* Login Card */}
                <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-800 shadow-2xl p-8 relative overflow-hidden">
                    
                    {/* Top Accent Line */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500"></div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email Quản Trị</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-slate-500" />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all placeholder:text-slate-600"
                                    placeholder="admin@davinci.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Mật Khẩu</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-slate-500" />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all placeholder:text-slate-600"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full relative group overflow-hidden rounded-xl bg-amber-500 px-4 py-3.5 text-slate-950 font-bold hover:bg-amber-400 transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-slate-900 flex items-center justify-center gap-2 disabled:opacity-70"
                        >
                            <span className="relative z-10">{isLoading ? 'Đang xác thực...' : 'Đăng nhập vào Hệ thống'}</span>
                            {!isLoading && <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />}
                        </button>
                    </form>
                </div>

                {/* Footer link to main site */}
                <div className="mt-8 text-center">
                    <button 
                        onClick={() => navigate('/')} 
                        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-amber-500 transition-colors"
                    >
                        <Hotel className="w-4 h-4" />
                        Quay lại trang Đặt phòng (User)
                    </button>
                </div>

            </div>
        </div>
    );
};

export default AdminLogin;
