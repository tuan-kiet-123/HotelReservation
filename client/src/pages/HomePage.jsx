import React, { useState, useRef, useEffect } from 'react'
import { Search, MapPin, Hotel, Globe, Link2, ExternalLink, Phone, Mail, Church, User, Menu, X, CalendarDays, Users, ChevronLeft, ChevronRight, Minus, Plus } from 'lucide-react'
import { NavLink } from 'react-router'

const navLinks = [
    { to: '/', label: 'Trang chủ' },
    { to: '/hotels/69ca837d9a90b3531e860c22', label: 'Chi tiết KS' },
    { to: '/checkout', label: 'Thanh toán' },
    { to: '/my-bookings', label: 'Đơn của tôi' },
]

const DAYS_VN = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
const MONTHS_VN = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12']

const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate()
const getFirstDayOfMonth = (year, month) => {
    const day = new Date(year, month, 1).getDay()
    return day === 0 ? 6 : day - 1
}

const formatDate = (date) => {
    if (!date) return null
    const day = date.getDate()
    const month = date.getMonth() + 1
    const year = date.getFullYear()
    return `${day} tháng ${month} ${year}`
}

const getDayName = (date) => {
    if (!date) return ''
    const names = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']
    return names[date.getDay()]
}

const isSameDay = (a, b) => a && b && a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()

