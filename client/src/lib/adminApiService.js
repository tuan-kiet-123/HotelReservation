import apiClient from './apiClient';

// ─── Admin Dashboard ────────────────────────────────────────────────
/**
 * Lấy chỉ số ADR & RevPAR theo quý.
 * @param {number} year
 * @param {number} quarter  1 | 2 | 3 | 4
 */
export async function fetchAdrRevpar(year, quarter) {
    const res = await apiClient.get('/mysql/reports/adr-revpar', {
        params: { year, quarter },
    });
    return res.data?.data ?? res.data;
}

/**
 * Lấy Top 3 phòng có doanh thu cao nhất trong quý.
 */
export async function fetchTop3Rooms(year, quarter) {
    const res = await apiClient.get('/mysql/reports/top3-rooms', {
        params: { year, quarter },
    });
    return res.data?.data ?? res.data ?? [];
}

/**
 * Lấy tỷ lệ hoàn tiền / doanh thu theo quý.
 */
export async function fetchQuarterlyRefundRatio(year, quarter) {
    const res = await apiClient.get('/mysql/reports/refund-ratio', {
        params: { year, quarter },
    });
    return res.data?.data ?? res.data ?? [];
}

/**
 * Lấy điểm đánh giá trung bình của hotel theo hotelId từ MongoDB.
 * @param {string} hotelId  MongoDB ObjectId của hotel
 */
export async function fetchAverageRating(hotelId) {
    if (!hotelId) return null;
    const res = await apiClient.get(`/mongo/hotels/${hotelId}/average-rating`);
    return res.data?.data ?? res.data;
}

/**
 * Lấy tất cả đánh giá từ hệ thống.
 */
export async function fetchAllReviews() {
    const res = await apiClient.get('/mongo/reviews');
    return res.data?.data ?? [];
}

/**
 * Lấy danh sách khách sạn từ MongoDB.
 */
export async function fetchHotels() {
    const res = await apiClient.get('/mongo/hotels');
    return res.data?.data ?? [];
}

/**
 * Lấy doanh thu hàng tháng.
 */
export async function fetchMonthlyRevenue(year) {
    const res = await apiClient.get('/mysql/reports/monthly-revenue', {
        params: { year },
    });
    return res.data?.data ?? [];
}

// ─── Financial Ledger ───────────────────────────────────────────────
/**
 * Lấy danh sách giao dịch từ sổ cái.
 * @param {Object} params  { startDate, endDate, eventType, page, pageSize }
 */
export async function fetchFinancialLedger(params = {}) {
    // Backend dùng 'eventType' và 'pageSize', không phải 'type' hay 'limit'
    const mapped = {
        ...(params.startDate && { startDate: params.startDate }),
        ...(params.endDate   && { endDate: params.endDate }),
        ...(params.eventType && { eventType: params.eventType }),
        ...(params.type      && { eventType: params.type }),  // map alias
        page:     params.page     || 1,
        pageSize: params.pageSize || params.limit || 20,
    };
    const res = await apiClient.get('/mysql/financial-ledgers', { params: mapped });
    return res.data?.data ?? res.data ?? {};
}

/**
 * Lấy danh sách nhật ký thay đổi giá.
 * @param {Object} params  { startDate, endDate, search, warningOnly, page, pageSize }
 */
export async function fetchPriceLogs(params = {}) {
    const mapped = {
        ...(params.startDate && { startDate: params.startDate }),
        ...(params.endDate   && { endDate: params.endDate }),
        ...(params.search && { search: params.search }),
        ...(typeof params.warningOnly !== 'undefined' && { warningOnly: params.warningOnly }),
        page:     params.page     || 1,
        pageSize: params.pageSize || params.limit || 10,
    };
    const res = await apiClient.get('/mysql/price-logs', { params: mapped });
    return res.data?.data ?? res.data ?? {};
}

// ─── Bookings ───────────────────────────────────────────────────────
/**
 * Lấy danh sách đặt phòng.
 * @param {Object} params  { hotelId, startDate, endDate, status, paid, search, page, pageSize }
 */
export async function fetchAdminBookings(params = {}) {
    const mapped = {
        ...(params.startDate && { startDate: params.startDate }),
        ...(params.endDate && { endDate: params.endDate }),
        ...(params.hotelId && { hotelId: params.hotelId }),
        ...(params.status && { status: params.status }),
        ...(typeof params.paid !== 'undefined' && { paid: params.paid }),
        page: params.page || 1,
        pageSize: params.pageSize || params.limit || 20,
        ...(params.search && { search: params.search })
    };
    const res = await apiClient.get('/mysql/bookings/admin', { params: mapped });
    return res.data?.data ?? res.data ?? {};
}
