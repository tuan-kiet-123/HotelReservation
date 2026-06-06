import axios from 'axios';
import toast from 'react-hot-toast';

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
    },
});

// Request Interceptor: Đính kèm JWT Token vào Header nếu có
apiClient.interceptors.request.use((config) => {
    try {
        const raw = localStorage.getItem('current_user');
        if (raw) {
            const user = JSON.parse(raw);
            if (user?.token) {
                config.headers.Authorization = `Bearer ${user.token}`;
            }
        }
    } catch (e) {
        console.error("Lỗi parse token", e);
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Response Interceptor: Catch all errors globally and fire a Toast
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;
        const message = error.response?.data?.message || error.message || 'Lỗi không xác định';

        if (status === 404) {
            toast.error(`Không tìm thấy dữ liệu.`);
        } else if (status >= 500) {
            toast.error(`Lỗi máy chủ (${status}). Vui lòng thử lại sau.`);
        } else if (error.code === 'ECONNABORTED') {
            toast.error('Kết nối quá hạn. Kiểm tra Backend đang chạy không.');
        } else if (!error.response) {
            toast.error('Không kết nối được với máy chủ.');
        } else {
            toast.error(message);
        }

        return Promise.reject(error);
    }
);

export default apiClient;
