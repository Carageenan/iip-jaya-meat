import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import { SettingsProvider } from './hooks/useSettings'
import { CartProvider } from './hooks/useCart'
import { ToastProvider } from './components/Toast'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Tentang from './pages/Tentang'
import Produk from './pages/Produk'
import Kontak from './pages/Kontak'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import NotFound from './pages/NotFound'
import Login from './pages/admin/Login'
import Dashboard from './pages/admin/Dashboard'
import Orders from './pages/admin/Orders'
import Kasir from './pages/admin/Kasir'
import StockLog from './pages/admin/StockLog'
import Recap from './pages/admin/Recap'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SettingsProvider>
          <CartProvider>
            <ToastProvider>
              <Routes>
                <Route element={<Layout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/tentang" element={<Tentang />} />
                  <Route path="/produk" element={<Produk />} />
                  <Route path="/kontak" element={<Kontak />} />
                  <Route path="/keranjang" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                </Route>

                <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="/admin/login" element={<Login />} />
                <Route
                  path="/admin/dashboard"
                  element={
                    <ProtectedRoute requireAdmin>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/orders"
                  element={
                    <ProtectedRoute>
                      <Orders />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/kasir"
                  element={
                    <ProtectedRoute>
                      <Kasir />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/riwayat-stok"
                  element={
                    <ProtectedRoute requireAdmin>
                      <StockLog />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/recap"
                  element={
                    <ProtectedRoute requireAdmin>
                      <Recap />
                    </ProtectedRoute>
                  }
                />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </ToastProvider>
          </CartProvider>
        </SettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
