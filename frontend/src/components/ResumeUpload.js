import { useState, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Upload, FileText, Brain, Briefcase, Star, Loader2, X, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ResumeUpload() {
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [resumeData, setResumeData] = useState(null);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer?.files?.[0];
    if (f && (f.name.endsWith('.pdf') || f.name.endsWith('.docx'))) {
      setFile(f);
    } else {
      toast.error("Only PDF and DOCX files are supported");
    }
  }, []);

  const handleFileSelect = (e) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await axios.post(`${API}/resume/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120000,
      });
      setResumeData(res.data);
      toast.success("Resume analyzed successfully!");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const analysis = resumeData?.analysis;
  const recommendations = resumeData?.recommendations;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Chivo, sans-serif' }}>
          RESUME <span className="text-primary">ANALYSIS</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Upload your CV and let AI extract your professional profile</p>
      </div>

      {/* Upload Zone */}
      <div
        data-testid="resume-drop-zone"
        className={`drop-zone rounded-xl p-12 text-center cursor-pointer transition-all ${dragging ? 'active' : ''} ${file ? 'border-secondary/50' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !file && document.getElementById('file-input').click()}
      >
        <input id="file-input" data-testid="file-input" type="file" className="hidden" accept=".pdf,.docx" onChange={handleFileSelect} />

        {file ? (
          <div className="flex items-center justify-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center">
              <FileText className="w-6 h-6 text-secondary" />
            </div>
            <div className="text-left">
              <div className="font-medium">{file.name}</div>
              <div className="text-sm text-muted-foreground font-mono-data">{(file.size / 1024).toFixed(1)} KB</div>
            </div>
            <Button variant="ghost" size="icon" data-testid="remove-file-btn" onClick={(e) => { e.stopPropagation(); setFile(null); setResumeData(null); }}>
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
          <Button
            data-testid="upload-resume-btn"
            className="bg-primary hover:bg-primary/90 text-white px-8 shadow-[0_0_15px_rgba(59,130,246,0.4)]"
            onClick={handleUpload}
            disabled={uploading}
          >
            {uploading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analyzing with AI...</>
            ) : (
              <><Brain className="w-4 h-4 mr-2" />Analyze Resume</>
            )}
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
            <div className="mt-3 flex items-center gap-2">
              <Badge variant="outline" className="text-primary border-primary/30">{analysis.seniority || 'Mid'} Level</Badge>
            </div>
          </div>

          {/* Skills */}
          <div className="glass-card rounded-xl p-6" data-testid="resume-skills">
            <h3 className="font-bold text-sm uppercase tracking-wider text-primary mb-3" style={{ fontFamily: 'Chivo, sans-serif' }}>Skills</h3>
            <div className="flex flex-wrap gap-2">
              {(analysis.skills || []).map((skill, i) => (
                <Badge key={i} variant="outline" className="text-xs border-white/10 text-muted-foreground hover:border-primary/30 transition-colors">{skill}</Badge>
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
                <Badge key={i} className="bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20 transition-colors cursor-default">{title}</Badge>
              ))}
            </div>
          </div>

          {/* AI Recommendations */}
          {recommendations && recommendations.length > 0 && (
            <div className="glass-card rounded-xl p-6 lg:col-span-2" data-testid="ai-recommendations">
              <div className="flex items-center gap-2 mb-4">
                <Star className="w-4 h-4 text-yellow-500" />
                <h3 className="font-bold text-sm uppercase tracking-wider text-yellow-500" style={{ fontFamily: 'Chivo, sans-serif' }}>AI Job Recommendations</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {recommendations.slice(0, 9).map((rec, i) => (
                  <div key={i} className="bg-white/[0.02] rounded-lg p-4 border border-white/5 hover:border-primary/20 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="font-medium text-sm">{rec.title}</div>
                      <Badge variant="outline" className="text-xs text-secondary border-secondary/30 shrink-0 ml-2 font-mono-data">{rec.match_score}%</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mb-1">{rec.company_type}</div>
                    <div className="text-xs text-primary/70 font-mono-data">{rec.salary_range}</div>
                    <div className="text-xs text-muted-foreground/60 mt-2">{rec.why_match}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
