import { X, Heart, Briefcase, ExternalLink, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const JOB_SITES = [
  { id: "seek", name: "Seek", icon: "🔍" },
  { id: "indeed", name: "Indeed AU", icon: "🔵" },
  { id: "linkedin", name: "LinkedIn", icon: "💼" },
  { id: "adzuna", name: "Adzuna", icon: "📊" },
  { id: "careerone", name: "CareerOne", icon: "🎯" },
  { id: "workforce", name: "Workforce Australia", icon: "🏢" },
  { id: "roberthalf", name: "Robert Half", icon: "💡" },
  { id: "spark", name: "Spark Recruitment", icon: "⚡" },
  { id: "hatch", name: "Hatch", icon: "🚀" },
  { id: "work180", name: "WORK180", icon: "🌟" },
  { id: "clicks", name: "Clicks IT", icon: "💻" },
  { id: "credible", name: "Credible", icon: "✅" },
  { id: "premium", name: "Premium Graduate", icon: "🎓" },
  { id: "sofico", name: "Sofico Global", icon: "🌐" },
  { id: "atlassian", name: "Atlassian", icon: "🔷" },
  { id: "canva", name: "Canva", icon: "🎨" },
];

export default function JobDetailModal({ job, open, onClose, onSave, onApply, onGenerateDocs }) {
  if (!open || !job) return null;

  const handleSearchSite = (site) => {
    const query = encodeURIComponent(job.title);
    const urls = {
      seek: `https://www.seek.com.au/jobs?keywords=${query}`,
      indeed: `https://au.indeed.com/jobs?q=${query}`,
      linkedin: `https://www.linkedin.com/jobs/search/?keywords=${query}&location=Australia`,
      adzuna: `https://www.adzuna.com.au/search?q=${query}`,
      careerone: `https://www.careerone.com.au/jobs?search=${query}`,
      workforce: `https://www.workforceaustralia.gov.au/individuals/training/search?keywords=${query}`,
      roberthalf: `https://www.roberthalf.com/au/en/jobs?query=${query}`,
      spark: `https://www.sparkrecruitment.com.au/jobs/permanent?q=${query}`,
      hatch: `https://app.hatch.team/jobs?q=${query}`,
      work180: `https://work180.com/en-au/jobs?q=${query}`,
      clicks: `https://clicks.com.au/jobs/?search=${query}`,
      credible: `https://www.credible.com.au/jobs?q=${query}`,
      premium: `https://www.premiumgraduate.com.au/jobs?q=${query}`,
      sofico: `https://sofico.global/careers?q=${query}`,
      atlassian: `https://www.atlassian.com/company/careers/all-jobs?search=${query}`,
      canva: `https://www.canva.com/careers/jobs/?query=${query}`,
    };
    window.open(urls[site.id] || job.url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="glass-card rounded-2xl p-8 border border-white/10 backdrop-blur-xl bg-black/90 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Chivo, sans-serif' }}>
              {job.title}
            </h2>
            {job.company && (
              <p className="text-muted-foreground">{job.company}</p>
            )}
            {job.location && (
              <p className="text-sm text-muted-foreground/70">{job.location}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Match Score & Salary */}
        <div className="flex flex-wrap gap-3 mb-6">
          {job.match_score && (
            <Badge variant="outline" className="text-secondary border-secondary/30 font-mono-data">
              {job.match_score}% Match
            </Badge>
          )}
          {job.salary_range && (
            <Badge variant="outline" className="text-primary border-primary/30 font-mono-data">
              {job.salary_range}
            </Badge>
          )}
          {job.source && (
            <Badge variant="outline" className="text-muted-foreground border-white/10">
              {job.source}
            </Badge>
          )}
        </div>

        {/* Description */}
        {job.why_match && (
          <div className="mb-6 p-4 rounded-lg bg-white/5 border border-white/5">
            <h3 className="text-sm font-semibold text-primary mb-2">Why This Matches You</h3>
            <p className="text-sm text-muted-foreground">{job.why_match}</p>
          </div>
        )}

        {/* Keywords */}
        {job.search_keywords && job.search_keywords.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-2">Key Skills</h3>
            <div className="flex flex-wrap gap-2">
              {job.search_keywords.map((kw, i) => (
                <Badge key={i} variant="outline" className="text-xs border-white/10">
                  {kw}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mb-6 pb-6 border-b border-white/10">
          <Button
            onClick={() => onSave(job)}
            className="bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 border border-pink-500/30"
          >
            <Heart className="w-4 h-4 mr-2" />
            Save to Wishlist
          </Button>
          <Button
            onClick={() => onApply(job)}
            className="bg-secondary/10 hover:bg-secondary/20 text-secondary border border-secondary/30"
          >
            <Briefcase className="w-4 h-4 mr-2" />
            Apply (Add to Tracker)
          </Button>
          {job.url && (
            <Button
              onClick={() => window.open(job.url, '_blank')}
              variant="outline"
              className="border-white/10 hover:border-primary/50"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View Original
            </Button>
          )}
        </div>

        {/* Search on Job Sites */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider mb-3">
            Search "{job.title}" on Job Sites
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {JOB_SITES.map((site) => (
              <button
                key={site.id}
                onClick={() => handleSearchSite(site)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/30 transition-all text-left text-sm"
              >
                <span className="text-lg">{site.icon}</span>
                <span className="text-muted-foreground">{site.name}</span>
                <ExternalLink className="w-3 h-3 ml-auto text-muted-foreground/50" />
              </button>
            ))}
          </div>
        </div>

        {/* Generate ATS Documents */}
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider mb-3">
            Generate ATS Documents
          </h3>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => onGenerateDocs(job, 'both')}
              className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30"
            >
              <FileDown className="w-4 h-4 mr-2" />
              Resume + Cover Letter
            </Button>
            <Button
              onClick={() => onGenerateDocs(job, 'resume')}
              variant="outline"
              className="border-white/10"
            >
              Resume Only
            </Button>
            <Button
              onClick={() => onGenerateDocs(job, 'cover_letter')}
              variant="outline"
              className="border-white/10"
            >
              Cover Letter Only
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
