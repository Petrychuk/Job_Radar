import { useState } from "react";
import { ExternalLink, Search, Briefcase, Clock, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const FREELANCE_PLATFORMS = [
  { 
    id: "upwork", 
    name: "Upwork", 
    icon: "💼",
    url: "https://www.upwork.com", 
    searchUrl: "https://www.upwork.com/nx/search/jobs/?q={keyword}&sort=recency",
    filters: ["posted_time", "duration", "budget", "experience"]
  },
  { 
    id: "freelancer", 
    name: "Freelancer", 
    icon: "🎯",
    url: "https://www.freelancer.com", 
    searchUrl: "https://www.freelancer.com/jobs/{keyword}/"
  },
  { 
    id: "fiverr", 
    name: "Fiverr", 
    icon: "🟢",
    url: "https://www.fiverr.com", 
    searchUrl: "https://www.fiverr.com/search/gigs?query={keyword}&source=top-bar"
  },
  { 
    id: "toptal", 
    name: "Toptal", 
    icon: "⭐",
    url: "https://www.toptal.com", 
    searchUrl: "https://www.toptal.com/developers"
  },
  { 
    id: "guru", 
    name: "Guru", 
    icon: "🔷",
    url: "https://www.guru.com", 
    searchUrl: "https://www.guru.com/d/jobs/{keyword}/"
  },
  { 
    id: "peopleperhour", 
    name: "PeoplePerHour", 
    icon: "⏰",
    url: "https://www.peopleperhour.com", 
    searchUrl: "https://www.peopleperhour.com/freelance-jobs?q={keyword}"
  },
];

const TIME_FILTERS = [
  { label: "Last 24h", value: "24h" },
  { label: "Last 3 days", value: "3d" },
  { label: "Last Week", value: "1w" },
  { label: "Last Month", value: "1m" },
];

const DURATION_FILTERS = [
  { label: "Short-term", value: "short" },
  { label: "Long-term", value: "long" },
  { label: "Any", value: "any" },
];

const BUDGET_FILTERS = [
  { label: "$0-$500", value: "0-500" },
  { label: "$500-$1500", value: "500-1500" },
  { label: "$1500-$5000", value: "1500-5000" },
  { label: "$5000+", value: "5000+" },
];

const EXPERIENCE_FILTERS = [
  { label: "Entry", value: "entry" },
  { label: "Intermediate", value: "intermediate" },
  { label: "Expert", value: "expert" },
];

export default function FreelanceSearch() {
  const [keyword, setKeyword] = useState("web development");
  const [selectedTime, setSelectedTime] = useState("1w");
  const [selectedDuration, setSelectedDuration] = useState("any");
  const [selectedBudget, setSelectedBudget] = useState("");
  const [selectedExperience, setSelectedExperience] = useState("");

  const buildSearchUrl = (platform) => {
    let url = platform.searchUrl.replace('{keyword}', encodeURIComponent(keyword));
    
    // Add filters for Upwork (most advanced filtering)
    if (platform.id === "upwork") {
      const params = [];
      
      // Time filter
      if (selectedTime) {
        const timeMap = {
          "24h": "posted_time=1",
          "3d": "posted_time=3",
          "1w": "posted_time=7",
          "1m": "posted_time=30"
        };
        if (timeMap[selectedTime]) params.push(timeMap[selectedTime]);
      }
      
      // Duration
      if (selectedDuration && selectedDuration !== "any") {
        params.push(`duration=${selectedDuration === "short" ? "weeks" : "months"}`);
      }
      
      // Experience
      if (selectedExperience) {
        params.push(`contractor_tier=${selectedExperience}`);
      }
      
      if (params.length > 0) {
        url += (url.includes('?') ? '&' : '?') + params.join('&');
      }
    }
    
    return url;
  };

  const handleSearch = (platform) => {
    const searchUrl = buildSearchUrl(platform);
    window.open(searchUrl, '_blank');
  };

  const handleSearchAll = () => {
    FREELANCE_PLATFORMS.forEach(platform => {
      setTimeout(() => handleSearch(platform), 100);
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight mb-1" style={{ fontFamily: 'Chivo, sans-serif' }}>
          FREELANCE <span className="text-primary">SEARCH</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          Search across top freelance platforms with smart filters
        </p>
      </div>

      {/* Search Input */}
      <div className="glass-card rounded-xl p-6 border border-white/10">
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="e.g. web development, logo design, data entry..."
              className="pl-10 bg-black/50 border-white/10"
            />
          </div>
          <Button
            onClick={handleSearchAll}
            className="bg-primary hover:bg-primary/90 px-6"
          >
            <Search className="w-4 h-4 mr-2" />
            Search All
          </Button>
        </div>

        {/* Filters */}
        <div className="space-y-4">
          {/* Time Posted */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-primary" />
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Posted Time
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              {TIME_FILTERS.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setSelectedTime(filter.value)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    selectedTime === filter.value
                      ? 'bg-primary/20 text-primary border border-primary/40'
                      : 'bg-white/[0.02] text-muted-foreground border border-white/5 hover:border-white/15'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Briefcase className="w-4 h-4 text-primary" />
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Project Duration
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              {DURATION_FILTERS.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setSelectedDuration(filter.value)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    selectedDuration === filter.value
                      ? 'bg-primary/20 text-primary border border-primary/40'
                      : 'bg-white/[0.02] text-muted-foreground border border-white/5 hover:border-white/15'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Budget */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-primary" />
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Budget Range
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              {BUDGET_FILTERS.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setSelectedBudget(filter.value)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    selectedBudget === filter.value
                      ? 'bg-primary/20 text-primary border border-primary/40'
                      : 'bg-white/[0.02] text-muted-foreground border border-white/5 hover:border-white/15'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Experience Level */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
              Experience Level
            </label>
            <div className="flex flex-wrap gap-2">
              {EXPERIENCE_FILTERS.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setSelectedExperience(filter.value)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    selectedExperience === filter.value
                      ? 'bg-primary/20 text-primary border border-primary/40'
                      : 'bg-white/[0.02] text-muted-foreground border border-white/5 hover:border-white/15'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Platforms Grid */}
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Freelance Platforms
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FREELANCE_PLATFORMS.map((platform) => (
            <div
              key={platform.id}
              className="glass-card rounded-xl p-4 border border-white/5 hover:border-primary/30 transition-all group cursor-pointer"
              onClick={() => handleSearch(platform)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{platform.icon}</div>
                  <div>
                    <h4 className="font-semibold text-sm">{platform.name}</h4>
                    <p className="text-xs text-muted-foreground">Click to search</p>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              
              {platform.filters && (
                <div className="flex flex-wrap gap-1">
                  {platform.filters.map((f) => (
                    <Badge key={f} variant="outline" className="text-xs border-white/10">
                      {f.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="glass-card rounded-xl p-4 border border-white/5 bg-primary/5">
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-primary">💡 Tip:</span> Filters are applied primarily to Upwork (most advanced). 
          Other platforms will open with the search keyword. Refine your search on each platform individually.
        </p>
      </div>
    </div>
  );
}