const HomePage = () => {
    const [searchQuery, setSearchQuery] = useState('')
    const [mobileOpen, setMobileOpen] = useState(false)

    // Date picker state
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const [checkIn, setCheckIn] = useState(today)
    const [checkOut, setCheckOut] = useState(tomorrow)
    const [showDatePicker, setShowDatePicker] = useState(false)
    const [calMonth, setCalMonth] = useState(today.getMonth())
    const [calYear, setCalYear] = useState(today.getFullYear())
    const dateRef = useRef(null)

    // Guest picker state
    const [showGuestPicker, setShowGuestPicker] = useState(false)
    const [rooms, setRooms] = useState(1)
    const [adults, setAdults] = useState(2)
    const [children, setChildren] = useState(0)
    const guestRef = useRef(null)

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClick = (e) => {
            if (dateRef.current && !dateRef.current.contains(e.target)) setShowDatePicker(false)
            if (guestRef.current && !guestRef.current.contains(e.target)) setShowGuestPicker(false)
        }
        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [])

    // Calendar navigation
    const nextMonth2 = calMonth === 11 ? 0 : calMonth + 1
    const nextYear2 = calMonth === 11 ? calYear + 1 : calYear

    const goBack = () => {
        if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1) }
        else setCalMonth(calMonth - 1)
    }
    const goForward = () => {
        if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1) }
        else setCalMonth(calMonth + 1)
    }

    const handleDateClick = (day, month, year) => {
        const clicked = new Date(year, month, day)
        if (!checkIn || (checkIn && checkOut)) {
            // First click or reset: set check-in
            setCheckIn(clicked)
            setCheckOut(null)
        } else {
            // Second click: set check-out (must be after check-in)
            if (clicked > checkIn) {
                setCheckOut(clicked)
            } else {
                // If clicked before/same as check-in, reset check-in
                setCheckIn(clicked)
                setCheckOut(null)
            }
        }
    }

    const isInRange = (day, month, year) => {
        if (!checkIn || !checkOut) return false
        const d = new Date(year, month, day)
        return d > checkIn && d < checkOut
    }

    const renderCalendar = (month, year) => {
        const daysInMonth = getDaysInMonth(year, month)
        const firstDay = getFirstDayOfMonth(year, month)
        const cells = []
        for (let i = 0; i < firstDay; i++) cells.push(<td key={`e-${i}`} />)
        for (let d = 1; d <= daysInMonth; d++) {
            const thisDate = new Date(year, month, d)
            const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
            const isPast = thisDate < todayStart
            const isCI = isSameDay(thisDate, checkIn)
            const isCO = isSameDay(thisDate, checkOut)
            const isRange = isInRange(d, month, year)
            cells.push(
                <td key={d} className="p-0 text-center">
                    <button
                        disabled={isPast}
                        onClick={() => handleDateClick(d, month, year)}
                        className={`w-9 h-9 rounded-full text-sm font-medium transition-all duration-150 cursor-pointer
                            ${isPast ? 'text-slate-300 cursor-not-allowed' : ''}
                            ${isCI ? 'bg-amber-500 text-white shadow-md' : ''}
                            ${isCO ? 'bg-emerald-500 text-white shadow-md' : ''}
                            ${isRange ? 'bg-amber-100 text-amber-700' : ''}
                            ${!isPast && !isCI && !isCO && !isRange ? 'text-slate-700 hover:bg-slate-100' : ''}
                        `}
                    >
                        {d}
                    </button>
                </td>
            )
        }
        const rows = []
        for (let i = 0; i < cells.length; i += 7) rows.push(<tr key={i}>{cells.slice(i, i + 7)}</tr>)
        return (
            <div>
                <div className="text-center font-semibold text-slate-700 mb-3 text-sm">
                    {MONTHS_VN[month]} {year}
                </div>
                <table className="w-full">
                    <thead>
                        <tr>{DAYS_VN.map(d => <th key={d} className="text-xs font-medium text-slate-400 pb-2 w-9">{d}</th>)}</tr>
                    </thead>
                    <tbody>{rows}</tbody>
                </table>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">

            {/* ===== HEADER ===== */}
            <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-slate-900 backdrop-blur-xl border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
                    <NavLink to="/" className="flex items-center gap-2 text-xl font-bold text-white tracking-tight">
                        <img src="Logo.png" alt="Logo" className="w-8 h-8 object-contain" />
                        <span>DaVinci<span className="text-amber-400">Resort</span></span>
                    </NavLink>

                    <nav className="hidden md:flex items-center gap-1">
                        {navLinks.map((link) => (
                            <NavLink
                                key={link.to}
                                to={link.to}
                                className={({ isActive }) =>
                                    `px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${isActive
                                        ? 'bg-white/15 text-amber-400'
                                        : 'text-white/80 hover:text-white hover:bg-white/10'
                                    }`
                                }
                            >
                                {link.label}
                            </NavLink>
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
                        onClick={() => setMobileOpen(!mobileOpen)}
                    >
                        {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>

                {mobileOpen && (
                    <div className="md:hidden absolute top-16 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-b border-white/10 shadow-lg">
                        <nav className="flex flex-col p-4 gap-1">
                            {navLinks.map((link) => (
                                <NavLink
                                    key={link.to}
                                    to={link.to}
                                    onClick={() => setMobileOpen(false)}
                                    className={({ isActive }) =>
                                        `px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive
                                            ? 'bg-white/15 text-amber-400'
                                            : 'text-white/80 hover:bg-white/10'
                                        }`
                                    }
                                >
                                    {link.label}
                                </NavLink>
                            ))}
                            <hr className="my-2 border-white/10" />
                            <button className="px-4 py-3 text-sm font-medium text-white/80 text-left hover:bg-white/10 rounded-lg cursor-pointer">
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
            <main className="flex-1 pt-16 flex flex-col">
                {/* Hero Section */}
                <section className="relative w-full flex-1 min-h-[calc(100vh-4rem)] flex items-center justify-center bg-[url('/bg_HomePage.jpg')] bg-cover bg-center bg-no-repeat">
                    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[1px]"></div>

                    <div className="relative z-10 flex flex-col items-center gap-6 px-4 max-w-4xl mx-auto text-center -mt-20">
                        <div className="flex flex-col gap-3">
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight drop-shadow-md">
                                Tìm kiếm <span className="text-amber-400">Khách sạn</span> hoàn hảo cho kỳ nghỉ của bạn
                            </h1>
                            <p className="text-lg font-medium text-slate-200 max-w-2xl mx-auto drop-shadow-md">
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

                        {/* Date & Guest Pickers */}
                        <div className="w-full max-w-2xl flex flex-col sm:flex-row gap-3">

                            {/* Date Picker Trigger */}
                            <div ref={dateRef} className="relative flex-1">
                                <button
                                    onClick={() => { setShowDatePicker(!showDatePicker); setShowGuestPicker(false) }}
                                    className="w-full flex items-center gap-4 bg-white/95 backdrop-blur-sm rounded-2xl px-5 py-4 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer text-left"
                                >
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className="flex items-center gap-3 flex-1 border-r border-slate-200 pr-4">
                                            <CalendarDays className="w-5 h-5 text-amber-500 shrink-0" />
                                            <div>
                                                <p className="text-sm font-semibold text-slate-800">{formatDate(checkIn)}</p>
                                                <p className="text-xs text-slate-400">{getDayName(checkIn)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 flex-1">
                                            <CalendarDays className="w-5 h-5 text-amber-500 shrink-0" />
                                            <div>
                                                <p className="text-sm font-semibold text-slate-800">{checkOut ? formatDate(checkOut) : 'Chọn ngày'}</p>
                                                <p className="text-xs text-slate-400">{checkOut ? getDayName(checkOut) : 'Check-out'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </button>

                                {/* Calendar Dropdown */}
                                {showDatePicker && (
                                    <div className="absolute top-full mt-3 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 z-50 w-[340px] max-w-[95vw]">
                                        <div className="flex items-center justify-between mb-2">
                                            <button onClick={goBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors cursor-pointer">
                                                <ChevronLeft className="w-5 h-5 text-slate-500" />
                                            </button>
                                            <span className="text-sm font-medium text-slate-500">
                                                {!checkIn || (checkIn && checkOut) ? 'Chọn ngày Check-in' : 'Chọn ngày Check-out'}
                                            </span>
                                            <button onClick={goForward} className="p-2 hover:bg-slate-100 rounded-full transition-colors cursor-pointer">
                                                <ChevronRight className="w-5 h-5 text-slate-500" />
                                            </button>
                                        </div>
                                        <div className="flex items-center justify-center gap-4 mb-4 text-xs">
                                            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span> Check-in</span>
                                            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span> Check-out</span>
                                        </div>
                                        {renderCalendar(calMonth, calYear)}
                                    </div>
                                )}
                            </div>

                            {/* Guest Picker Trigger */}
                            <div ref={guestRef} className="relative sm:w-56">
                                <button
                                    onClick={() => { setShowGuestPicker(!showGuestPicker); setShowDatePicker(false) }}
                                    className="w-full flex items-center gap-3 bg-white/95 backdrop-blur-sm rounded-2xl px-5 py-4 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer text-left"
                                >
                                    <Users className="w-5 h-5 text-amber-500 shrink-0" />
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-slate-800">{adults} người lớn</p>
                                        <p className="text-xs text-slate-400">{rooms} phòng{children > 0 ? ` · ${children} trẻ em` : ''}</p>
                                    </div>
                                    <ChevronLeft className="w-4 h-4 text-slate-400 rotate-[-90deg]" />
                                </button>

                                {/* Guest Dropdown */}
                                {showGuestPicker && (
                                    <div className="absolute top-full mt-3 right-0 bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 z-50 w-72">
                                        {[
                                            { label: 'Phòng', value: rooms, set: setRooms, min: 1, max: 10 },
                                            { label: 'Người lớn', sub: '18 tuổi trở lên', value: adults, set: setAdults, min: 1, max: 20 },
                                            { label: 'Trẻ em', sub: '0–17 tuổi', value: children, set: setChildren, min: 0, max: 10 },
                                        ].map((item) => (
                                            <div key={item.label} className="flex items-center justify-between py-4 border-b border-slate-100 last:border-0">
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-700">{item.label}</p>
                                                    {item.sub && <p className="text-xs text-slate-400">{item.sub}</p>}
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        onClick={() => item.set(Math.max(item.min, item.value - 1))}
                                                        className="w-8 h-8 flex items-center justify-center rounded-full border border-slate-300 text-slate-500 hover:border-amber-500 hover:text-amber-500 transition-colors cursor-pointer disabled:opacity-30"
                                                        disabled={item.value <= item.min}
                                                    >
                                                        <Minus className="w-4 h-4" />
                                                    </button>
                                                    <span className="w-6 text-center text-lg font-semibold text-amber-600">{item.value}</span>
                                                    <button
                                                        onClick={() => item.set(Math.min(item.max, item.value + 1))}
                                                        className="w-8 h-8 flex items-center justify-center rounded-full border border-slate-300 text-slate-500 hover:border-amber-500 hover:text-amber-500 transition-colors cursor-pointer disabled:opacity-30"
                                                        disabled={item.value >= item.max}
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
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
                                <img src="Logo.png" alt="Logo" className="w-8 h-8 object-contain drop-shadow-md" />
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

                        {/* Liên hệ 1 */}
                        <div>
                            <h4 className="text-white font-semibold mb-5 text-sm uppercase tracking-wider">Châu Âu</h4>
                            <ul className="flex flex-col gap-4">
                                <li className="flex items-center gap-3 text-sm">
                                    <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                                    <span>Santiago Bernabeu Hotel</span>
                                </li>
                                <li className="flex items-center gap-3 text-sm">
                                    <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                                    <span>Emirates Resort</span>
                                </li>
                                <li className="flex items-start gap-3 text-sm">
                                    <MapPin className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                                    <span>Stamford Bridge Motel</span>
                                </li>
                                <li className="flex items-start gap-3 text-sm">
                                    <MapPin className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                                    <span>Old Trafforf Pub</span>
                                </li>
                            </ul>
                        </div>

                        {/* Liên hệ 2 */}
                        <div>
                            <h4 className="text-white font-semibold mb-5 text-sm uppercase tracking-wider">Châu Á</h4>
                            <ul className="flex flex-col gap-4">
                                <li className="flex items-center gap-3 text-sm">
                                    <Church className="w-4 h-4 text-amber-400 shrink-0" />
                                    <span>Lâu đài Matsumoto</span>
                                </li>
                                <li className="flex items-center gap-3 text-sm">
                                    <Church className="w-4 h-4 text-amber-400 shrink-0" />
                                    <span>Cung Gyeongbok</span>
                                </li>
                                <li className="flex items-center gap-3 text-sm">
                                    <Church className="w-4 h-4 text-amber-400 shrink-0" />
                                    <span>Đền Taj Mahal</span>
                                </li>
                                <li className="flex items-center gap-3 text-sm">
                                    <Church className="w-4 h-4 text-amber-400 shrink-0" />
                                    <span>Chùa Bà Đen</span>
                                </li>
                            </ul>
                        </div>

                        {/* Liên hệ 3 */}
                        <div>
                            <h4 className="text-white font-semibold mb-5 text-sm uppercase tracking-wider">Liên hệ</h4>
                            <ul className="flex flex-col gap-4">
                                <li className="flex items-center gap-3 text-sm">
                                    <User className="w-4 h-4 text-amber-400 shrink-0" />
                                    <span>Phan Đình Phú</span>
                                </li>
                                <li className="flex items-center gap-3 text-sm">
                                    <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                                    <span>52300051@student.tdtu.edu.vn</span>
                                </li>
                                <li className="flex items-center gap-3 text-sm">
                                    <User className="w-4 h-4 text-amber-400 shrink-0" />
                                    <span>Ngô Xuân Quang</span>
                                </li>
                                <li className="flex items-center gap-3 text-sm">
                                    <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                                    <span>52300055@student.tdtu.edu.vn</span>
                                </li>
                                <li className="flex items-center gap-3 text-sm">
                                    <User className="w-4 h-4 text-amber-400 shrink-0" />
                                    <span>Trần Tuấn Kiệt</span>
                                </li>
                                <li className="flex items-center gap-3 text-sm">
                                    <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                                    <span>52300040@student.tdtu.edu.vn</span>
                                </li>
                                <li className="flex items-start gap-3 text-sm">
                                    <MapPin className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                                    <span>19 Nguyễn Hữu Thọ, Phường Tân Hưng, TP Hồ Chí Minh, Việt Nam</span>
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