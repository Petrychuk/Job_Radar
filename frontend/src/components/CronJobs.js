import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Clock, Plus, Trash2, Play, Loader2, Power, PowerOff, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function CronJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newKeywords, setNewKeywords] = useState("");
  const [newLocation, setNewLocation] = useState("Australia");
  const [runningId, setRunningId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [results, setResults] = useState({});
  const [runningAll, setRunningAll] = useState(false);

  useEffect(() => { loadJobs(); }, []);

  const loadJobs = async () => {
    try {
      const res = await axios.get(`${API}/cron/jobs`);
      setJobs(res.data || []);
    } catch (e) {
      toast.error("Failed to load searches");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newTitle.trim()) { toast.error("Title is required"); return; }
    try {
      const keywords = newKeywords.split(',').map(k => k.trim()).filter(Boolean);
      const res = await axios.post(`${API}/cron/jobs`, {
        title: newTitle.trim(),
        keywords: keywords.length > 0 ? keywords : [newTitle.trim()],
        location: newLocation,
        active: true
      });
      setJobs(prev => [res.data, ...prev]);
      setDialogOpen(false);
      setNewTitle(""); setNewKeywords(""); setNewLocation("Australia");
      toast.success("Auto-search created!");
    } catch (e) {
      toast.error("Failed to create");
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/cron/jobs/${id}`);
      setJobs(prev => prev.filter(j => j.id !== id));
      toast.success("Search removed");
    } catch (e) {
      toast.error("Failed to delete");
    }
  };

  const handleToggle = async (id) => {
    try {
      const res = await axios.put(`${API}/cron/jobs/${id}/toggle`);
      setJobs(prev => prev.map(j => j.id === id ? { ...j, active: res.data.active } : j));
    } catch (e) {
      toast.error("Failed to toggle");
    }
  };

  const handleRun = async (id) => {
    setRunningId(id);
    try {
      const res = await axios.post(`${API}/cron/run/${id}`, {}, { timeout: 120000 });
      setJobs(prev => prev.map(j => j.id === id ? { ...j, last_run: res.data.run_at, results_count: res.data.total_jobs_found } : j));
      setResults(prev => ({ ...prev, [id]: res.data }));
      setExpandedId(id);
      toast.success(`Found ${res.data.total_jobs_found} jobs!`);
    } catch (e) {
      toast.error("Scan failed");
    } finally {
      setRunningId(null);
    }
  };

  const handleRunAll = async () => {
    setRunningAll(true);
    try {
      const res = await axios.post(`${API}/cron/run-all`, {}, { timeout: 300000 });
      toast.success(`Ran ${res.data.jobs_run} searches`);
      loadJobs();
    } catch (e) {
      toast.error("Run all failed");
    } finally {
      setRunningAll(false);
    }
  };

  const loadResults = async (id) => {
    if (expandedId === id) { setExpandedId(null); return; }
    try {
      const res = await axios.get(`${API}/cron/results/${id}`);
      if (res.data?.length > 0) {
        setResults(prev => ({ ...prev, [id]: res.data[0] }));
      }
      setExpandedId(id);
    } catch (e) { /* ignore */ }
  };

  const addToTracker = async (job) => {
    try {
      await axios.post(`${API}/tracker`, {
        position: job.title, company: job.company || "", site_url: job.url || "",
        location: job.location || "", source: job.source || "", link: job.url || "",
        status: "New", date_posted: new Date().toISOString().split('T')[0],
      });
      toast.success(`Added "${job.title}" to tracker`);
    } catch (e) {
      toast.error("Failed to add");
    }
  };

  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Chivo, sans-serif' }}>
            <Clock className="w-6 h-6 inline text-primary mr-2" />
            AUTO <span className="text-primary">SEARCH</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Set up automated job searches. Run manually or schedule daily scans.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            data-testid="run-all-cron-btn"
            variant="outline"
            className="border-secondary/30 text-secondary hover:bg-secondary/10"
            onClick={handleRunAll}
            disabled={runningAll || jobs.filter(j => j.active).length === 0}
          >
            {runningAll ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Play className="w-4 h-4 mr-1" />}
            Run All Active
          </Button>
          <Button
            data-testid="add-cron-btn"
            className="bg-primary hover:bg-primary/90 text-white shadow-[0_0_10px_rgba(59,130,246,0.3)]"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="w-4 h-4 mr-1" /> Add Search
          </Button>
        </div>
      </div>

      {/* Jobs List */}
      {loading ? (
        <div className="flex items-center justify-center h-40 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading...
        </div>
      ) : jobs.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center text-muted-foreground">
          <Clock className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p>No automated searches yet.</p>
          <p className="text-xs mt-2">Click "Add Search" to create one.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <div key={job.id} className="glass-card rounded-xl overflow-hidden" data-testid={`cron-job-${job.id}`}>
              <div className="p-5 flex items-center gap-4">
                {/* Toggle */}
                <button
                  data-testid={`cron-toggle-${job.id}`}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    job.active ? 'bg-secondary/20 text-secondary' : 'bg-white/5 text-muted-foreground'
                  }`}
                  onClick={() => handleToggle(job.id)}
                >
                  {job.active ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                </button>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{job.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 flex flex-wrap gap-x-3">
                    <span>Keywords: <span className="text-primary font-mono-data">{(job.keywords || []).join(', ')}</span></span>
                    <span>Location: <span className="font-mono-data">{job.location}</span></span>
                    {job.last_run && <span>Last run: <span className="font-mono-data">{new Date(job.last_run).toLocaleDateString()}</span></span>}
                    {job.results_count > 0 && <span>Found: <span className="text-secondary font-mono-data">{job.results_count}</span></span>}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 shrink-0">
                  <Button
                    variant="outline" size="sm"
                    className="border-primary/30 text-primary hover:bg-primary/10"
                    onClick={() => handleRun(job.id)}
                    disabled={runningId === job.id}
                    data-testid={`cron-run-${job.id}`}
                  >
                    {runningId === job.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                  </Button>
                  <Button
                    variant="ghost" size="sm"
                    className="text-muted-foreground hover:text-white"
                    onClick={() => loadResults(job.id)}
                    data-testid={`cron-expand-${job.id}`}
                  >
                    {expandedId === job.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="ghost" size="sm"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(job.id)}
                    data-testid={`cron-delete-${job.id}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {/* Expanded Results */}
              {expandedId === job.id && results[job.id] && (
                <div className="border-t border-white/5 p-4 bg-black/30">
                  <div className="text-xs text-muted-foreground mb-3 font-mono-data">
                    Scan: {results[job.id].total_jobs_found} jobs found | {new Date(results[job.id].run_at).toLocaleString()}
                  </div>

                  {/* Site results */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {(results[job.id].results || []).map((r, i) => (
                      <a key={i} href={r.search_url} target="_blank" rel="noopener noreferrer">
                        <Badge variant="outline" className={`text-xs cursor-pointer hover:bg-white/5 ${
                          r.jobs?.length > 0 ? 'text-secondary border-secondary/30' : 'text-muted-foreground border-white/10'
                        }`}>
                          {r.site_name} {r.jobs?.length > 0 && `(${r.jobs.length})`}
                        </Badge>
                      </a>
                    ))}
                  </div>

                  {/* Found jobs table */}
                  {(() => {
                    const allJobs = (results[job.id].results || []).flatMap(r => (r.jobs || []).map(j => ({ ...j, source: r.site_name })));
                    if (allJobs.length === 0) return <div className="text-xs text-muted-foreground">No job listings extracted. Click site badges above to search manually.</div>;
                    return (
                      <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-white/5 hover:bg-transparent">
                              <TableHead className="text-xs font-mono-data text-muted-foreground">Position</TableHead>
                              <TableHead className="text-xs font-mono-data text-muted-foreground">Company</TableHead>
                              <TableHead className="text-xs font-mono-data text-muted-foreground">Source</TableHead>
                              <TableHead className="text-xs font-mono-data text-muted-foreground w-20">Action</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {allJobs.slice(0, 30).map((j, i) => (
                              <TableRow key={i} className="border-white/5 hover:bg-white/[0.02]">
                                <TableCell className="text-xs">
                                  {j.url ? (
                                    <a href={j.url} target="_blank" rel="noopener noreferrer" className="hover:text-primary flex items-center gap-1">
                                      {j.title} <ExternalLink className="w-3 h-3 opacity-50 shrink-0" />
                                    </a>
                                  ) : j.title}
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">{j.company || '-'}</TableCell>
                                <TableCell><Badge variant="outline" className="text-xs border-white/10">{j.source}</Badge></TableCell>
                                <TableCell>
                                  <Button variant="ghost" size="sm" className="h-6 text-xs text-primary hover:bg-primary/10" onClick={() => addToTracker(j)}>
                                    <Plus className="w-3 h-3 mr-1" /> Track
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Search Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#09090b] border-white/10 text-white max-w-md" data-testid="add-cron-dialog">
          <DialogHeader>
            <DialogTitle className="font-bold" style={{ fontFamily: 'Chivo, sans-serif' }}>
              NEW AUTO <span className="text-primary">SEARCH</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Job Title / Search Name</Label>
              <Input
                data-testid="cron-title-input"
                className="bg-black/50 border-white/10 font-mono-data text-sm"
                placeholder="e.g. Senior QA Engineer"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Keywords (comma-separated)</Label>
              <Input
                data-testid="cron-keywords-input"
                className="bg-black/50 border-white/10 font-mono-data text-sm"
                placeholder="e.g. QA, testing, automation, selenium"
                value={newKeywords}
                onChange={(e) => setNewKeywords(e.target.value)}
              />
              <p className="text-xs text-muted-foreground/50 mt-1">Leave empty to use job title as keyword</p>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Location</Label>
              <Input
                data-testid="cron-location-input"
                className="bg-black/50 border-white/10 font-mono-data text-sm"
                placeholder="Australia"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="border-white/10" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button className="bg-primary hover:bg-primary/90 text-white" onClick={handleCreate} data-testid="save-cron-btn">
              Create Search
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
