import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router';
import axios from 'axios';
import { Search, CalendarDays, Users, MapPin, Star, Building2, SlidersHorizontal, Loader2 } from 'lucide-react';
import SiteShell from '../components/SiteShell';
import './SearchPage.css';

const SearchPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    
    // Đọc params từ URL, nếu không có thì lấy mặc định
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const initialCheckIn = searchParams.get('checkIn') ? new Date(searchParams.get('checkIn')) : today;
    const initialCheckOut = searchParams.get('checkOut') ? new Date(searchParams.get('checkOut')) : tomorrow;
    const initialRoomType = searchParams.get('roomType') || 'Standard';

    const [searchName, setSearchName] = useState(query);
    const [checkIn, setCheckIn] = useState(initialCheckIn.toISOString().split('T')[0]);
    const [checkOut, setCheckOut] = useState(initialCheckOut.toISOString().split('T')[0]);
    const [roomType, setRoomType] = useState(initialRoomType);

    // State dữ liệu từ API
    const [hotels, setHotels] = useState([]);
    const [loading, setLoading] = useState(true);

    // Gọi API lấy danh sách khách sạn khi trang load hoặc params thay đổi
    useEffect(() => {
        const fetchHotels = async () => {
            setLoading(true);
            try {
                // Lấy params đang hiển thị trên URL
                const currentCheckIn = searchParams.get('checkIn') || checkIn;
                const currentCheckOut = searchParams.get('checkOut') || checkOut;
                const currentRoomType = searchParams.get('roomType') || roomType;

                const res = await axios.get(`http://localhost:5000/api/search?checkIn=${currentCheckIn}&checkOut=${currentCheckOut}&roomType=${currentRoomType}`);
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

    const handleSearch = () => {
        const params = new URLSearchParams();
        if (searchName.trim()) params.append('q', searchName.trim());
        params.append('checkIn', new Date(checkIn).toISOString());
        params.append('checkOut', new Date(checkOut).toISOString());
        params.append('roomType', roomType);
        setSearchParams(params);
    };

    // Lọc danh sách theo tên (client-side) dựa trên ô search trên thanh header
    const filteredHotels = searchName.trim()
        ? hotels.filter(h =>
            h.Name?.toLowerCase().includes(searchName.toLowerCase()) ||
            h.Location?.toLowerCase().includes(searchName.toLowerCase())
        )
        : hotels;

    return (
        <SiteShell>
            <main style={{ flex: 1, background: '#0f172a', minHeight: '100vh' }}>

                {/* THANH TÌM KIẾM NGANG */}
                <div className="search-bar-strip">
                    <div className="container">
                        <div className="search-bar-row">
                            {/* Ô nhập tên */}
                            <div className="search-field">
                                <Search size={18} color="#94a3b8" />
                                <input
                                    type="text"
                                    placeholder="Tên khách sạn, địa điểm..."
                                    value={searchName}
                                    onChange={(e) => setSearchName(e.target.value)}
                                />
                            </div>

                            {/* Ngày checkin/out */}
                            <div className="search-info-box" style={{ gap: '8px' }}>
                                <CalendarDays size={18} color="#f59e0b" />
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <input 
                                        type="date" 
                                        value={checkIn}
                                        onChange={e => setCheckIn(e.target.value)}
                                        style={{ background: 'transparent', color: '#fff', border: 'none', outline: 'none', fontSize: '13px' }}
                                    />
                                    <span style={{ color: '#64748b' }}>—</span>
                                    <input 
                                        type="date" 
                                        value={checkOut}
                                        onChange={e => setCheckOut(e.target.value)}
                                        style={{ background: 'transparent', color: '#fff', border: 'none', outline: 'none', fontSize: '13px' }}
                                    />
                                </div>
                            </div>

                            {/* Số người / Loại phòng */}
                            <div className="search-info-box" style={{ gap: '8px' }}>
                                <Users size={18} color="#f59e0b" />
                                <select 
                                    value={roomType}
                                    onChange={e => setRoomType(e.target.value)}
                                    style={{ background: 'transparent', color: '#fff', border: 'none', outline: 'none', fontSize: '14px', cursor: 'pointer' }}
                                >
                                    <option value="Standard" style={{ color: '#000' }}>Standard (Tối đa 2 Lớn, 1 Bé)</option>
                                    <option value="Deluxe" style={{ color: '#000' }}>Deluxe (Tối đa 4 Lớn, 2 Bé)</option>
                                    <option value="Luxury" style={{ color: '#000' }}>Luxury (Tối đa 6 Lớn, 3 Bé)</option>
                                </select>
                            </div>

                            {/* Nút Tìm */}
                            <button className="btn-search" onClick={handleSearch}>
                                <Search size={18} />
                                Tìm
                            </button>
                        </div>
                    </div>
                </div>

                {/* NỘI DUNG CHÍNH: BỘ LỌC (trái) + DANH SÁCH KS (phải) */}
                <div className="search-content">

                    {/* === BỘ LỌC (SIDEBAR) === */}
                    <aside className="search-sidebar">
                        <div className="filter-box">
                            <div className="filter-title">
                                <SlidersHorizontal size={18} color="#f59e0b" />
                                Bộ lọc tìm kiếm
                            </div>

                            {/* Lọc theo tên */}
                            <div className="filter-section">
                                <h4>Lọc theo tên</h4>
                                <div className="filter-input-wrap">
                                    <Search size={15} className="filter-input-icon" />
                                    <input
                                        type="text"
                                        placeholder="Ví dụ: InterContinental..."
                                        value={searchName}
                                        onChange={(e) => setSearchName(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Lọc theo sao */}
                            <div className="filter-section">
                                <h4>Hạng sao</h4>
                                <div className="star-list">
                                    {[5, 4, 3, 2, 1].map(star => (
                                        <label key={star}>
                                            <input type="checkbox" />
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                {star} <Star size={14} fill="#fbbf24" color="#fbbf24" />
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* === DANH SÁCH KHÁCH SẠN === */}
                    <section className="hotel-list">
                        <h2 className="list-heading">
                            {loading ? 'Đang tìm kiếm...' : `Tìm thấy ${filteredHotels.length} chỗ nghỉ phù hợp`}
                        </h2>

                        {loading ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
                                <Loader2 size={40} color="#f59e0b" style={{ animation: 'spin 1s linear infinite' }} />
                            </div>
                        ) : filteredHotels.length === 0 ? (
                            <div style={{
                                textAlign: 'center', padding: '60px 20px',
                                background: '#1e293b', borderRadius: 14, border: '1px dashed #475569', color: '#94a3b8'
                            }}>
                                <Building2 size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
                                <p style={{ fontSize: 16, fontWeight: 600 }}>Không tìm thấy khách sạn nào</p>
                                <p style={{ fontSize: 13, marginTop: 4 }}>Hãy thử tìm kiếm với từ khoá khác</p>
                            </div>
                        ) : (
                            filteredHotels.map((hotel) => (
                                <Link key={hotel._id} to={`/hotels/${hotel._id}?checkIn=${encodeURIComponent(new Date(checkIn).toISOString())}&checkOut=${encodeURIComponent(new Date(checkOut).toISOString())}`} className="hotel-card">
                                    {/* Ảnh */}
                                    <div className="card-image">
                                        <img src="/Logo.png" alt={hotel.Name} />
                                        <div className="badge">
                                            <Building2 size={14} color="#fbbf24" />
                                            Khách sạn
                                        </div>
                                    </div>

                                    {/* Thông tin */}
                                    <div className="card-body">
                                        <div>
                                            <div className="card-header-row">
                                                <div>
                                                    <h3 className="hotel-name">{hotel.Name}</h3>
                                                    <div className="hotel-meta">
                                                        <div className="location">
                                                            <MapPin size={14} />
                                                            {hotel.Location}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Amenities */}
                                            {hotel.Amenities && hotel.Amenities.length > 0 && (
                                                <div className="amenities-list">
                                                    {hotel.Amenities.slice(0, 4).map((amenity, idx) => (
                                                        <span key={idx} className="amenity-tag">{amenity}</span>
                                                    ))}
                                                    {hotel.Amenities.length > 4 && (
                                                        <span className="amenity-tag more">+{hotel.Amenities.length - 4}</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Footer */}
                                        <div className="card-footer">
                                            <div className="location" style={{ fontSize: 13 }}>
                                                <MapPin size={14} />
                                                {hotel.Location}
                                            </div>
                                            <div className="btn-detail">Xem chi tiết</div>
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
