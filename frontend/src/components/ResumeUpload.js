import { useState, useCallback, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Upload, FileText, Brain, Briefcase, Star, Loader2, X, CheckCircle, Heart, Trash2, ExternalLink, FileDown, Search, Plus, Folder } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import RecommendationModal from "@/components/RecommendationModal";

const API = process.env.REACT_APP_BACKEND_URL;

export default function ResumeUpload() {
  const [file, setFile] = useState(null);
  const [profileName, setProfileName] = useState("");
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [allResumes, setAllResumes] = useState([]);
  const [selectedResume, setSelectedResume] = useState(null);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [hiddenTitles, setHiddenTitles] = useState([]);
  const [selectedRec, setSelectedRec] = useState(null);
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    loadAllResumes();
    loadHidden();
  }, []);

  const loadAllResumes = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API}/resumes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAllResumes(res.data || []);
      if (res.data && res.data.length > 0) {
        setSelectedResume(res.data[0]);
      }
    } catch (e) { 
      console.error("Load resumes error:", e);
    }
  };

  const loadHidden = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API}/recommendations/hidden`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHiddenTitles(res.data || []);
    } catch (e) { /* ignore */ }
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer?.files?.[0];
    if (f && (f.name.endsWith('.pdf') || f.name.endsWith('.docx'))) setFile(f);
    else toast.error("Only PDF and DOCX files are supported");
  }, []);

  const handleUpload = async () => {
    if (!file) return;
    if (!profileName.trim()) {
      toast.error("Please enter a profile name");
      return;
    }
    setUploading(true);
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("file", file);
      formData.append("profile_name", profileName.trim());
      const res = await axios.post(`${API}/resume/upload`, formData, { 
        headers: { 
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`
        }, 
        timeout: 120000 
      });
      toast.success("Resume analyzed successfully!");
      setFile(null);
      setProfileName("");
      setShowUploadForm(false);
      await loadAllResumes();
      setSelectedResume(res.data);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteResume = async (resumeId) => {
    if (!confirm("Are you sure you want to delete this resume?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API}/resume/${resumeId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Resume deleted");
      await loadAllResumes();
      if (selectedResume?.id === resumeId) {
        setSelectedResume(allResumes[0] || null);
      }
    } catch (e) {
      toast.error("Failed to delete");
    }
  };

  const handleSaveToWishlist = async (rec) => {
    setSavingId(rec.title);
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API}/wishlist`, {
        title: rec.title, company_type: rec.company_type, match_score: rec.match_score,
        salary_range: rec.salary_range, why_match: rec.why_match, search_keywords: rec.search_keywords || []
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`"${rec.title}" saved to wishlist!`);
    } catch (e) {
      toast.error("Failed to save");
    } finally {
      setSavingId(null);
    }
  };

  const handleHide = async (title) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API}/recommendations/hide?title=${encodeURIComponent(title)}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHiddenTitles(prev => [...prev, title]);
      toast.success("Recommendation hidden");
    } catch (e) {
      toast.error("Failed to hide");
    }
  };

  const handleApply = async (rec) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API}/tracker`, {
        position: rec.title, company: rec.company_type, salary: rec.salary_range,
        location: "Australia", technology: (rec.search_keywords || []).join(", "),
        status: "New", source: "AI Recommendation", date_posted: new Date().toISOString().split('T')[0],
        notes: `Match: ${rec.match_score}% - ${rec.why_match}`
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`"${rec.title}" added to tracker as New!`);
    } catch (e) {
      toast.error("Failed to add to tracker");
    }
  };

  const analysis = selectedResume?.analysis;
  const recommendations = (selectedResume?.recommendations || []).filter(r => !hiddenTitles.includes(r.title));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Chivo, sans-serif' }}>
          RESUME <span className="text-primary">ANALYSIS</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Upload your CV and let AI extract your professional profile</p>
      </div>

      {/* Resume Tabs/Selector */}
      {allResumes.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Your Resumes</h3>
            <Button 
              size="sm" 
              variant="outline"
              className="h-7 text-xs"
              onClick={() => setShowUploadForm(!showUploadForm)}
            >
              <Plus className="w-3 h-3 mr-1" /> Add New
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {allResumes.map((resume) => (
              <div key={resume.id} className="relative group">
                <button
                  onClick={() => setSelectedResume(resume)}
                  className={`glass-card px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                    selectedResume?.id === resume.id 
                      ? 'border-primary bg-primary/10 text-primary' 
                      : 'border-white/10 hover:border-primary/50'
                  }`}
                >
                  <Folder className="w-4 h-4" />
                  {resume.profile_name || resume.filename}
                </button>
                {allResumes.length > 1 && (
                  <button
                    onClick={() => handleDeleteResume(resume.id)}
                    className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-destructive/90 hover:bg-destructive text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Form */}
      {(showUploadForm || allResumes.length === 0) && (
        <div className="glass-card rounded-xl p-6 mb-6">
          <h3 className="font-bold text-sm uppercase tracking-wider text-primary mb-4">Upload New Resume</h3>
          
          <div className="mb-4">
            <label className="text-sm text-muted-foreground mb-2 block">Profile Name *</label>
            <input
              type="text"
              placeholder="e.g. Developer, Tester, Full-Stack"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-sm focus:outline-none focus:border-primary"
            />
          </div>
      <div
        data-testid="resume-drop-zone"
        className={`drop-zone rounded-xl p-12 text-center cursor-pointer transition-all ${dragging ? 'active' : ''} ${file ? 'border-secondary/50' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !file && document.getElementById('file-input').click()}
      >
        <input id="file-input" data-testid="file-input" type="file" className="hidden" accept=".pdf,.docx" onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])} />
        {file ? (
          <div className="flex items-center justify-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center">
              <FileText className="w-6 h-6 text-secondary" />
            </div>
            <div className="text-left">
              <div className="font-medium">{file.name}</div>
              <div className="text-sm text-muted-foreground font-mono-data">{(file.size / 1024).toFixed(1)} KB</div>
            </div>
            <Button variant="ghost" size="icon" data-testid="remove-file-btn" onClick={(e) => { e.stopPropagation(); setFile(null); }}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <>
            <Upload className="w-10 h-10 text-primary/50 mx-auto mb-4" />
            <p className="text-muted-foreground mb-1">Drag & drop your resume here</p>
            <p className="text-xs text-muted-foreground/60">PDF or DOCX, max 10MB</p>
          </>
        )}
      </div>

      {file && !resumeData && (
        <div className="mt-4 flex justify-center">
          <Button data-testid="upload-resume-btn" className="bg-primary hover:bg-primary/90 text-white px-8 shadow-[0_0_15px_rgba(59,130,246,0.4)]" onClick={handleUpload} disabled={uploading}>
            {uploading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analyzing with AI...</> : <><Brain className="w-4 h-4 mr-2" />Analyze Resume</>}
          </Button>
        </div>
      )}

      {/* Analysis Results */}
      {analysis && (
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-in">
          {/* Summary */}
          <div className="glass-card rounded-xl p-6 lg:col-span-2" data-testid="resume-summary">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-4 h-4 text-secondary" />
              <h3 className="font-bold text-sm uppercase tracking-wider text-secondary" style={{ fontFamily: 'Chivo, sans-serif' }}>Summary</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{analysis.summary}</p>
            <Badge variant="outline" className="text-primary border-primary/30 mt-3">{analysis.seniority || 'Mid'} Level</Badge>
          </div>

          {/* Skills */}
          <div className="glass-card rounded-xl p-6" data-testid="resume-skills">
            <h3 className="font-bold text-sm uppercase tracking-wider text-primary mb-3" style={{ fontFamily: 'Chivo, sans-serif' }}>Skills</h3>
            <div className="flex flex-wrap gap-2">
              {(analysis.skills || []).map((skill, i) => (
                <Badge key={i} variant="outline" className="text-xs border-white/10 text-muted-foreground">{skill}</Badge>
              ))}
            </div>
          </div>

          {/* Experience */}
          <div className="glass-card rounded-xl p-6" data-testid="resume-experience">
            <h3 className="font-bold text-sm uppercase tracking-wider text-primary mb-3" style={{ fontFamily: 'Chivo, sans-serif' }}>Experience</h3>
            <div className="space-y-3">
              {(analysis.experience || []).slice(0, 5).map((exp, i) => (
                <div key={i} className="border-l-2 border-primary/20 pl-3">
                  <div className="font-medium text-sm">{exp.role}</div>
                  <div className="text-xs text-muted-foreground">{exp.company} {exp.duration ? `| ${exp.duration}` : ''}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Titles */}
          <div className="glass-card rounded-xl p-6 lg:col-span-2" data-testid="resume-titles">
            <div className="flex items-center gap-2 mb-3">
              <Briefcase className="w-4 h-4 text-accent" />
              <h3 className="font-bold text-sm uppercase tracking-wider text-accent" style={{ fontFamily: 'Chivo, sans-serif' }}>Recommended Job Titles</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {(analysis.preferred_titles || []).map((title, i) => (
                <Badge key={i} className="bg-accent/10 text-accent border border-accent/20">{title}</Badge>
              ))}
            </div>
          </div>

          {/* AI Recommendations - ENHANCED */}
          {recommendations.length > 0 && (
            <div className="lg:col-span-2" data-testid="ai-recommendations">
              <div className="flex items-center gap-2 mb-4">
                <Star className="w-5 h-5 text-yellow-500" />
                <h2 className="font-bold text-lg uppercase tracking-wider text-yellow-500" style={{ fontFamily: 'Chivo, sans-serif' }}>AI Job Recommendations</h2>
                <span className="text-xs text-muted-foreground ml-2">({recommendations.length} matches)</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {recommendations.map((rec, i) => (
                  <div key={i} className="glass-card rounded-xl p-5 group relative flex flex-col" data-testid={`recommendation-card-${i}`}>
                    {/* Header */}
                    <div className="flex items-start justify-between mb-2">
                      <button
                        className="font-medium text-sm text-left hover:text-primary transition-colors cursor-pointer flex-1"
                        onClick={() => setSelectedRec(rec)}
                        data-testid={`rec-detail-${i}`}
                      >
                        {rec.title}
                        <ExternalLink className="w-3 h-3 inline ml-1 opacity-0 group-hover:opacity-50" />
                      </button>
                      <Badge variant="outline" className="text-xs text-secondary border-secondary/30 shrink-0 ml-2 font-mono-data">{rec.match_score}%</Badge>
                    </div>

                    {/* Info */}
                    <div className="text-xs text-muted-foreground mb-1">{rec.company_type}</div>
                    <div className="text-xs text-primary/70 font-mono-data mb-1">{rec.salary_range}</div>
                    <div className="text-xs text-muted-foreground/60 mb-4 flex-1">{rec.why_match}</div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-1.5 mt-auto pt-3 border-t border-white/5">
                      <Button
                        variant="ghost" size="sm"
                        className="h-7 text-xs text-muted-foreground hover:text-primary hover:bg-primary/10 px-2"
                        onClick={() => setSelectedRec(rec)}
                        data-testid={`rec-view-${i}`}
                      >
                        <Search className="w-3 h-3 mr-1" /> Details
                      </Button>
                      <Button
                        variant="ghost" size="sm"
                        className="h-7 text-xs text-muted-foreground hover:text-pink-400 hover:bg-pink-400/10 px-2"
                        onClick={() => handleSaveToWishlist(rec)}
                        disabled={savingId === rec.title}
                        data-testid={`rec-save-${i}`}
                      >
                        <Heart className={`w-3 h-3 mr-1 ${savingId === rec.title ? 'animate-pulse' : ''}`} /> Save
                      </Button>
                      <Button
                        variant="ghost" size="sm"
                        className="h-7 text-xs text-muted-foreground hover:text-secondary hover:bg-secondary/10 px-2"
                        onClick={() => handleApply(rec)}
                        data-testid={`rec-apply-${i}`}
                      >
                        <Briefcase className="w-3 h-3 mr-1" /> Apply
                      </Button>
                      <Button
                        variant="ghost" size="sm"
                        className="h-7 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 px-2 ml-auto"
                        onClick={() => handleHide(rec.title)}
                        data-testid={`rec-hide-${i}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recommendation Detail Modal */}
      {selectedRec && (
        <RecommendationModal
          rec={selectedRec}
          open={!!selectedRec}
          onClose={() => setSelectedRec(null)}
          onSave={handleSaveToWishlist}
          onApply={handleApply}
          resumeAnalysis={analysis}
        />
      )}
    </div>
  );
}
