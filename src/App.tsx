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
import RequireAuth from "./components/auth/RequireAuth";
import Rewards from "./components/Rewards";
import FAQ from "./components/FAQ";
import Contact from "./components/Contact";
import Terms from "./components/Terms";
import Privacy from "./components/Privacy";
import ForgotPassword from "./components/auth/ForgotPassword";
import ResetPassword from "./components/auth/ResetPassword";
import VerifyEmail from "./components/VerifyEmail";
import ResendVerification from "./components/ResendVerification";
import BillingHistory from "./components/BillingHistory";

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
              {/* Protect the profile route */}
              <Route
                path="/profile"
                element={
                  <RequireAuth>
                    <UserProfile />
                  </RequireAuth>
                }
              />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/rewards" element={<Rewards />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/about" element={<About />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/payment-success" element={<PaymentSuccess />} />
              <Route path="/payment-cancel" element={<PaymentCancel />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
              <Route path="/verify-email/:token" element={<VerifyEmail />} />
              <Route path="/resend-verification" element={<ResendVerification />} />
              <Route path="/billing-history" element={<BillingHistory />} />

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
