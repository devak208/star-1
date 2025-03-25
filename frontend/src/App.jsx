import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { UserProvider } from "./context/UserContext";
import { AdminProvider } from "./context/AdminContext";

// Layout Components
import Header from "./user/components/Header";
import Footer from "./user/components/Footer";

// User Pages
import Home from "./user/pages/Home";
import ProductList from "./user/pages/ProductList";
import ProductDetail from "./user/pages/ProductDetail";
import Login from "./user/pages/auth/login";
import Register from "./user/pages/auth/register";
import Profile from "./user/pages/Profile";
import Orders from "./user/pages/Orders";
import OrderDetail from "./user/pages/OrderDetail";
import Cart from "./user/pages/Cart";
import Checkout from "./user/pages/Checkout";
import OrderSuccess from "./user/pages/order-success";
import NotFound from "./user/pages/NotFound";

// Admin Pages
import Dashboard from "./admin/pages/Dashboard";
import ProductManager from "./admin/pages/ProductManager";
import AdminOrders from "./admin/pages/Orders";
import Users from "./admin/pages/Users";
import ProductFormPage from "./admin/pages/ProductFormPage";
import CategoryManager from "./admin/pages/CategoryManager";
import BannerManager from "./admin/pages/BannerManager";
import AdminOrderDetail from "./admin/pages/Orders/OrderDetail";
import UserDetails from "./admin/pages/Users/UserDetails";

// Auth Components
import ProtectedRoute from "./user/components/auth/ProtectedRoute";
import PublicRoute from "./user/components/auth/PublicRoute";
import AdminProfile from "./admin/pages/Profile";

export default function App() {
  return (
    <Router>
      <AdminProvider>
        <UserProvider>
          <Routes>
            {/* Public Auth Routes */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Header />
                  <Login />
                  <Footer />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <Header />
                  <Register />
                  <Footer />
                </PublicRoute>
              }
            />

            {/* Protected User Routes */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Header />
                  <Profile />
                  <Footer />
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders"
              element={
                <ProtectedRoute>
                  <Header />
                  <Orders />
                  <Footer />
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders/:id"
              element={
                <ProtectedRoute>
                  <Header />
                  <OrderDetail />
                  <Footer />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cart"
              element={
                <ProtectedRoute>
                  <Header />
                  <Cart />
                  <Footer />
                </ProtectedRoute>
              }
            />
            <Route
              path="/checkout"
              element={
                <ProtectedRoute>
                  <Header />
                  <Checkout />
                  <Footer />
                </ProtectedRoute>
              }
            />
            <Route
              path="/order-success"
              element={
                <ProtectedRoute>
                  <Header />
                  <OrderSuccess />
                  <Footer />
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route path="/admin">
              <Route
                index
                element={
                  <ProtectedRoute adminOnly={true}>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="dashboard"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="products"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <ProductManager />
                  </ProtectedRoute>
                }
              />
              <Route
                path="orders"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <AdminOrders />
                  </ProtectedRoute>
                }
              />
              <Route
                path="orders/:id"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <AdminOrderDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="users"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <Users />
                  </ProtectedRoute>
                }
              />
              <Route
                path="users/:id"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <UserDetails />
                  </ProtectedRoute>
                }
              />
              <Route
                path="product-form"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <ProductFormPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="categories"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <CategoryManager />
                  </ProtectedRoute>
                }
              />
              <Route
                path="banners"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <BannerManager />
                  </ProtectedRoute>
                }
              />
              <Route
                path="profile"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <AdminProfile />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Public User Routes */}
            <Route
              path="/"
              element={
                <>
                  <Header />
                  <Home />
                  <Footer />
                </>
              }
            />
            <Route
              path="/products"
              element={
                <>
                  <Header />
                  <ProductList />
                  <Footer />
                </>
              }
            />
            <Route
              path="/product/:id"
              element={
                <>
                  <Header />
                  <ProductDetail />
                  <Footer />
                </>
              }
            />

            {/* 404 Route */}
            <Route
              path="*"
              element={
                <>
                  <Header />
                  <NotFound />
                  <Footer />
                </>
              }
            />
          </Routes>
        </UserProvider>
      </AdminProvider>
    </Router>
  );
}
