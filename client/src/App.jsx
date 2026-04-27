import { Toaster } from 'sonner';
import { BrowserRouter, Routes, Route } from 'react-router';
import HomePage from "./pages/HomePage";
import NotFound from "./pages/NotFound";
import HotelDetailPage from "./pages/HotelDetailPage";
import CheckoutPaymentPage from "./pages/CheckoutPaymentPage";
import MyBookingsPage from "./pages/MyBookingsPage";
import ReviewOverlayPage from "./pages/ReviewOverlayPage";


function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/hotels/:hotelId" element={<HotelDetailPage />} />
          <Route path="/checkout" element={<CheckoutPaymentPage />} />
          <Route path="/my-bookings" element={<MyBookingsPage />} />
          <Route path="/reviews/new" element={<ReviewOverlayPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      <Toaster richColors position="top-right" />
    </>
  )
}

export default App
