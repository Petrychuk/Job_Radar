import { useNavigate } from "react-router-dom";
import { Radar, Brain, Globe, Table2, BarChart3, Download, ArrowRight, Zap, Search, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

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

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#02040a] text-white overflow-hidden">
      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center px-6">
        {/* Background glow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[600px] h-[600px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)' }} />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left - Text */}
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
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
                data-testid="launch-dashboard-btn"
                className="bg-primary hover:bg-primary/90 text-white px-8 py-6 text-base shadow-[0_0_25px_rgba(59,130,246,0.4)] border border-primary/50 transition-all hover:shadow-[0_0_35px_rgba(59,130,246,0.6)]"
                onClick={() => navigate('/dashboard')}
              >
                Launch Dashboard <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
              <Button
                data-testid="learn-more-btn"
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

          {/* Right - Radar */}
          <motion.div className="flex items-center justify-center" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1, delay: 0.3 }}>
            <div className="radar-container">
              <div className="radar-circle radar-circle-1" />
              <div className="radar-circle radar-circle-2" />
              <div className="radar-circle radar-circle-3" />
              <div className="radar-sweep" />
              {/* Dots representing job matches */}
              <div className="radar-dot" style={{ top: '20%', left: '60%', animationDelay: '0s' }} />
              <div className="radar-dot" style={{ top: '45%', left: '25%', animationDelay: '0.5s' }} />
              <div className="radar-dot" style={{ top: '70%', left: '65%', animationDelay: '1s' }} />
              <div className="radar-dot" style={{ top: '35%', left: '75%', animationDelay: '1.5s', background: '#3b82f6', boxShadow: '0 0 10px rgba(59,130,246,0.8)' }} />
              <div className="radar-dot" style={{ top: '55%', left: '45%', animationDelay: '0.8s', background: '#8b5cf6', boxShadow: '0 0 10px rgba(139,92,246,0.8)' }} />
              {/* Center */}
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
          <motion.h2
            className="text-2xl sm:text-3xl font-bold tracking-tight text-center mb-4"
            style={{ fontFamily: 'Chivo, sans-serif' }}
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          >
            COMMAND CENTER <span className="text-primary">FEATURES</span>
          </motion.h2>
          <p className="text-muted-foreground text-center mb-16 max-w-lg mx-auto">Everything you need to find your next role, fast.</p>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {features.map((f, i) => (
              <motion.div
                key={i}
                className={`glass-card rounded-xl p-6 ${f.span}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-bold text-base mb-2" style={{ fontFamily: 'Chivo, sans-serif' }}>{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-center mb-16" style={{ fontFamily: 'Chivo, sans-serif' }}>
            HOW IT <span className="text-secondary">WORKS</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                className="glass-card rounded-xl p-8 text-center relative"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
              >
                <div className="text-5xl font-black text-primary/10 absolute top-4 right-4" style={{ fontFamily: 'Chivo, sans-serif' }}>{step.num}</div>
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <step.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2" style={{ fontFamily: 'Chivo, sans-serif' }}>{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
            <h2 className="text-3xl sm:text-4xl font-black mb-6" style={{ fontFamily: 'Chivo, sans-serif' }}>
              READY TO <span className="text-primary">HUNT</span>?
            </h2>
            <p className="text-muted-foreground mb-8">Upload your resume and let the AI do the heavy lifting.</p>
            <Button
              data-testid="cta-launch-btn"
              className="bg-primary hover:bg-primary/90 text-white px-12 py-6 text-lg shadow-[0_0_30px_rgba(59,130,246,0.5)] border border-primary/50 transition-all hover:shadow-[0_0_50px_rgba(59,130,246,0.7)]"
              onClick={() => navigate('/dashboard/resume')}
            >
              Launch Job Radar <Radar className="ml-2 w-5 h-5" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center text-sm text-muted-foreground">
          <div style={{ fontFamily: 'JetBrains Mono, monospace' }}>JOB_RADAR v1.0</div>
          <div>AI-Powered Job Search Agent</div>
        </div>
      </footer>
    </div>
  );
}
