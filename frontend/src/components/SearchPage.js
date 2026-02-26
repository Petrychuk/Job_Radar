import { useState } from "react";
import JobSearch from "@/components/JobSearch";
import FreelanceSearch from "@/components/FreelanceSearch";
import { Button } from "@/components/ui/button";
import { Briefcase, Users } from "lucide-react";

export default function SearchPage() {
  const [activeTab, setActiveTab] = useState("job_boards"); // job_boards or freelance

  return (
    <div>
      {/* Tabs */}
      <div className="mb-6 flex gap-2 border-b border-white/10 pb-2">
        <button
          onClick={() => setActiveTab("job_boards")}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-medium transition-all ${
            activeTab === "job_boards"
              ? "bg-primary/20 text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-white/5"
          }`}
        >
          <Briefcase className="w-4 h-4" />
          Job Boards
        </button>
        <button
          onClick={() => setActiveTab("freelance")}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-medium transition-all ${
            activeTab === "freelance"
              ? "bg-primary/20 text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-white/5"
          }`}
        >
          <Users className="w-4 h-4" />
          Freelance Platforms
        </button>
      </div>

      {/* Content */}
      {activeTab === "job_boards" ? <JobSearch /> : <FreelanceSearch />}
    </div>
  );
}
