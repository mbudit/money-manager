import React, { Suspense, lazy } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { Layout } from "@/components/Layout/AppLayout";
import { MoneyProvider } from "@/context/MoneyContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { UIProvider } from "@/context/UIContext";

// Lazy load pages with named exports
const Dashboard = lazy(() =>
  import("@/pages/Dashboard").then((m) => ({ default: m.Dashboard })),
);
const Transactions = lazy(() =>
  import("@/pages/Transactions").then((m) => ({ default: m.Transactions })),
);
const Accounts = lazy(() =>
  import("@/pages/Accounts").then((m) => ({ default: m.Accounts })),
);
const Budgets = lazy(() =>
  import("@/pages/Budgets").then((m) => ({ default: m.Budgets })),
);
const Reports = lazy(() =>
  import("@/pages/Reports").then((m) => ({ default: m.Reports })),
);
const Categories = lazy(() =>
  import("@/pages/Categories").then((m) => ({ default: m.Categories })),
);
const Login = lazy(() => import("@/pages/Login")); // Login is default export based on previous cat

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}


function App() {
  return (
    <AuthProvider>
      <MoneyProvider>
        <UIProvider>
          <Router>
            <Suspense
              fallback={
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              }
            >
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route
                  path="/"
                  element={
                    <RequireAuth>
                      <Layout />
                    </RequireAuth>
                  }
                >
                  <Route index element={<Dashboard />} />
                  <Route path="transactions" element={<Transactions />} />
                  <Route path="accounts" element={<Accounts />} />
                  <Route path="budgets" element={<Budgets />} />
                  <Route path="categories" element={<Categories />} />
                  <Route path="reports" element={<Reports />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              </Routes>
            </Suspense>
          </Router>
        </UIProvider>
      </MoneyProvider>
    </AuthProvider>
  );
}

export default App;
