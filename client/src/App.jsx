import { Toaster } from 'sonner';
import { BrowserRouter, Routes, Route } from 'react-router';
import HomePage from "./pages/HomePage";
import NotFound from "./pages/NotFound";
import HotelDetailPage from "./pages/HotelDetailPage";
import CheckoutPaymentPage from "./pages/CheckoutPaymentPage";
import MyBookingsPage from "./pages/MyBookingsPage";
import ReviewOverlayPage from "./pages/ReviewOverlayPage";
import SearchPage from "./pages/SearchPage";

// Admin Routes
import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminFinancialLedger from "./pages/admin/AdminFinancialLedger";
import AdminBookings from "./pages/admin/AdminBookings";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminPriceLogs from "./pages/admin/AdminPriceLogs";
import AdminLogin from "./pages/admin/AdminLogin";

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/hotels" element={<SearchPage />} />
          <Route path="/hotels/:hotelId" element={<HotelDetailPage />} />
          <Route path="/checkout" element={<CheckoutPaymentPage />} />
          <Route path="/my-bookings" element={<MyBookingsPage />} />
          <Route path="/reviews/new" element={<ReviewOverlayPage />} />
          
          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="ledger" element={<AdminFinancialLedger />} />
            <Route path="bookings" element={<AdminBookings />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="price-logs" element={<AdminPriceLogs />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      <Toaster richColors position="top-right" />
    </>
  )
}

export default App
