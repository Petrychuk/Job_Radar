import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Plus, Download, Trash2, Edit, ExternalLink, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import AddJobDialog from "@/components/AddJobDialog";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const STATUSES = ["All", "New", "Applied", "Interview", "Offer", "Rejected", "Withdrawn", "No Response"];

export default function JobTracker() {
  const [jobs, setJobs] = useState([]);
  const [filterStatus, setFilterStatus] = useState("All");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadJobs(); }, [filterStatus]);

  const loadJobs = async () => {
    try {
      const params = filterStatus !== "All" ? { status: filterStatus } : {};
      const res = await axios.get(`${API}/tracker`, { params });
      setJobs(res.data);
    } catch (e) {
      toast.error("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/tracker/${id}`);
      setJobs(prev => prev.filter(j => j.id !== id));
      toast.success("Job removed");
    } catch (e) {
      toast.error("Delete failed");
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await axios.put(`${API}/tracker/${id}`, { status: newStatus });
      setJobs(prev => prev.map(j => j.id === id ? { ...j, status: newStatus } : j));
      toast.success(`Status updated to ${newStatus}`);
    } catch (e) {
      toast.error("Status update failed");
    }
  };

  const handleExport = async () => {
    try {
      const res = await axios.get(`${API}/tracker/export`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `job_tracker_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Excel file downloaded!");
    } catch (e) {
      toast.error("Export failed");
    }
  };

  const handleEdit = (job) => {
    setEditingJob(job);
    setDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingJob(null);
    setDialogOpen(true);
  };

  const handleDialogSave = () => {
    setDialogOpen(false);
    setEditingJob(null);
    loadJobs();
  };

  const statusClass = (s) => {
    const map = {
      'New': 'status-new',
      'Applied': 'status-applied',
      'Interview': 'status-interview',
      'Offer': 'status-offer',
      'Rejected': 'status-rejected',
      'Withdrawn': 'status-withdrawn',
      'No Response': 'status-no response',
    };
    return map[s] || 'status-new';
  };

  const statusCounts = jobs.reduce((acc, j) => {
    acc[j.status] = (acc[j.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Chivo, sans-serif' }}>
            APPLICATION <span className="text-primary">TRACKER</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            <span className="font-mono-data">{jobs.length}</span> applications tracked
          </p>
        </div>

        <div className="flex gap-2">
          <Button data-testid="add-job-btn" className="bg-primary hover:bg-primary/90 text-white shadow-[0_0_10px_rgba(59,130,246,0.3)]" onClick={handleAddNew}>
            <Plus className="w-4 h-4 mr-1" /> Add Job
          </Button>
          <Button data-testid="export-btn" variant="outline" className="border-white/10 hover:border-secondary/50 hover:text-secondary" onClick={handleExport}>
            <Download className="w-4 h-4 mr-1" /> Export
          </Button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="flex flex-wrap gap-2 mb-4">
        {STATUSES.map(s => (
          <button
            key={s}
            data-testid={`filter-${s.toLowerCase().replace(' ', '-')}`}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all font-mono-data ${
              filterStatus === s
                ? 'bg-primary/20 text-primary border border-primary/30'
                : 'bg-white/[0.02] text-muted-foreground border border-white/5 hover:border-white/10'
            }`}
            onClick={() => setFilterStatus(s)}
          >
            {s} {s !== 'All' && statusCounts[s] ? `(${statusCounts[s]})` : s === 'All' ? `(${jobs.length})` : ''}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="glass-card rounded-xl overflow-hidden" data-testid="tracker-table">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-xs uppercase tracking-wider font-mono-data text-muted-foreground w-8">#</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-mono-data text-muted-foreground">Date</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-mono-data text-muted-foreground">Company</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-mono-data text-muted-foreground">Position</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-mono-data text-muted-foreground">Salary</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-mono-data text-muted-foreground">Location</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-mono-data text-muted-foreground">Tech</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-mono-data text-muted-foreground">Status</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-mono-data text-muted-foreground">Mode</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-mono-data text-muted-foreground">Contract</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-mono-data text-muted-foreground">Visa</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-mono-data text-muted-foreground">Source</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-mono-data text-muted-foreground w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={13} className="text-center py-12 text-muted-foreground">
                    {loading ? "Loading..." : "No applications tracked yet. Click \"Add Job\" to start."}
                  </TableCell>
                </TableRow>
              ) : (
                jobs.map((job, i) => (
                  <TableRow key={job.id} className="border-white/5 hover:bg-white/[0.02] group" data-testid={`tracker-row-${i}`}>
                    <TableCell className="font-mono-data text-xs text-muted-foreground">{i + 1}</TableCell>
                    <TableCell className="font-mono-data text-xs whitespace-nowrap">{job.date_posted || '-'}</TableCell>
                    <TableCell className="text-sm font-medium max-w-[160px] truncate">{job.company || '-'}</TableCell>
                    <TableCell className="text-sm max-w-[200px]">
                      <div className="truncate">
                        {job.link || job.site_url ? (
                          <a href={job.link || job.site_url} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors flex items-center gap-1">
                            {job.position || '-'} <ExternalLink className="w-3 h-3 shrink-0 opacity-0 group-hover:opacity-50" />
                          </a>
                        ) : (job.position || '-')}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono-data text-xs text-muted-foreground">{job.salary || '-'}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[120px] truncate">{job.location || '-'}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">{job.technology || '-'}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button data-testid={`status-dropdown-${i}`} className={`${statusClass(job.status)} px-2 py-1 rounded text-xs font-medium cursor-pointer whitespace-nowrap font-mono-data`}>
                            {job.status}
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-[#18181b] border-white/10">
                          {STATUSES.filter(s => s !== 'All').map(s => (
                            <DropdownMenuItem key={s} className="text-xs cursor-pointer hover:bg-white/5" onClick={() => handleStatusChange(job.id, s)}>
                              {s}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{job.work_mode || '-'}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{job.contract_type || '-'}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{job.visa_sponsorship || '-'}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{job.source || '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" data-testid={`edit-job-${i}`} onClick={() => handleEdit(job)}>
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" data-testid={`delete-job-${i}`} onClick={() => handleDelete(job.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <AddJobDialog open={dialogOpen} onOpenChange={setDialogOpen} job={editingJob} onSave={handleDialogSave} />
    </div>
  );
}
