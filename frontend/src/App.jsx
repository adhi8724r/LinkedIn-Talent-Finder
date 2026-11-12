import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import Hero from "./pages/hero.jsx";
import LoginRegisterPage from "./pages/login.jsx";
import ProtectedRoute from "./pages/ProtectedRoute.jsx";
import TabLayout from "./pages/TabLayout.jsx";
import ProfilePage from "./pages/profilepage.jsx";
import { AuthProvider } from "./pages/AuthContext.jsx";

function App() {
  useEffect(() => {
    fetch("http://localhost:8000/")
      .then((res) => res.json())
      .catch((err) => console.error("Fetch error:", err));
  }, []);

  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Hero />} />
          <Route path="/login" element={<LoginRegisterPage />} />

          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <TabLayout />
              </ProtectedRoute>
            }
          />

          {/* ✅ Optional: Redirect old "/input" path to new "/app" */}
          <Route path="/input" element={<Navigate to="/app" replace />} />

          <Route path="/profile/:id" element={<ProfilePage />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
