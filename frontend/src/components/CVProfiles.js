import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { FileText, Plus, Trash2, Loader2, Upload, CheckCircle, Briefcase, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import API from '@/lib/api';
const PROFILE_TYPES = ["QA", "Frontend", "Backend", "Fullstack", "DevOps", "Data", "AI/ML", "Management", "General", "Other"];

export default function CVProfiles() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [name, setName] = useState("");
  const [profileType, setProfileType] = useState("General");
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => { loadProfiles(); }, []);

  const loadProfiles = async () => {
    try {
      const res = await axios.get(`${API}/profiles`);
      setProfiles(res.data || []);
    } catch (e) { /* ignore */ }
    finally { setLoading(false); }
  };

  const handleUpload = async () => {
    if (!file || !name.trim()) { toast.error("Name and file are required"); return; }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", name);
      formData.append("profile_type", profileType);
      const res = await axios.post(`${API}/profiles/upload?name=${encodeURIComponent(name)}&profile_type=${encodeURIComponent(profileType)}`, formData, {
        headers: { "Content-Type": "multipart/form-data" }, timeout: 120000,
      });
      setProfiles(prev => [res.data, ...prev]);
      setDialogOpen(false);
      setFile(null); setName(""); setProfileType("General");
      toast.success("CV profile created!");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/profiles/${id}`);
      setProfiles(prev => prev.filter(p => p.id !== id));
      toast.success("Profile deleted");
    } catch (e) {
      toast.error("Delete failed");
    }
  };

  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Chivo, sans-serif' }}>
            <FileText className="w-6 h-6 inline text-accent mr-2" />
            CV <span className="text-accent">PROFILES</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Multiple resume versions for different role types. Track which CV sent where.</p>
        </div>
        <Button data-testid="add-profile-btn" className="bg-accent hover:bg-accent/90 text-white shadow-[0_0_10px_rgba(139,92,246,0.3)]" onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-1" /> New Profile
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40 text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin mr-2" />Loading...</div>
      ) : profiles.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p>No CV profiles yet.</p>
          <p className="text-xs mt-2">Create profiles for QA, Frontend, Fullstack, etc.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {profiles.map(profile => (
            <div key={profile.id} className="glass-card rounded-xl overflow-hidden" data-testid={`cv-profile-${profile.id}`}>
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-bold text-sm">{profile.name}</div>
                    <Badge variant="outline" className="text-xs border-accent/30 text-accent mt-1">{profile.profile_type}</Badge>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(profile.id)} data-testid={`delete-profile-${profile.id}`}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>

                <div className="text-xs text-muted-foreground space-y-1 font-mono-data">
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-3 h-3" /> {profile.filename}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Briefcase className="w-3 h-3" /> Used {profile.usage_count || 0} times
                  </div>
                  <div>Created: {new Date(profile.created_at).toLocaleDateString()}</div>
                </div>

                {/* Skills preview */}
                {profile.analysis?.skills?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/5">
                    <div className="flex flex-wrap gap-1">
                      {profile.analysis.skills.slice(0, 6).map((s, i) => (
                        <Badge key={i} variant="outline" className="text-xs border-white/10 text-muted-foreground">{s}</Badge>
                      ))}
                      {profile.analysis.skills.length > 6 && <Badge variant="outline" className="text-xs border-white/10 text-muted-foreground">+{profile.analysis.skills.length - 6}</Badge>}
                    </div>
                  </div>
                )}

                {/* Companies sent to */}
                {profile.companies_sent_to?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/5">
                    <div className="text-xs text-muted-foreground mb-1">Sent to:</div>
                    <div className="flex flex-wrap gap-1">
                      {profile.companies_sent_to.slice(-5).map((c, i) => (
                        <Badge key={i} className="bg-primary/10 text-primary border border-primary/20 text-xs">{c.company}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Expand details */}
                <Button variant="ghost" size="sm" className="mt-3 w-full text-xs text-muted-foreground hover:text-primary" onClick={() => setExpandedId(expandedId === profile.id ? null : profile.id)} data-testid={`expand-profile-${profile.id}`}>
                  <Eye className="w-3 h-3 mr-1" /> {expandedId === profile.id ? 'Hide' : 'View'} Analysis
                </Button>
              </div>

              {expandedId === profile.id && profile.analysis && (
                <div className="px-5 pb-5 space-y-3 border-t border-white/5 pt-3 bg-black/30">
                  {profile.analysis.summary && <p className="text-xs text-muted-foreground">{profile.analysis.summary}</p>}
                  {profile.analysis.preferred_titles?.length > 0 && (
                    <div>
                      <div className="text-xs font-bold text-primary mb-1">Target Roles</div>
                      <div className="flex flex-wrap gap-1">{profile.analysis.preferred_titles.map((t, i) => <Badge key={i} variant="outline" className="text-xs border-primary/20 text-primary">{t}</Badge>)}</div>
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground font-mono-data">
                    Level: {profile.analysis.seniority || 'Mid'}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#09090b] border-white/10 text-white max-w-md" data-testid="upload-profile-dialog">
          <DialogHeader>
            <DialogTitle className="font-bold" style={{ fontFamily: 'Chivo, sans-serif' }}>NEW CV <span className="text-accent">PROFILE</span></DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">Upload a tailored resume for a specific role type</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Profile Name</Label>
              <Input data-testid="profile-name" className="bg-black/50 border-white/10 text-sm" placeholder="e.g. QA Senior Resume 2026" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Role Type</Label>
              <Select value={profileType} onValueChange={setProfileType}>
                <SelectTrigger data-testid="profile-type-select" className="bg-black/50 border-white/10"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#18181b] border-white/10">{PROFILE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Resume File</Label>
              <div className="flex gap-2 items-center">
                <Input data-testid="profile-file" type="file" accept=".pdf,.docx" className="bg-black/50 border-white/10 text-sm" onChange={(e) => setFile(e.target.files?.[0])} />
              </div>
              {file && <p className="text-xs text-secondary mt-1 font-mono-data">{file.name} ({(file.size / 1024).toFixed(0)} KB)</p>}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="border-white/10" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button className="bg-accent hover:bg-accent/90 text-white" onClick={handleUpload} disabled={uploading} data-testid="save-profile-btn">
              {uploading ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />Analyzing...</> : <><Upload className="w-4 h-4 mr-1" />Create Profile</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
