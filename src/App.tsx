import React, { Suspense, lazy } from "react";
import type { ComponentType } from "react";
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

// Wrapper around lazy() that auto-reloads the page once on chunk load failure.
// This handles stale chunks after a new Vercel deployment.
function lazyWithRetry<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
) {
  return lazy(async () => {
    try {
      const module = await importFn();
      // Successful load — clear the reload flag for future navigations
      sessionStorage.removeItem("chunk-reload");
      return module;
    } catch (error) {
      const hasReloaded = sessionStorage.getItem("chunk-reload");
      if (!hasReloaded) {
        sessionStorage.setItem("chunk-reload", "true");
        window.location.reload();
        // Return a never-resolving promise while the page reloads
        return new Promise(() => {});
      }
      // Already tried reloading once — clear flag and re-throw
      sessionStorage.removeItem("chunk-reload");
      throw error;
    }
  });
}

// Lazy load pages with named exports
const Dashboard = lazyWithRetry(() =>
  import("@/pages/Dashboard").then((m) => ({ default: m.Dashboard })),
);
const Transactions = lazyWithRetry(() =>
  import("@/pages/Transactions").then((m) => ({ default: m.Transactions })),
);
const Accounts = lazyWithRetry(() =>
  import("@/pages/Accounts").then((m) => ({ default: m.Accounts })),
);
const Budgets = lazyWithRetry(() =>
  import("@/pages/Budgets").then((m) => ({ default: m.Budgets })),
);
const Reports = lazyWithRetry(() =>
  import("@/pages/Reports").then((m) => ({ default: m.Reports })),
);
const Categories = lazyWithRetry(() =>
  import("@/pages/Categories").then((m) => ({ default: m.Categories })),
);
const Login = lazyWithRetry(() => import("@/pages/Login"));

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
