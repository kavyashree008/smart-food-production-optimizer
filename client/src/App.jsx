import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useAuth } from "./context/AuthContext.jsx";
import { AppLayout } from "./components/layout/AppLayout.jsx";
import { Login } from "./pages/Auth/Login.jsx";
import { Register } from "./pages/Auth/Register.jsx";
import { DashboardPage } from "./pages/Dashboard/DashboardPage.jsx";
import { PlanningPage } from "./pages/Planning/PlanningPage.jsx";
import { DemandPage } from "./pages/Demand/DemandPage.jsx";
import { InventoryPage } from "./pages/Inventory/InventoryPage.jsx";
import { ProductionPage } from "./pages/Production/ProductionPage.jsx";
import { OrdersPage } from "./pages/Orders/OrdersPage.jsx";
import { SimulatorPage } from "./pages/Simulator/SimulatorPage.jsx";
import { AnalyticsPage } from "./pages/Analytics/AnalyticsPage.jsx";
import { AlertsPage } from "./pages/Alerts/AlertsPage.jsx";
import { SettingsPage } from "./pages/Settings/SettingsPage.jsx";

// Protected Route Guard
function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // Redirect staff directly to their dedicated production schedule
    if (user?.role === "staff") {
      return <Navigate to="/production" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
}

export function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            borderRadius: "1rem",
            background: "#1e293b",
            color: "#fff",
            fontSize: "12px",
            fontWeight: "500"
          }
        }}
      />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected App Shell */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route
            path="/"
            element={
              <ProtectedRoute allowedRoles={["admin", "manager"]}>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/planning"
            element={
              <ProtectedRoute allowedRoles={["admin", "manager"]}>
                <PlanningPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/demand"
            element={
              <ProtectedRoute allowedRoles={["admin", "manager"]}>
                <DemandPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inventory"
            element={
              <ProtectedRoute allowedRoles={["admin", "manager"]}>
                <InventoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/production"
            element={
              <ProtectedRoute allowedRoles={["admin", "manager", "staff"]}>
                <ProductionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute allowedRoles={["admin", "manager"]}>
                <OrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/simulator"
            element={
              <ProtectedRoute allowedRoles={["admin", "manager"]}>
                <SimulatorPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute allowedRoles={["admin", "manager"]}>
                <AnalyticsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/alerts"
            element={
              <ProtectedRoute allowedRoles={["admin", "manager", "staff"]}>
                <AlertsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
