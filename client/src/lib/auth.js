import React, { createContext, useContext, useEffect, useState } from "react";
import apiClient from "./apiClient";
import { toast } from "sonner";
import { fetchUsers } from "./api"; // still keeping this if needed elsewhere

const STORAGE_KEY = "current_user";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setCurrentUser(JSON.parse(raw));
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      if (currentUser) localStorage.setItem(STORAGE_KEY, JSON.stringify(currentUser));
      else localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      // ignore
    }
  }, [currentUser]);

  // Real login from backend
  async function login(email, password) {
    try {
      const res = await apiClient.post("/auth/login", { email, password });
      if (res.data.success) {
        setCurrentUser(res.data.data);
        return { success: true };
      }
      return { success: false, message: "Đăng nhập thất bại" };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || "Lỗi kết nối Server" 
      };
    }
  }

  // Real register from backend (Bước 1: Gửi yêu cầu đăng ký, nhận mã OTP)
  async function register(fullName, email, password) {
    try {
      const res = await apiClient.post("/auth/register", { fullName, email, password });
      if (res.data.success && res.data.requiresOtp) {
        return { success: true, requiresOtp: true, message: res.data.message };
      }
      return { success: false, message: "Đăng ký thất bại" };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || "Lỗi kết nối Server" 
      };
    }
  }

  // Xác thực OTP (Bước 2: Hoàn tất đăng ký)
  async function verifyOtp(fullName, email, password, otp) {
    try {
      const res = await apiClient.post("/auth/verify-otp", { fullName, email, password, otp });
      if (res.data.success) {
        setCurrentUser(res.data.data); // auto login after register
        return { success: true };
      }
      return { success: false, message: "Xác nhận OTP thất bại" };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || "Mã OTP không hợp lệ" 
      };
    }
  }

  async function forgotPassword(email) {
    try {
      const res = await apiClient.post("/auth/forgot-password", { email });
      return { success: true, message: res.data.message };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || "Lỗi gửi email" };
    }
  }

  async function resetPassword(email, otp, newPassword) {
    try {
      const res = await apiClient.post("/auth/reset-password", { email, otp, newPassword });
      return { success: true, message: res.data.message };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || "Lỗi đổi mật khẩu" };
    }
  }

  function logout() {
    setCurrentUser(null);
  }

  return React.createElement(
    AuthContext.Provider,
    { value: { currentUser, login, register, verifyOtp, forgotPassword, resetPassword, logout } },
    children
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
