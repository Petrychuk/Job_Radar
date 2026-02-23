import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { LogIn, UserPlus, Mail, Lock, User, Loader2, Radar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MatrixBackground from "@/components/MatrixBackground";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Auth({ onLogin }) {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", name: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error("Email and password are required");
      return;
    }
    if (!isLogin && !form.name) {
      toast.error("Name is required");
      return;
    }

    setLoading(true);
    try {
      const endpoint = isLogin ? "/auth/login" : "/auth/register";
      const payload = isLogin 
        ? { email: form.email, password: form.password }
        : { email: form.email, password: form.password, name: form.name };
      
      const res = await axios.post(`${API}${endpoint}`, payload);
      
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      
      toast.success(isLogin ? "Welcome back!" : "Account created successfully!");
      onLogin(res.data.user);
      navigate("/dashboard/tracker");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#02040a] flex items-center justify-center p-4 relative overflow-hidden">
      <MatrixBackground />
      
      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
            <Radar className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: 'Chivo, sans-serif' }}>
            JOB_<span className="text-primary">RADAR</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            {isLogin ? "Sign in to continue" : "Create your account"}
          </p>
        </div>

        {/* Form Card */}
        <div className="glass-card rounded-2xl p-6 border border-white/10 backdrop-blur-xl bg-black/50">
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    data-testid="auth-name"
                    type="text"
                    placeholder="Your name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="pl-10 bg-black/50 border-white/10 text-sm h-11"
                  />
                </div>
              </div>
            )}
            
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  data-testid="auth-email"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="pl-10 bg-black/50 border-white/10 text-sm h-11"
                />
              </div>
            </div>
            
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  data-testid="auth-password"
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="pl-10 bg-black/50 border-white/10 text-sm h-11"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-primary hover:bg-primary/90 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]"
              disabled={loading}
              data-testid="auth-submit"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isLogin ? (
                <>
                  <LogIn className="w-4 h-4 mr-2" /> Sign In
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" /> Create Account
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-white/5 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
              data-testid="auth-toggle"
            >
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <span className="text-primary font-medium">{isLogin ? "Sign up" : "Sign in"}</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground/50 mt-6">
          AI-powered job hunting for Australia
        </p>
      </div>
    </div>
  );
}
