import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import App from "@/App/App";
import DashboardLayout from "@/Dashboard/Dashboard";
import Templates from "@/Dashboard/Templates";
import Playground from "@/Dashboard/Playground";
import Renders from "./Dashboard/Renders";
import ApiDocs from "./Dashboard/ApiDocs";
import Pricing from "./Dashboard/Pricing";
import NotFound from "@/NotFound";
import SignupPage from "@/registration/SignupPage";
import LoginPage from "@/registration/LoginPage";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AlertProvider } from "@/context/AlertContext";
import GlobalAlert from "@/context/GlobalAlert";
import { AuthProvider } from "@/context/AuthContext";
import { AutomationModalProvider } from "@/context/AutomationModalContext"; // NEW

function SaaS() {
  return (
    <AlertProvider>
      <GlobalAlert />
      <Router>
        <AuthProvider>
          <AutomationModalProvider> {/* NEW - Wrap everything */}
            <Routes>
              <Route
                path="/editor/:id"
                element={
                  <ProtectedRoute>
                    <App />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="templates" element={<Templates />} />
                <Route path="playground" element={<Playground />} />
                <Route path="renders" element={<Renders />} />
                <Route path="api" element={<ApiDocs />} />
                <Route path="pricing" element={<Pricing />} />
              </Route>
              <Route path="/notfound" element={<NotFound />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/login" element={<LoginPage />} />
            </Routes>
          </AutomationModalProvider> {/* NEW */}
        </AuthProvider>
      </Router>
    </AlertProvider>
  );
}

export default SaaS;