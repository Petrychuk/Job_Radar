import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Radar, Brain, Globe, Table2, BarChart3, Download, ArrowRight, Zap, Search, FileText, LogIn, UserPlus, Mail, Lock, User, Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";

const API = process.env.REACT_APP_BACKEND_URL;

const features = [
  { icon: Brain, title: "AI Resume Analysis", desc: "Upload your CV and get instant skill extraction, keyword matching, and career recommendations.", span: "md:col-span-4" },
  { icon: Globe, title: "20+ Job Sites Monitored", desc: "Seek, LinkedIn, Indeed, Adzuna, CareerOne, and more Australian job boards scanned simultaneously.", span: "md:col-span-4" },
  { icon: Search, title: "Smart Matching", desc: "AI finds both direct-match and adjacent roles you might not have considered.", span: "md:col-span-4" },
  { icon: Table2, title: "Application Tracker", desc: "Track every application with status, dates, contacts, and notes - like your spreadsheet, but smarter.", span: "md:col-span-6" },
  { icon: BarChart3, title: "Analytics Dashboard", desc: "Visualize your progress with charts showing response rates, top sources, and application trends.", span: "md:col-span-3" },
  { icon: Download, title: "Excel Export", desc: "Download your tracker as a formatted .xlsx file anytime.", span: "md:col-span-3" },
];

const steps = [
  { num: "01", title: "Upload Resume", desc: "Drop your PDF or DOCX file", icon: FileText },
  { num: "02", title: "AI Scans Market", desc: "Agent searches 20+ job sites", icon: Radar },
  { num: "03", title: "Get Matches", desc: "Review, track, and apply", icon: Zap },
];

