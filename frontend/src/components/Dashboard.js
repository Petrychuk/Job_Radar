import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Upload, Search, Table2, BarChart3, Radar, ArrowLeft, Heart, Clock, TrendingUp, FileText, LogOut, Settings, User } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import ResumeUpload from "@/components/ResumeUpload";
import JobSearch from "@/components/JobSearch";
import JobTracker from "@/components/JobTracker";
import Statistics from "@/components/Statistics";
import Wishlist from "@/components/Wishlist";
import CronJobs from "@/components/CronJobs";
import MarketIntelligence from "@/components/MarketIntelligence";
import CVProfiles from "@/components/CVProfiles";
import UserSettings from "@/components/UserSettings";
import MatrixBackground from "@/components/MatrixBackground";

const navItems = [
  { id: "resume", icon: Upload, label: "Resume" },
  { id: "profiles", icon: FileText, label: "CV Profiles" },
  { id: "search", icon: Search, label: "Job Search" },
  { id: "tracker", icon: Table2, label: "Tracker" },
  { id: "wishlist", icon: Heart, label: "Wishlist" },
  { id: "cron", icon: Clock, label: "Auto Search" },
  { id: "market", icon: TrendingUp, label: "Market Intel" },
  { id: "stats", icon: BarChart3, label: "Statistics" },
];

export default function Dashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const { section } = useParams();
  const [activeSection, setActiveSection] = useState(section || "tracker");

  useEffect(() => {
    if (section && section !== activeSection) {
      setActiveSection(section);
    }
  }, [section]);

  const handleNav = (id) => {
    setActiveSection(id);
    navigate(`/dashboard/${id}`, { replace: true });
  };

  const renderContent = () => {
    switch (activeSection) {
      case "resume": return <ResumeUpload />;
      case "profiles": return <CVProfiles />;
      case "search": return <JobSearch />;
      case "tracker": return <JobTracker />;
      case "wishlist": return <Wishlist />;
      case "cron": return <CronJobs user={user} />;
      case "market": return <MarketIntelligence />;
      case "stats": return <Statistics />;
      case "settings": return <UserSettings user={user} />;
      default: return <JobTracker />;
    }
  };

  return (
    <div className="min-h-screen bg-[#02040a] flex flex-col relative">
      <MatrixBackground />
      
      <div className="flex flex-1 relative z-10">
        {/* Sidebar */}
        <aside className="w-16 border-r border-white/5 flex flex-col items-center py-4 bg-[#09090b]/90 backdrop-blur-xl shrink-0">
          <button data-testid="sidebar-home-btn" className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 hover:bg-primary/20 transition-colors" onClick={() => navigate('/')}>
            <Radar className="w-5 h-5 text-primary" />
          </button>

          <TooltipProvider delayDuration={100}>
            <nav className="flex flex-col gap-1.5">
              {navItems.map((item) => (
                <Tooltip key={item.id}>
                  <TooltipTrigger asChild>
                    <button
                      data-testid={`nav-${item.id}-btn`}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                        activeSection === item.id
                          ? "bg-primary/20 text-primary shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                          : "text-muted-foreground hover:text-white hover:bg-white/5"
                      }`}
                      onClick={() => handleNav(item.id)}
                    >
                      <item.icon className="w-4.5 h-4.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-[#18181b] border-white/10 text-white">{item.label}</TooltipContent>
                </Tooltip>
              ))}
            </nav>
          </TooltipProvider>

          <div className="mt-auto flex flex-col gap-1.5">
            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button data-testid="user-menu-btn" className="w-10 h-10 rounded-lg bg-secondary/10 text-secondary hover:bg-secondary/20 flex items-center justify-center transition-colors">
                  <User className="w-4.5 h-4.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" className="bg-[#18181b] border-white/10 text-white w-48">
                <div className="px-2 py-1.5 text-xs text-muted-foreground">{user?.email}</div>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem className="cursor-pointer" onClick={() => handleNav("settings")}>
                  <Settings className="w-4 h-4 mr-2" /> Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem className="cursor-pointer text-destructive" onClick={onLogout}>
                  <LogOut className="w-4 h-4 mr-2" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <button data-testid="sidebar-back-btn" className="w-10 h-10 rounded-lg text-muted-foreground hover:text-white hover:bg-white/5 flex items-center justify-center transition-colors" onClick={() => navigate('/')}>
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-6 max-w-[1400px] mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 py-3 px-6 bg-[#09090b]/80 relative z-10" data-testid="dashboard-footer">
        <div className="max-w-[1400px] mx-auto flex flex-wrap justify-between items-center gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-4 font-mono-data">
            <span>JOB_RADAR <span className="text-primary">v2.0</span></span>
            <span className="hidden sm:inline">FastAPI + React + MongoDB</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline">Self-hostable</span>
            <span>AI: Gemini 2.5 Flash</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
