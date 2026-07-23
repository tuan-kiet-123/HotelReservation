import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router';
import apiClient from '../lib/apiClient';
import { Search, Users, MapPin, Star, Building2, SlidersHorizontal, Loader2 } from 'lucide-react';
import SiteShell from '../components/SiteShell';
import DatePickerCalendar from '../components/DatePickerCalendar';

const SearchPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const initialCheckIn = searchParams.get('checkIn') ? new Date(searchParams.get('checkIn')) : today;
    const initialCheckOut = searchParams.get('checkOut') ? new Date(searchParams.get('checkOut')) : tomorrow;
    const initialRoomType = searchParams.get('roomType') || 'Standard';

    const [searchName, setSearchName] = useState(query);
    const [checkIn, setCheckIn] = useState(initialCheckIn);
    const [checkOut, setCheckOut] = useState(initialCheckOut);
    const [roomType, setRoomType] = useState(initialRoomType);

    const [hotels, setHotels] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHotels = async () => {
            setLoading(true);
            try {
                const currentCheckIn = searchParams.get('checkIn') || toLocalDateStr(checkIn);
                const currentCheckOut = searchParams.get('checkOut') || toLocalDateStr(checkOut);
                const currentRoomType = searchParams.get('roomType') || roomType;

                const res = await apiClient.get(`/search?checkIn=${currentCheckIn}&checkOut=${currentCheckOut}&roomType=${currentRoomType}`);
                if (res.data.success) {
                    setHotels(res.data.data);
                }
            } catch (error) {
                console.error('Lỗi khi tải danh sách khách sạn:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchHotels();
    }, [searchParams]);

    const toLocalDateStr = (d) => {
        if (!d) return '';
        const date = d instanceof Date ? d : new Date(d);
        return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
    };

    const handleSearch = () => {
        const params = new URLSearchParams();
        if (searchName.trim()) params.append('q', searchName.trim());
        params.append('checkIn', toLocalDateStr(checkIn));
        params.append('checkOut', toLocalDateStr(checkOut || checkIn));
        params.append('roomType', roomType);
        setSearchParams(params);
    };

    const filteredHotels = searchName.trim()
        ? hotels.filter(h =>
            h.Name?.toLowerCase().includes(searchName.toLowerCase()) ||
            h.Location?.toLowerCase().includes(searchName.toLowerCase())
        )
        : hotels;

    return (
        <SiteShell>
            <main className="flex-1 bg-slate-50 min-h-screen">
                {/* Search Bar Strip */}
                <div className="bg-white border-b border-slate-200 py-4 sticky top-[72px] z-30 shadow-sm">
                    <div className="max-w-7xl mx-auto px-4">
                        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 bg-white border border-slate-200 rounded-2xl p-2 shadow-sm">
                            {/* Input Field */}
                            <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl border border-transparent focus-within:border-[#2EC4B6] focus-within:bg-white transition-all">
                                <Search className="w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Tên khách sạn, địa điểm..."
                                    value={searchName}
                                    onChange={(e) => setSearchName(e.target.value)}
                                    className="w-full bg-transparent border-none outline-none text-slate-700 text-sm font-semibold placeholder:text-slate-400 placeholder:font-medium"
                                />
                            </div>

                            {/* Date Picker Component */}
                            <div className="flex-1">
                                <DatePickerCalendar
                                    checkIn={checkIn}
                                    checkOut={checkOut}
                                    onCheckInChange={setCheckIn}
                                    onCheckOutChange={setCheckOut}
                                    variant="light"
                                />
                            </div>

                            {/* Room Type */}
                            <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl border border-transparent hover:border-slate-300 transition-colors cursor-pointer">
                                <Users className="w-5 h-5 text-[#2EC4B6]" />
                                <select 
                                    value={roomType}
                                    onChange={e => setRoomType(e.target.value)}
                                    className="bg-transparent text-slate-700 font-semibold text-sm border-none outline-none cursor-pointer w-full appearance-none"
                                >
                                    <option value="Standard">Standard (2 Lớn, 1 Bé)</option>
                                    <option value="Deluxe">Deluxe (4 Lớn, 2 Bé)</option>
                                    <option value="Luxury">Luxury (6 Lớn, 3 Bé)</option>
                                </select>
                            </div>

                            {/* Search Button */}
                            <button 
                                onClick={handleSearch}
                                className="flex items-center justify-center gap-2 px-8 py-3 bg-[#FF6F61] hover:bg-[#FF5A4A] text-white font-bold rounded-xl shadow-md shadow-[#FF6F61]/30 transition-all active:scale-95"
                            >
                                <Search className="w-4 h-4" />
                                Tìm
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8">
                    {/* Sidebar Filters */}
                    <aside className="w-full lg:w-72 flex-shrink-0 lg:sticky lg:top-[160px] h-fit">
                        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                            <div className="flex items-center gap-2 font-bold text-slate-800 text-lg mb-6 pb-4 border-b border-slate-100">
                                <SlidersHorizontal className="w-5 h-5 text-[#2EC4B6]" />
                                Bộ lọc tìm kiếm
                            </div>

                            {/* Name Filter */}
                            <div className="mb-6">
                                <h4 className="text-sm font-bold text-slate-700 mb-3">Lọc theo tên</h4>
                                <div className="relative">
                                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        placeholder="Ví dụ: InterContinental..."
                                        value={searchName}
                                        onChange={(e) => setSearchName(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:bg-white focus:border-[#2EC4B6] focus:ring-2 focus:ring-[#2EC4B6]/20 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            {/* Star Rating Filter */}
                            <div>
                                <h4 className="text-sm font-bold text-slate-700 mb-3">Hạng sao</h4>
                                <div className="flex flex-col gap-3">
                                    {[5, 4, 3, 2, 1].map(star => (
                                        <label key={star} className="flex items-center gap-3 cursor-pointer group">
                                            <div className="relative flex items-center justify-center">
                                                <input type="checkbox" className="w-5 h-5 appearance-none border border-slate-300 rounded-md checked:bg-[#2EC4B6] checked:border-[#2EC4B6] transition-colors cursor-pointer" />
                                                <svg className="absolute w-3 h-3 text-white pointer-events-none opacity-0 checked-icon" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M1 5L4.5 8.5L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                </svg>
                                                <style>{`input:checked + svg { opacity: 1; }`}</style>
                                            </div>
                                            <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 group-hover:text-slate-900 transition-colors">
                                                {star} <Star className="w-4 h-4 text-[#FF6F61] fill-[#FF6F61]" />
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* Hotel List */}
                    <section className="flex-1 flex flex-col gap-5">
                        <h2 className="text-2xl font-black text-slate-800 mb-2">
                            {loading ? 'Đang tìm kiếm...' : `Tìm thấy ${filteredHotels.length} chỗ nghỉ phù hợp`}
                        </h2>

                        {loading ? (
                            <div className="flex justify-center items-center py-20">
                                <Loader2 className="w-10 h-10 text-[#2EC4B6] animate-spin" />
                            </div>
                        ) : filteredHotels.length === 0 ? (
                            <div className="flex flex-col items-center justify-center text-center py-20 bg-white border border-slate-200 border-dashed rounded-3xl">
                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                    <Building2 className="w-10 h-10 text-slate-300" />
                                </div>
                                <p className="text-lg font-bold text-slate-700">Không tìm thấy khách sạn nào</p>
                                <p className="text-sm font-medium text-slate-500 mt-2">Hãy thử tìm kiếm với từ khoá hoặc điều kiện khác</p>
                            </div>
                        ) : (
                            filteredHotels.map((hotel) => (
                                <Link 
                                    key={hotel._id} 
                                    to={`/hotels/${hotel._id}?checkIn=${toLocalDateStr(checkIn)}&checkOut=${toLocalDateStr(checkOut)}`} 
                                    className="flex flex-col md:flex-row bg-white border border-slate-200 rounded-3xl overflow-hidden hover:shadow-xl hover:border-[#2EC4B6]/50 transition-all duration-300 group"
                                >
                                    {/* Hotel Image */}
                                    <div className="relative w-full md:w-72 h-64 md:h-auto overflow-hidden shrink-0 bg-slate-100">
                                        <img 
                                            src={hotel.Images && hotel.Images.length > 0 ? hotel.Images[0] : "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"} 
                                            alt={hotel.Name} 
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                        <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-md border border-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                                            <Building2 className="w-3.5 h-3.5 text-[#FF6F61]" />
                                            Khách sạn
                                        </div>
                                    </div>

                                    {/* Hotel Info */}
                                    <div className="p-6 flex flex-col justify-between flex-1">
                                        <div>
                                            <div className="flex justify-between items-start gap-4 mb-2">
                                                <div>
                                                    <h3 className="text-xl font-bold text-slate-800 group-hover:text-[#2EC4B6] transition-colors mb-2 leading-tight">
                                                        {hotel.Name}
                                                    </h3>
                                                    <div className="flex items-center gap-1 text-sm font-medium text-slate-500">
                                                        <MapPin className="w-4 h-4 text-slate-400" />
                                                        {hotel.Location}
                                                    </div>
                                                </div>
                                            </div>

                                            {hotel.Amenities && hotel.Amenities.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mt-4">
                                                    {hotel.Amenities.slice(0, 4).map((amenity, idx) => (
                                                        <span key={idx} className="text-xs font-bold text-[#2EC4B6] bg-[#2EC4B6]/10 px-3 py-1 rounded-full border border-[#2EC4B6]/20">
                                                            {amenity}
                                                        </span>
                                                    ))}
                                                    {hotel.Amenities.length > 4 && (
                                                        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                                                            +{hotel.Amenities.length - 4} tiện ích
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-end justify-between mt-6 pt-6 border-t border-slate-100">
                                            <div className="flex items-center gap-1 text-sm font-semibold text-slate-500">
                                                <MapPin className="w-4 h-4 text-[#FF6F61]" />
                                                Xem trên bản đồ
                                            </div>
                                            <button className="bg-[#2EC4B6] hover:bg-[#1DA69A] text-white font-bold py-2.5 px-6 rounded-xl shadow-lg shadow-[#2EC4B6]/30 transition-colors">
                                                Xem chi tiết
                                            </button>
                                        </div>
                                    </div>
                                </Link>
                            ))
                        )}
                    </section>
                </div>
            </main>
        </SiteShell>
    );
};

export default SearchPage;
