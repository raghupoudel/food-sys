import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Foods from "./pages/Foods";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import OrderDetails from "./pages/OrderDetails";

import AdminFoods from "./pages/AdminFoods";
import AdminOrders from "./pages/AdminOrders";
import AdminCategories from "./pages/AdminCategories";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default */}
        <Route
          path="/"
          element={<Navigate to="/foods" replace />}
        />

        {/* Authentication */}
        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        {/* Customer Routes */}
        <Route
          path="/foods"
          element={<Foods />}
        />

        <Route
          path="/cart"
          element={<Cart />}
        />

        <Route
          path="/checkout"
          element={<Checkout />}
        />

        <Route
          path="/orders"
          element={<Orders />}
        />

        <Route
          path="/orders/:id"
          element={<OrderDetails />}
        />

        {/* Admin Routes */}
        <Route
          path="/admin/foods"
          element={<AdminFoods />}
        />

        <Route
          path="/admin/categories"
          element={<AdminCategories />}
        />

        <Route
          path="/admin/orders"
          element={<AdminOrders />}
        />

        {/* Unknown route */}
        <Route
          path="*"
          element={<Navigate to="/foods" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;