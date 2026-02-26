import "@/App.css";
import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import Landing from "@/components/Landing";
import Dashboard from "@/components/Dashboard";
import Auth from "@/components/Auth";
import ForgotPassword from "@/components/ForgotPassword";
import ResetPassword from "@/components/ResetPassword";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  if (loading) {
    return <div className="min-h-screen bg-[#02040a]" />;
  }

  return (
    <div className="App min-h-screen bg-[#02040a]">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={
            user ? <Navigate to="/dashboard/tracker" /> : <Auth onLogin={handleLogin} />
          } />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/dashboard" element={
            user ? <Dashboard user={user} onLogout={handleLogout} /> : <Navigate to="/auth" />
          } />
          <Route path="/dashboard/:section" element={
            user ? <Dashboard user={user} onLogout={handleLogout} /> : <Navigate to="/auth" />
          } />
        </Routes>
      </BrowserRouter>
      <Toaster position="bottom-right" theme="dark" />
    </div>
  );
}

export default App;