export default function Home({ onLogin }) {
  const navigate = useNavigate();
  const [showAuth, setShowAuth] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", name: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password || (!isLogin && !form.name)) {
      toast.error("Fill all fields");
      return;
    }
    setLoading(true);
    try {
      const endpoint = isLogin ? "/auth/login" : "/auth/register";
      const res = await axios.post(`${API}${endpoint}`, form);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      onLogin(res.data.user);
      toast.success(isLogin ? "Welcome back!" : "Account created!");
      navigate("/dashboard/tracker");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#02040a] text-white overflow-hidden">
      {/* Hero with Auth */}
      <section className="relative min-h-screen flex items-center justify-center px-6 py-12">
        {/* Background glow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[600px] h-[600px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)' }} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left - Landing Content */}
          {!showAuth ? (
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} className="lg:col-span-1">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-sm font-medium mb-6">
                <Zap className="w-3.5 h-3.5" />
                AI-Powered Job Search
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] mb-6" style={{ fontFamily: 'Chivo, sans-serif' }}>
                JOB<span className="text-primary"> RADAR</span>
                <span className="block text-lg sm:text-xl lg:text-2xl font-normal text-muted-foreground mt-3" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Find your next role with AI precision
                </span>
              </h1>
              <p className="text-muted-foreground text-base max-w-md mb-8 leading-relaxed">
                Upload your resume. Our AI agent scans 20+ Australian job sites, finds matching vacancies, and helps you track every application — all in one command center.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button
                  className="bg-primary hover:bg-primary/90 text-white px-8 py-6 text-base shadow-[0_0_25px_rgba(59,130,246,0.4)] border border-primary/50 transition-all hover:shadow-[0_0_35px_rgba(59,130,246,0.6)]"
                  onClick={() => setShowAuth(true)}
                >
                  Get Started <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  className="px-8 py-6 text-base border-white/10 hover:border-primary/50 hover:text-primary bg-transparent"
                  onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Learn More
                </Button>
              </div>

              {/* Stats */}
              <div className="flex gap-8 mt-12" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                {[{ val: "20+", label: "Job Sites" }, { val: "AI", label: "Powered" }, { val: ".XLSX", label: "Export" }].map((s, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.15 }}>
                    <div className="text-2xl font-bold text-primary">{s.val}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">{s.label}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ) : (
            /* Auth Form */
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="lg:col-span-1">
              <div className="glass-card rounded-2xl p-8 border border-white/10 backdrop-blur-xl bg-black/50 max-w-md">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Chivo, sans-serif' }}>
                    {isLogin ? "Welcome Back" : "Create Account"}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {isLogin ? "Sign in to continue your job search" : "Start finding your dream job today"}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {!isLogin && (
                    <div>
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder="John Doe"
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
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        className="pl-10 pr-10 bg-black/50 border-white/10 text-sm h-11"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {isLogin && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => navigate("/forgot-password")}
                        className="text-xs text-primary hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-11 bg-primary hover:bg-primary/90 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        {isLogin ? <LogIn className="w-4 h-4 mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
                        {isLogin ? "Sign In" : "Create Account"}
                      </>
                    )}
                  </Button>
                </form>

                <div className="mt-6 pt-4 border-t border-white/5 text-center">
                  <p className="text-sm text-muted-foreground">
                    {isLogin ? "Don't have an account?" : "Already have an account?"}
                    <button
                      onClick={() => setIsLogin(!isLogin)}
                      className="text-primary hover:underline ml-2 font-medium"
                    >
                      {isLogin ? "Sign Up" : "Sign In"}
                    </button>
                  </p>
                </div>

                <button
                  onClick={() => setShowAuth(false)}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors mt-4 block mx-auto"
                >
                  ← Back to home
                </button>
              </div>
            </motion.div>
          )}

          {/* Right - Radar Visualization */}
          <motion.div 
            className="flex items-center justify-center lg:col-span-1" 
            initial={{ opacity: 0, scale: 0.8 }} 
            animate={{ opacity: 1, scale: 1 }} 
            transition={{ duration: 1, delay: 0.3 }}
          >
            <div className="radar-container">
              <div className="radar-circle radar-circle-1" />
              <div className="radar-circle radar-circle-2" />
              <div className="radar-circle radar-circle-3" />
              <div className="radar-sweep" />
              <div className="radar-dot" style={{ top: '20%', left: '60%', animationDelay: '0s' }} />
              <div className="radar-dot" style={{ top: '45%', left: '25%', animationDelay: '0.5s' }} />
              <div className="radar-dot" style={{ top: '70%', left: '65%', animationDelay: '1s' }} />
              <div className="radar-dot" style={{ top: '35%', left: '75%', animationDelay: '1.5s', background: '#3b82f6', boxShadow: '0 0 10px rgba(59,130,246,0.8)' }} />
              <div className="radar-dot" style={{ top: '55%', left: '45%', animationDelay: '0.8s', background: '#8b5cf6', boxShadow: '0 0 10px rgba(139,92,246,0.8)' }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-primary shadow-[0_0_20px_rgba(59,130,246,0.8)]" />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div className="text-center mb-16" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: 'Chivo, sans-serif' }}>
              Everything you need to land <span className="text-primary">the job</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Automated scanning, AI matching, and organized tracking in one platform</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {features.map((f, i) => (
              <motion.div
                key={i}
                className={`glass-card rounded-2xl p-6 border border-white/5 hover:border-primary/30 transition-all group ${f.span}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <f.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2 text-sm" style={{ fontFamily: 'Chivo, sans-serif' }}>{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div className="text-center mb-16" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: 'Chivo, sans-serif' }}>
              How it <span className="text-primary">works</span>
            </h2>
            <p className="text-muted-foreground">Three simple steps to start your job search</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                className="relative text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
              >
                <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-6">
                  <step.icon className="w-10 h-10 text-primary" />
                </div>
                <div className="text-4xl font-bold text-primary/20 mb-2" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{step.num}</div>
                <h3 className="font-bold mb-2" style={{ fontFamily: 'Chivo, sans-serif' }}>{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary/50 to-transparent" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            className="glass-card rounded-3xl p-12 border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: 'Chivo, sans-serif' }}>
              Ready to find your <span className="text-primary">dream job</span>?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Join thousands of job seekers using AI to accelerate their search
            </p>
            <Button
              className="bg-primary hover:bg-primary/90 text-white px-10 py-6 text-base shadow-[0_0_30px_rgba(59,130,246,0.5)]"
              onClick={() => setShowAuth(true)}
            >
              Start Free Today <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-8 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto text-center text-sm text-muted-foreground">
          <p>© 2026 Job Radar. AI-powered job hunting for Australia.</p>
        </div>
      </footer>
    </div>
  );
}
