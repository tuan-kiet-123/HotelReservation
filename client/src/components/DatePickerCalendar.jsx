import React, { useState, useRef, useEffect } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';

const DAYS_VN = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const MONTHS_VN = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];

const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year, month) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
};

const isSameDay = (a, b) => a && b && a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();

const formatDateShort = (date) => {
    if (!date) return 'Chọn ngày';
    return `${date.getDate()} thg ${date.getMonth() + 1}, ${date.getFullYear()}`;
};

/**
 * DatePickerCalendar - Lịch chọn ngày check-in/check-out tái sử dụng.
 * 
 * Props:
 *   checkIn      - Date object hoặc null
 *   checkOut     - Date object hoặc null
 *   onCheckInChange(date)  - callback khi check-in thay đổi
 *   onCheckOutChange(date) - callback khi check-out thay đổi
 *   variant      - 'light' (nền trắng, chữ đen) | 'dark' (nền tối, chữ trắng). Mặc định 'light'.
 *   compact      - true thì hiện dạng nhỏ gọn (1 dòng). Mặc định false.
 */
export default function DatePickerCalendar({ checkIn, checkOut, onCheckInChange, onCheckOutChange, variant = 'light', compact = false }) {
    const today = new Date();
    const [showPicker, setShowPicker] = useState(false);
    const [calMonth, setCalMonth] = useState((checkIn || today).getMonth());
    const [calYear, setCalYear] = useState((checkIn || today).getFullYear());
    const ref = useRef(null);

    // Đóng dropdown khi click ra ngoài
    useEffect(() => {
        const handleClick = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setShowPicker(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const goBack = () => {
        if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); }
        else setCalMonth(calMonth - 1);
    };
    const goForward = () => {
        if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); }
        else setCalMonth(calMonth + 1);
    };

    const handleDateClick = (day, month, year) => {
        const clicked = new Date(year, month, day);
        if (!checkIn || (checkIn && checkOut)) {
            onCheckInChange(clicked);
            onCheckOutChange(null);
        } else {
            if (clicked > checkIn) {
                onCheckOutChange(clicked);
            } else {
                onCheckInChange(clicked);
                onCheckOutChange(null);
            }
        }
    };

    const isInRange = (day, month, year) => {
        if (!checkIn || !checkOut) return false;
        const d = new Date(year, month, day);
        return d > checkIn && d < checkOut;
    };

    const renderCalendar = (month, year) => {
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);
        const cells = [];
        for (let i = 0; i < firstDay; i++) cells.push(<td key={`e-${i}`} />);
        for (let d = 1; d <= daysInMonth; d++) {
            const thisDate = new Date(year, month, d);
            const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const isPast = thisDate < todayStart;
            const isCI = isSameDay(thisDate, checkIn);
            const isCO = isSameDay(thisDate, checkOut);
            const isRange = isInRange(d, month, year);
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
            );
        }
        const rows = [];
        for (let i = 0; i < cells.length; i += 7) rows.push(<tr key={i}>{cells.slice(i, i + 7)}</tr>);
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
        );
    };

    const isDark = variant === 'dark';

    return (
        <div ref={ref} className="relative">
            {/* Nút trigger */}
            <button
                type="button"
                onClick={() => setShowPicker(!showPicker)}
                className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200 cursor-pointer text-left
                    ${isDark
                        ? 'bg-slate-800/80 border border-slate-600 hover:border-amber-500/50'
                        : 'bg-white border border-slate-200 hover:border-amber-400 shadow-sm hover:shadow-md'
                    }`}
            >
                <CalendarDays className={`w-5 h-5 shrink-0 ${isDark ? 'text-amber-400' : 'text-amber-500'}`} />
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>Check-in</p>
                        <p className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>
                            {formatDateShort(checkIn)}
                        </p>
                    </div>
                    <span className={`text-lg ${isDark ? 'text-slate-500' : 'text-slate-300'}`}>→</span>
                    <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>Check-out</p>
                        <p className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>
                            {formatDateShort(checkOut)}
                        </p>
                    </div>
                </div>
            </button>

            {/* Dropdown lịch */}
            {showPicker && (
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 z-50 w-[340px] max-w-[95vw]">
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
    );
}
