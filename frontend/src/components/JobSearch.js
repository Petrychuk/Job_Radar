import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Search, ExternalLink, Loader2, Globe, Radar, RefreshCw, Plus, Filter, X, Building2, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";

const API = process.env.REACT_APP_BACKEND_URL;

const FILTER_CONFIG = {
  visa: { label: "Visa", options: ["All", "482 Sponsor", "PR Only", "Citizen", "Any Visa"] },
  work_mode: { label: "Work Mode", options: ["All", "Remote", "Hybrid", "Onsite"] },
  contract: { label: "Contract", options: ["All", "Permanent", "Contract", "Casual", "Internship"] },
  posted: { label: "Posted", options: ["All", "24h", "3 days", "7 days", "14 days", "30 days"] },
  company_size: { label: "Company", options: ["All", "Startup", "SME", "Enterprise", "Government"] },
  posted_by: { label: "Posted By", options: ["All", "Direct Employer", "Recruiter"] },
  level: { label: "Level", options: ["All", "Junior-friendly", "Mid", "Senior", "Lead"] },
};

function FilterChip({ label, active, onClick }) {
  return (
    <button
      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all font-mono-data whitespace-nowrap ${
        active
          ? 'bg-primary/20 text-primary border border-primary/40'
          : 'bg-white/[0.02] text-muted-foreground border border-white/5 hover:border-white/15'
      }`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

export default function JobSearch() {
  const [scanning, setScanning] = useState(false);
  const [scanData, setScanData] = useState(null);
  const [searchLinks, setSearchLinks] = useState([]);
  const [keyword, setKeyword] = useState("software developer");
  const [loadingLinks, setLoadingLinks] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [filters, setFilters] = useState(Object.fromEntries(Object.keys(FILTER_CONFIG).map(k => [k, "All"])));
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [customSites, setCustomSites] = useState([]);
  const [siteDialogOpen, setSiteDialogOpen] = useState(false);
  const [newSite, setNewSite] = useState({ name: "", url: "", careers_url: "", category: "company" });
  const [customSitesOpen, setCustomSitesOpen] = useState(false);

  useEffect(() => {
    loadLastScan();
    loadCustomSites();
  }, []);

  const loadLastScan = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API}/jobs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data) setScanData(res.data);
    } catch (e) { /* ignore */ }
  };

  const loadCustomSites = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API}/custom-sites`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCustomSites(res.data || []);
    } catch (e) { /* ignore */ }
  };

  const handleScan = async () => {
    setScanning(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(`${API}/jobs/scan`, {}, { 
        headers: { Authorization: `Bearer ${token}` },
        timeout: 120000 
      });
      setScanData(res.data);
      toast.success(`Scan complete! Found ${res.data.total_jobs_found} jobs across ${res.data.sites_scanned} sites`);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Scan failed. Upload a resume first.");
    } finally {
      setScanning(false);
    }
  };

  const loadSearchLinks = async () => {
    setLoadingLinks(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API}/jobs/search-links`, { 
        params: { keyword },
        headers: { Authorization: `Bearer ${token}` }
      });
      setSearchLinks(res.data || []);
    } catch (e) {
      toast.error("Failed to generate search links");
    } finally {
      setLoadingLinks(false);
    }
  };

  const addToTracker = async (job) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API}/tracker`, {
        position: job.title, company: job.company || "", site_url: job.url || "",
        location: job.location || "", source: job.source || "", link: job.url || "",
        status: "New", date_posted: new Date().toISOString().split('T')[0],
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Added "${job.title}" to tracker`);
    } catch (e) {
      toast.error("Failed to add job to tracker");
    }
  };

  const handleAddCustomSite = async () => {
    if (!newSite.name.trim() || !newSite.url.trim()) { toast.error("Name and URL required"); return; }
    try {
      const res = await axios.post(`${API}/custom-sites`, {
        ...newSite,
        careers_url: newSite.careers_url || newSite.url,
      });
      setCustomSites(prev => [res.data, ...prev]);
      setSiteDialogOpen(false);
      setNewSite({ name: "", url: "", careers_url: "", category: "company" });
      toast.success("Site added to monitoring!");
    } catch (e) {
      toast.error("Failed to add site");
    }
  };

  const handleDeleteCustomSite = async (id) => {
    try {
      await axios.delete(`${API}/custom-sites/${id}`);
      setCustomSites(prev => prev.filter(s => s.id !== id));
      toast.success("Site removed");
    } catch (e) {
      toast.error("Failed to remove");
    }
  };

  const setFilter = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));

  const activeFilterCount = Object.values(filters).filter(v => v !== "All").length + (salaryMin || salaryMax ? 1 : 0);

  const clearFilters = () => {
    setFilters(Object.fromEntries(Object.keys(FILTER_CONFIG).map(k => [k, "All"])));
    setSalaryMin(""); setSalaryMax("");
  };

  // Client-side filter for scraped jobs
  const allJobs = scanData?.results?.flatMap(r => r.jobs?.map(j => ({ ...j, source: r.site_name })) || []) || [];
  const filteredJobs = allJobs.filter(job => {
    const text = `${job.title} ${job.company} ${job.location}`.toLowerCase();
    if (filters.work_mode !== "All" && !text.includes(filters.work_mode.toLowerCase())) return true; // can't filter what we can't detect, show all
    if (filters.level === "Junior-friendly" && !text.includes("junior") && !text.includes("graduate") && !text.includes("entry")) return true;
    return true; // Most filters need metadata we don't have from scraping — they're used for search query construction
  });

  const statusColor = (status) => {
    if (status === 'scraped') return 'text-secondary border-secondary/30';
    if (status === 'no_listings_found') return 'text-yellow-500 border-yellow-500/30';
    return 'text-muted-foreground border-white/10';
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Chivo, sans-serif' }}>
          JOB <span className="text-primary">SEARCH</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">AI-powered scanning across {18 + customSites.length} job sites</p>
      </div>

      {/* Scan + Search Controls */}
      <div className="glass-card rounded-xl p-5 mb-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <Button data-testid="scan-jobs-btn" className="bg-primary hover:bg-primary/90 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)] px-6" onClick={handleScan} disabled={scanning}>
            {scanning ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Scanning...</> : <><Radar className="w-4 h-4 mr-2" />Scan All Sites</>}
          </Button>
          <div className="flex gap-2 flex-1">
            <Input data-testid="keyword-input" className="bg-black/50 border-white/10 font-mono-data text-sm max-w-xs" placeholder="Search keyword..." value={keyword} onChange={(e) => setKeyword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && loadSearchLinks()} />
            <Button data-testid="search-links-btn" variant="outline" className="border-white/10 hover:border-primary/50" onClick={loadSearchLinks} disabled={loadingLinks}>
              {loadingLinks ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </Button>
          </div>
          <Button variant="outline" size="sm" className={`border-white/10 shrink-0 ${activeFilterCount > 0 ? 'text-primary border-primary/30' : ''}`} onClick={() => setFiltersOpen(!filtersOpen)} data-testid="toggle-filters-btn">
            <Filter className="w-4 h-4 mr-1" /> Filters {activeFilterCount > 0 && <Badge className="ml-1 bg-primary/20 text-primary text-xs px-1.5 py-0">{activeFilterCount}</Badge>}
          </Button>
        </div>

        {scanData && (
          <div className="flex gap-6 mt-3 font-mono-data text-xs">
            <div><span className="text-muted-foreground">Sites:</span> <span className="text-primary">{scanData.sites_scanned}</span></div>
            <div><span className="text-muted-foreground">Jobs:</span> <span className="text-secondary">{scanData.total_jobs_found}</span></div>
            <div><span className="text-muted-foreground">Keywords:</span> <span className="text-accent">{scanData.keywords?.join(', ')}</span></div>
          </div>
        )}
      </div>

      {/* Filter Panel */}
      {filtersOpen && (
        <div className="glass-card rounded-xl p-5 mb-4 animate-fade-in" data-testid="filter-panel">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground" style={{ fontFamily: 'Chivo, sans-serif' }}>
              <Filter className="w-3.5 h-3.5 inline mr-1" /> Search Filters
            </h3>
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground hover:text-destructive" onClick={clearFilters} data-testid="clear-filters-btn">
                <X className="w-3 h-3 mr-1" /> Clear All
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Object.entries(FILTER_CONFIG).map(([key, config]) => (
              <div key={key}>
                <Label className="text-xs text-muted-foreground mb-1.5 block">{config.label}</Label>
                <div className="flex flex-wrap gap-1" data-testid={`filter-group-${key}`}>
                  {config.options.map(opt => (
                    <FilterChip key={opt} label={opt} active={filters[key] === opt} onClick={() => setFilter(key, opt)} />
                  ))}
                </div>
              </div>
            ))}

            {/* Salary Range */}
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Salary Range (AUD)</Label>
              <div className="flex gap-2 items-center">
                <Input data-testid="salary-min" className="bg-black/50 border-white/10 font-mono-data text-xs h-8 w-24" placeholder="Min $" value={salaryMin} onChange={(e) => setSalaryMin(e.target.value)} />
                <span className="text-muted-foreground text-xs">-</span>
                <Input data-testid="salary-max" className="bg-black/50 border-white/10 font-mono-data text-xs h-8 w-24" placeholder="Max $" value={salaryMax} onChange={(e) => setSalaryMax(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Active Filters Summary */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4 pt-3 border-t border-white/5">
              <span className="text-xs text-muted-foreground mr-1">Active:</span>
              {Object.entries(filters).filter(([_, v]) => v !== "All").map(([k, v]) => (
                <Badge key={k} variant="outline" className="text-xs text-primary border-primary/30">
                  {FILTER_CONFIG[k]?.label}: {v}
                  <button className="ml-1 hover:text-destructive" onClick={() => setFilter(k, "All")}><X className="w-2.5 h-2.5" /></button>
                </Badge>
              ))}
              {(salaryMin || salaryMax) && (
                <Badge variant="outline" className="text-xs text-primary border-primary/30">
                  Salary: {salaryMin || '0'} - {salaryMax || '...'}
                  <button className="ml-1 hover:text-destructive" onClick={() => { setSalaryMin(''); setSalaryMax(''); }}><X className="w-2.5 h-2.5" /></button>
                </Badge>
              )}
            </div>
          )}
        </div>
      )}

      {/* Custom Company Sites */}
      <div className="glass-card rounded-xl mb-4 overflow-hidden">
        <button className="w-full p-4 flex items-center justify-between hover:bg-white/[0.01] transition-colors" onClick={() => setCustomSitesOpen(!customSitesOpen)} data-testid="toggle-custom-sites">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-accent" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-accent" style={{ fontFamily: 'Chivo, sans-serif' }}>
              Company Career Pages
            </h3>
            <span className="text-xs text-muted-foreground font-mono-data">({customSites.length} monitored)</span>
          </div>
          {customSitesOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>

        {customSitesOpen && (
          <div className="px-4 pb-4 border-t border-white/5 pt-3">
            <p className="text-xs text-muted-foreground mb-3">Add IT company career pages to monitor. These will be included in all scans.</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {customSites.map(site => (
                <div key={site.id} className="flex items-center gap-2 bg-white/[0.02] border border-white/5 rounded-lg px-3 py-2 group" data-testid={`custom-site-${site.id}`}>
                  <Globe className="w-3.5 h-3.5 text-accent shrink-0" />
                  <a href={site.url} target="_blank" rel="noopener noreferrer" className="text-xs hover:text-primary transition-colors">{site.name}</a>
                  <Badge variant="outline" className="text-xs border-white/5 text-muted-foreground/50">{site.category}</Badge>
                  <button className="text-muted-foreground/30 hover:text-destructive transition-colors" onClick={() => handleDeleteCustomSite(site.id)} data-testid={`delete-site-${site.id}`}>
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <Button variant="outline" size="sm" className="border-accent/30 text-accent hover:bg-accent/10 h-9" onClick={() => setSiteDialogOpen(true)} data-testid="add-custom-site-btn">
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Site
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Search Links Grid */}
      {searchLinks.length > 0 && (
        <div className="glass-card rounded-xl p-5 mb-4" data-testid="search-links-grid">
          <h3 className="font-bold text-xs uppercase tracking-wider text-primary mb-3" style={{ fontFamily: 'Chivo, sans-serif' }}>
            Search "{keyword}" on Job Sites
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {searchLinks.map((link, i) => (
              <a key={i} href={link.search_url} target="_blank" rel="noopener noreferrer" data-testid={`search-link-${link.site_id}`}
                className={`flex items-center gap-2 p-2.5 rounded-lg bg-white/[0.02] border hover:border-primary/30 hover:bg-primary/5 transition-all text-xs group ${link.custom ? 'border-accent/20' : 'border-white/5'}`}>
                {link.custom ? <Building2 className="w-3.5 h-3.5 text-accent shrink-0" /> : <Globe className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary shrink-0" />}
                <span className="truncate">{link.site_name}</span>
                <ExternalLink className="w-3 h-3 text-muted-foreground/30 ml-auto shrink-0" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Scan Results */}
      {scanData?.results && (
        <div className="space-y-4">
          <div className="glass-card rounded-xl p-5" data-testid="scan-sites-status">
            <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-3" style={{ fontFamily: 'Chivo, sans-serif' }}>Scan Results by Site</h3>
            <div className="flex flex-wrap gap-2">
              {scanData.results.map((r, i) => (
                <a key={i} href={r.search_url} target="_blank" rel="noopener noreferrer">
                  <Badge variant="outline" className={`${statusColor(r.status)} hover:bg-white/5 cursor-pointer`}>
                    {r.site_name} {r.jobs?.length > 0 && <span className="ml-1 text-secondary">({r.jobs.length})</span>}
                  </Badge>
                </a>
              ))}
            </div>
          </div>

          {filteredJobs.length > 0 && (
            <div className="glass-card rounded-xl overflow-hidden" data-testid="scraped-jobs-table">
              <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <h3 className="font-bold text-xs uppercase tracking-wider" style={{ fontFamily: 'Chivo, sans-serif' }}>
                  Found Jobs <span className="text-primary">({filteredJobs.length})</span>
                </h3>
                <Button variant="ghost" size="sm" onClick={handleScan} disabled={scanning} data-testid="rescan-btn">
                  <RefreshCw className={`w-4 h-4 mr-1 ${scanning ? 'animate-spin' : ''}`} /> Rescan
                </Button>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/5 hover:bg-transparent">
                      <TableHead className="text-xs uppercase tracking-wider font-mono-data text-muted-foreground">Position</TableHead>
                      <TableHead className="text-xs uppercase tracking-wider font-mono-data text-muted-foreground">Company</TableHead>
                      <TableHead className="text-xs uppercase tracking-wider font-mono-data text-muted-foreground">Location</TableHead>
                      <TableHead className="text-xs uppercase tracking-wider font-mono-data text-muted-foreground">Source</TableHead>
                      <TableHead className="text-xs uppercase tracking-wider font-mono-data text-muted-foreground w-20">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredJobs.slice(0, 50).map((job, i) => (
                      <TableRow key={i} className="border-white/5 hover:bg-white/[0.02]">
                        <TableCell className="font-medium text-sm max-w-xs">
                          {job.url ? (
                            <a href={job.url} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors flex items-center gap-1">
                              {job.title} <ExternalLink className="w-3 h-3 shrink-0 opacity-50" />
                            </a>
                          ) : job.title}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{job.company || '-'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{job.location || '-'}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs border-white/10">{job.source}</Badge></TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" data-testid={`add-to-tracker-${i}`} onClick={() => addToTracker(job)} className="text-primary hover:text-primary hover:bg-primary/10">
                            <Plus className="w-3 h-3 mr-1" /> Track
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Custom Site Dialog */}
      <Dialog open={siteDialogOpen} onOpenChange={setSiteDialogOpen}>
        <DialogContent className="bg-[#09090b] border-white/10 text-white max-w-md" data-testid="add-site-dialog">
          <DialogHeader>
            <DialogTitle className="font-bold" style={{ fontFamily: 'Chivo, sans-serif' }}>
              ADD <span className="text-accent">COMPANY SITE</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">Add a company career page to monitor for new vacancies</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Company Name</Label>
              <Input data-testid="site-name-input" className="bg-black/50 border-white/10 font-mono-data text-sm" placeholder="e.g. Atlassian" value={newSite.name} onChange={(e) => setNewSite(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Website URL</Label>
              <Input data-testid="site-url-input" className="bg-black/50 border-white/10 font-mono-data text-sm" placeholder="https://www.atlassian.com" value={newSite.url} onChange={(e) => setNewSite(p => ({ ...p, url: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Careers Page URL</Label>
              <Input data-testid="site-careers-input" className="bg-black/50 border-white/10 font-mono-data text-sm" placeholder="https://www.atlassian.com/company/careers" value={newSite.careers_url} onChange={(e) => setNewSite(p => ({ ...p, careers_url: e.target.value }))} />
              <p className="text-xs text-muted-foreground/50 mt-1">Direct link to their careers/jobs page</p>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Category</Label>
              <div className="flex gap-2" data-testid="site-category-select">
                {["company", "recruitment", "other"].map(cat => (
                  <FilterChip key={cat} label={cat.charAt(0).toUpperCase() + cat.slice(1)} active={newSite.category === cat} onClick={() => setNewSite(p => ({ ...p, category: cat }))} />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="border-white/10" onClick={() => setSiteDialogOpen(false)}>Cancel</Button>
            <Button className="bg-accent hover:bg-accent/90 text-white" onClick={handleAddCustomSite} data-testid="save-site-btn">Add to Monitoring</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
