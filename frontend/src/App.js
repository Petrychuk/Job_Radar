import "@/App.css";
import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import Home from "@/components/Home";
import Dashboard from "@/components/Dashboard";
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
          <Route path="/" element={
            user ? <Navigate to="/dashboard/tracker" /> : <Home onLogin={handleLogin} />
          } />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/dashboard" element={
            user ? <Dashboard user={user} onLogout={handleLogout} /> : <Navigate to="/" />
          } />
          <Route path="/dashboard/:section" element={
            user ? <Dashboard user={user} onLogout={handleLogout} /> : <Navigate to="/" />
          } />
        </Routes>
      </BrowserRouter>
      <Toaster position="bottom-right" theme="dark" />
    </div>
  );
}

export default App;
