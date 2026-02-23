import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Search, ExternalLink, Loader2, Globe, Radar, RefreshCw, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function JobSearch() {
  const [scanning, setScanning] = useState(false);
  const [scanData, setScanData] = useState(null);
  const [searchLinks, setSearchLinks] = useState([]);
  const [keyword, setKeyword] = useState("software developer");
  const [loadingLinks, setLoadingLinks] = useState(false);

  useEffect(() => {
    loadLastScan();
  }, []);

  const loadLastScan = async () => {
    try {
      const res = await axios.get(`${API}/jobs`);
      if (res.data) setScanData(res.data);
    } catch (e) { /* ignore */ }
  };

  const handleScan = async () => {
    setScanning(true);
    try {
      const res = await axios.post(`${API}/jobs/scan`, {}, { timeout: 120000 });
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
      const res = await axios.get(`${API}/jobs/search-links`, { params: { keyword } });
      setSearchLinks(res.data);
    } catch (e) {
      toast.error("Failed to generate search links");
    } finally {
      setLoadingLinks(false);
    }
  };

  const addToTracker = async (job) => {
    try {
      await axios.post(`${API}/tracker`, {
        position: job.title,
        company: job.company || "",
        site_url: job.url || "",
        location: job.location || "",
        source: job.source || "",
        link: job.url || "",
        status: "New",
        date_posted: new Date().toISOString().split('T')[0],
      });
      toast.success(`Added "${job.title}" to tracker`);
    } catch (e) {
      toast.error("Failed to add job to tracker");
    }
  };

  const statusColor = (status) => {
    if (status === 'scraped') return 'text-secondary border-secondary/30';
    if (status === 'no_listings_found') return 'text-yellow-500 border-yellow-500/30';
    return 'text-muted-foreground border-white/10';
  };

  const allJobs = scanData?.results?.flatMap(r => r.jobs?.map(j => ({ ...j, source: r.site_name })) || []) || [];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Chivo, sans-serif' }}>
          JOB <span className="text-primary">SEARCH</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">AI-powered scanning across 20+ Australian job sites</p>
      </div>

      {/* Scan Controls */}
      <div className="glass-card rounded-xl p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <Button
            data-testid="scan-jobs-btn"
            className="bg-primary hover:bg-primary/90 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)] px-6"
            onClick={handleScan}
            disabled={scanning}
          >
            {scanning ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Scanning Sites...</>
            ) : (
              <><Radar className="w-4 h-4 mr-2" />Scan Job Sites</>
            )}
          </Button>

          <div className="flex gap-2 flex-1">
            <Input
              data-testid="keyword-input"
              className="bg-black/50 border-white/10 font-mono-data text-sm max-w-xs"
              placeholder="Search keyword..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadSearchLinks()}
            />
            <Button
              data-testid="search-links-btn"
              variant="outline"
              className="border-white/10 hover:border-primary/50"
              onClick={loadSearchLinks}
              disabled={loadingLinks}
            >
              {loadingLinks ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {scanData && (
          <div className="flex gap-6 mt-4 font-mono-data text-sm">
            <div><span className="text-muted-foreground">Sites:</span> <span className="text-primary">{scanData.sites_scanned}</span></div>
            <div><span className="text-muted-foreground">Jobs Found:</span> <span className="text-secondary">{scanData.total_jobs_found}</span></div>
            <div><span className="text-muted-foreground">Keywords:</span> <span className="text-accent">{scanData.keywords?.join(', ')}</span></div>
          </div>
        )}
      </div>

      {/* Search Links Grid */}
      {searchLinks.length > 0 && (
        <div className="glass-card rounded-xl p-6 mb-6" data-testid="search-links-grid">
          <h3 className="font-bold text-sm uppercase tracking-wider text-primary mb-4" style={{ fontFamily: 'Chivo, sans-serif' }}>
            Quick Search Links for "{keyword}"
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {searchLinks.map((link, i) => (
              <a
                key={i}
                href={link.search_url}
                target="_blank"
                rel="noopener noreferrer"
                data-testid={`search-link-${link.site_id}`}
                className="flex items-center gap-2 p-3 rounded-lg bg-white/[0.02] border border-white/5 hover:border-primary/30 hover:bg-primary/5 transition-all text-sm group"
              >
                <Globe className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                <span className="truncate">{link.site_name}</span>
                <ExternalLink className="w-3 h-3 text-muted-foreground/50 ml-auto shrink-0" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Scan Results */}
      {scanData?.results && (
        <div className="space-y-4">
          {/* Sites status */}
          <div className="glass-card rounded-xl p-6" data-testid="scan-sites-status">
            <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-4" style={{ fontFamily: 'Chivo, sans-serif' }}>Scan Results by Site</h3>
            <div className="flex flex-wrap gap-2">
              {scanData.results.map((r, i) => (
                <a key={i} href={r.search_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5">
                  <Badge variant="outline" className={`${statusColor(r.status)} hover:bg-white/5 transition-colors cursor-pointer`}>
                    {r.site_name}
                    {r.jobs?.length > 0 && <span className="ml-1 text-secondary">({r.jobs.length})</span>}
                  </Badge>
                </a>
              ))}
            </div>
          </div>

          {/* Jobs table */}
          {allJobs.length > 0 && (
            <div className="glass-card rounded-xl overflow-hidden" data-testid="scraped-jobs-table">
              <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <h3 className="font-bold text-sm uppercase tracking-wider" style={{ fontFamily: 'Chivo, sans-serif' }}>
                  Found Jobs <span className="text-primary">({allJobs.length})</span>
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
                      <TableHead className="text-xs uppercase tracking-wider font-mono-data text-muted-foreground w-24">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allJobs.slice(0, 50).map((job, i) => (
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
    </div>
  );
}
