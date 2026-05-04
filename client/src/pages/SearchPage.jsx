import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router';
import axios from 'axios';
import { Search, CalendarDays, Users, MapPin, Star, Building2, SlidersHorizontal, Loader2 } from 'lucide-react';
import SiteShell from '../components/SiteShell';
import './SearchPage.css';

const SearchPage = () => {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const [searchName, setSearchName] = useState(query);

    // State dữ liệu từ API
    const [hotels, setHotels] = useState([]);
    const [loading, setLoading] = useState(true);

    // Gọi API lấy danh sách khách sạn khi trang load
    useEffect(() => {
        const fetchHotels = async () => {
            setLoading(true);
            try {
                const res = await axios.get('http://localhost:5000/api/mongo/hotels');
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
    }, []);

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
                            <div className="search-info-box">
                                <CalendarDays size={18} color="#f59e0b" />
                                <div>
                                    <div className="info-label">Nhận - Trả phòng</div>
                                    <div className="info-value">14 thg 5 — 16 thg 5</div>
                                </div>
                            </div>

                            {/* Số người */}
                            <div className="search-info-box">
                                <Users size={18} color="#f59e0b" />
                                <div>
                                    <div className="info-label">Khách và Phòng</div>
                                    <div className="info-value">2 người lớn, 1 phòng</div>
                                </div>
                            </div>

                            {/* Nút Tìm */}
                            <button className="btn-search">
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

                            {/* Lọc theo giá */}
                            <div className="filter-section">
                                <h4>Khoảng giá (mỗi đêm)</h4>
                                <input type="range" min="0" max="20000000" />
                                <div className="range-labels">
                                    <span>0đ</span>
                                    <span>20.000.000đ+</span>
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
                                <Link key={hotel._id} to={`/hotels/${hotel._id}`} className="hotel-card">
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
