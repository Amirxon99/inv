import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Suspense, lazy } from "react";
import AuthGate from "./components/authGate/AuthGate";
import UIApplay from "./components/common/displaySwitcher/UIApply";
import AxiosAuthBridge from "./components/authGate/AuthBridge";
import Users from "./pages/dashboard/users/Users";
const DashboardLayout = lazy(() => import("./layouts/DashboardLayout"));
const Login = lazy(() => import("./pages/auth/Login"));
const Home = lazy(() => import("./pages/dashboard/Home"));
const NotFound = lazy(() => import("./pages/notfound/NotFound"));
const Rooms = lazy(() => import("./pages/dashboard/rooms/Rooms"));
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Assets from "./pages/dashboard/assetsPage/Assets";
import Departments from "./pages/dashboard/departments/Departments";
import SingleAssetView from "./pages/dashboard/singleAssetView/SingleAssetView";
import AssetsMovements from "./pages/dashboard/assetsMovements/AssetsMovements";
import AssetCategories from "./pages/dashboard/assetCategories/AssetCategories";
import Inventory from "./pages/dashboard/inventory/Inventory";

function PrivateRoute({ children }) {
  const user = useSelector((s) => s.auth.user);
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
function App() {
  return (
    <Router>
      <AxiosAuthBridge>
        <UIApplay>
          <AuthGate>
            <Suspense fallback={<div>Loading...</div>}>
              <Routes>
                <Route path="/login" element={<Login />} />

                {/* 🔹 BU YERDA: Ochiq route - hamma ko'ra oladi */}
                <Route path="/assets/view/:qr_token" element={<SingleAssetView />} />

                <Route
                  path="/"
                  element={
                    <PrivateRoute>
                      <DashboardLayout />
                    </PrivateRoute>
                  }
                >
                  <Route index element={<Home />} />
                  <Route path="rooms" element={<Rooms />} />
                  <Route path="users" element={<Users />} />
                  <Route path="assets" element={<Assets />} />
                  <Route path="departments" element={<Departments />} />
                  {/* Bu yerdagi eski route-ni olib tashladik */}
                  <Route path="assets-movements" element={<AssetsMovements />} />
                  <Route path="asset-categories" element={<AssetCategories />} />
                  <Route path="inventory" element={<Inventory />} />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </AuthGate>
        </UIApplay>
      </AxiosAuthBridge>
      <ToastContainer position="top-right" autoClose={3000} />
    </Router>
  );
}

export default App;
