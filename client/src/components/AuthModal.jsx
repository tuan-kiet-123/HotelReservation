import React, { useState } from 'react';
import { X, Mail, Lock, User as UserIcon, Loader2 } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { toast } from 'sonner';

export default function AuthModal({ isOpen, onClose, defaultView = 'login' }) {
    const [view, setView] = useState(defaultView); // 'login' | 'register' | 'verify-register' | 'forgot' | 'reset'

    React.useEffect(() => {
        if (isOpen) setView(defaultView);
    }, [isOpen, defaultView]);
    const { login, register, verifyOtp, forgotPassword, resetPassword } = useAuth();
    
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (view === 'verify-register') {
            const res = await verifyOtp(fullName, email, password, otp);
            if (res.success) {
                toast.success("Kích hoạt tài khoản thành công!");
                setView('login');
                onClose();
            } else {
                toast.error(res.message);
            }
        } else if (view === 'login') {
            const res = await login(email, password);
            if (res.success) {
                toast.success("Đăng nhập thành công!");
                onClose();
            } else {
                toast.error(res.message);
            }
        } else if (view === 'register') {
            const res = await register(fullName, email, password);
            if (res.success) {
                if (res.requiresOtp) {
                    toast.success(res.message);
                    setView('verify-register');
                } else {
                    toast.success("Đăng ký thành công!");
                    onClose();
                }
            } else {
                toast.error(res.message);
            }
        } else if (view === 'forgot') {
            const res = await forgotPassword(email);
            if (res.success) {
                toast.success(res.message);
                setView('reset');
            } else {
                toast.error(res.message);
            }
        } else if (view === 'reset') {
            const res = await resetPassword(email, otp, newPassword);
            if (res.success) {
                toast.success(res.message);
                setView('login');
            } else {
                toast.error(res.message);
            }
        }

        setLoading(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden z-10 p-8 transform transition-all">
                <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors cursor-pointer">
                    <X className="w-5 h-5" />
                </button>

                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">
                        {view === 'verify-register' ? 'Xác thực Email' : 
                         view === 'forgot' ? 'Quên mật khẩu' :
                         view === 'reset' ? 'Tạo mật khẩu mới' :
                         view === 'login' ? 'Chào mừng trở lại' : 'Tạo tài khoản mới'}
                    </h2>
                    <p className="text-sm text-slate-500">
                        {view === 'verify-register' || view === 'reset' ? `Nhập mã OTP đã được gửi đến ${email}` : 
                         view === 'forgot' ? 'Nhập email của bạn để nhận mã khôi phục' :
                         view === 'login' ? 'Đăng nhập để nhận ưu đãi và quản lý đặt phòng' : 'Đăng ký ngay để trải nghiệm Traveloka Style'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    {(view === 'verify-register' || view === 'reset') && (
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mã OTP (6 số)</label>
                            <input 
                                type="text" 
                                required 
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                placeholder="Ví dụ: 123456" 
                                maxLength={6}
                                className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-center tracking-[0.5em] font-bold focus:bg-white focus:ring-2 focus:ring-[#2EC4B6]/20 focus:border-[#2EC4B6] outline-none transition-all text-2xl text-slate-800" 
                            />
                        </div>
                    )}

                    {(view === 'register') && (
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Họ và tên</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <UserIcon className="w-5 h-5 text-slate-400" />
                                </div>
                                <input 
                                    type="text" 
                                    required 
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="Ví dụ: Nguyễn Văn A" 
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#2EC4B6]/20 focus:border-[#2EC4B6] outline-none transition-all text-sm font-medium" 
                                />
                            </div>
                        </div>
                    )}

                    {(view === 'login' || view === 'register' || view === 'forgot') && (
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail className="w-5 h-5 text-slate-400" />
                                </div>
                                <input 
                                    type="email" 
                                    required 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="name@example.com" 
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#2EC4B6]/20 focus:border-[#2EC4B6] outline-none transition-all text-sm font-medium" 
                                />
                            </div>
                        </div>
                    )}

                    {(view === 'login' || view === 'register' || view === 'reset') && (
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-sm font-semibold text-slate-700">{view === 'reset' ? 'Mật khẩu mới' : 'Mật khẩu'}</label>
                                {view === 'login' && <button type="button" onClick={() => setView('forgot')} className="text-xs font-semibold text-[#2EC4B6] hover:underline cursor-pointer">Quên mật khẩu?</button>}
                            </div>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="w-5 h-5 text-slate-400" />
                                </div>
                                <input 
                                    type="password" 
                                    required 
                                    value={view === 'reset' ? newPassword : password}
                                    onChange={(e) => view === 'reset' ? setNewPassword(e.target.value) : setPassword(e.target.value)}
                                    placeholder="••••••••" 
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#2EC4B6]/20 focus:border-[#2EC4B6] outline-none transition-all text-sm font-medium" 
                                />
                            </div>
                        </div>
                    )}

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full mt-2 bg-[#FF6F61] hover:bg-[#FF5A4A] text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-[#FF6F61]/30 hover:shadow-[#FF6F61]/50 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                        {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                        {view === 'verify-register' || view === 'reset' ? 'Xác Nhận OTP' : 
                         view === 'forgot' ? 'Gửi mã OTP' : 
                         view === 'login' ? 'Đăng Nhập' : 'Đăng Ký'}
                    </button>
                </form>

                {(view === 'login' || view === 'register') && (
                    <div className="mt-8 text-center text-sm font-medium text-slate-600">
                        {view === 'login' ? 'Bạn chưa có tài khoản? ' : 'Bạn đã có tài khoản? '}
                        <button type="button" onClick={() => setView(view === 'login' ? 'register' : 'login')} className="text-[#2EC4B6] hover:underline cursor-pointer">
                            {view === 'login' ? 'Đăng ký ngay' : 'Đăng nhập'}
                        </button>
                    </div>
                )}
                
                {(view === 'forgot' || view === 'reset') && (
                    <div className="mt-8 text-center text-sm font-medium text-slate-600">
                        <button type="button" onClick={() => setView('login')} className="text-[#2EC4B6] hover:underline cursor-pointer">
                            Quay lại đăng nhập
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
