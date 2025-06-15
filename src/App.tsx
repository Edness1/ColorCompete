import { Suspense, lazy } from "react";
import { useRoutes, Routes, Route } from "react-router-dom";
import Home from "./components/home";
import GalleryView from "./components/GalleryView";
import UserProfile from "./components/UserProfile";
import Leaderboard from "./components/Leaderboard";
import Pricing from "./components/Pricing";
import About from "./components/About";
import PaymentSuccess from "./components/PaymentSuccess";
import PaymentCancel from "./components/PaymentCancel";
import { Toaster } from "./components/ui/toaster";
import { AuthProvider } from "./contexts/AuthContext";
import { SubscriptionProvider } from "./contexts/SubscriptionContext";
import AdminRoute from "./components/admin/AdminRoute";
import routes from "tempo-routes";

// Lazy load admin components
const AdminDashboard = lazy(() => import("./components/admin/AdminDashboard"));

function App() {
  return (
    <AuthProvider>
      <SubscriptionProvider>
        <Suspense fallback={<p>Loading...</p>}>
          <>
            <Toaster />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/gallery" element={<GalleryView />} />
              <Route path="/profile" element={<UserProfile />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/about" element={<About />} />
              <Route path="/payment-success" element={<PaymentSuccess />} />
              <Route path="/payment-cancel" element={<PaymentCancel />} />

              {/* Admin routes */}
              <Route path="/admin" element={<AdminRoute />}>
                <Route index element={<AdminDashboard />} />
              </Route>

              {import.meta.env.VITE_TEMPO === "true" && (
                <Route path="/tempobook/*" />
              )}
            </Routes>
            {import.meta.env.VITE_TEMPO === "true" && useRoutes(routes)}
          </>
        </Suspense>
      </SubscriptionProvider>
    </AuthProvider>
  );
}

export default App;
