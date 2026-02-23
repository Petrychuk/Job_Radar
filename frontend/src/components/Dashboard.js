import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Upload, Search, Table2, BarChart3, Radar, Settings, ArrowLeft, Heart, Clock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import ResumeUpload from "@/components/ResumeUpload";
import JobSearch from "@/components/JobSearch";
import JobTracker from "@/components/JobTracker";
import Statistics from "@/components/Statistics";
import Wishlist from "@/components/Wishlist";
import CronJobs from "@/components/CronJobs";

const navItems = [
  { id: "resume", icon: Upload, label: "Resume" },
  { id: "search", icon: Search, label: "Job Search" },
  { id: "tracker", icon: Table2, label: "Tracker" },
  { id: "wishlist", icon: Heart, label: "Wishlist" },
  { id: "cron", icon: Clock, label: "Auto Search" },
  { id: "stats", icon: BarChart3, label: "Statistics" },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { section } = useParams();
  const [activeSection, setActiveSection] = useState(section || "tracker");

  const handleNav = (id) => {
    setActiveSection(id);
    navigate(`/dashboard/${id}`, { replace: true });
  };

  const renderContent = () => {
    switch (activeSection) {
      case "resume": return <ResumeUpload />;
      case "search": return <JobSearch />;
      case "tracker": return <JobTracker />;
      case "stats": return <Statistics />;
      default: return <JobTracker />;
    }
  };

  return (
    <div className="min-h-screen bg-[#02040a] flex">
      {/* Sidebar */}
      <aside className="w-16 border-r border-white/5 flex flex-col items-center py-4 bg-[#09090b]/80 backdrop-blur-xl shrink-0">
        <button
          data-testid="sidebar-home-btn"
          className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-6 hover:bg-primary/20 transition-colors"
          onClick={() => navigate('/')}
        >
          <Radar className="w-5 h-5 text-primary" />
        </button>

        <TooltipProvider delayDuration={100}>
          <nav className="flex flex-col gap-2">
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
                    <item.icon className="w-5 h-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-[#18181b] border-white/10 text-white">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            ))}
          </nav>
        </TooltipProvider>

        <div className="mt-auto">
          <button
            data-testid="sidebar-back-btn"
            className="w-10 h-10 rounded-lg text-muted-foreground hover:text-white hover:bg-white/5 flex items-center justify-center transition-colors"
            onClick={() => navigate('/')}
          >
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
  );
}
