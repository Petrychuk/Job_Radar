import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExternalLink, Heart, Briefcase, FileDown, Loader2, Globe, Copy, Download, Shield, Target } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function RecommendationModal({ rec, open, onClose, onSave, onApply }) {
  const [searchLinks, setSearchLinks] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [generatedDocs, setGeneratedDocs] = useState(null);
  const [activeDocTab, setActiveDocTab] = useState("resume");

  useEffect(() => {
    if (rec) {
      loadSearchLinks();
      setGeneratedDocs(null);
    }
  }, [rec]);

  const loadSearchLinks = async () => {
    try {
      const res = await axios.get(`${API}/jobs/search-links`, { params: { keyword: rec.title } });
      setSearchLinks(res.data || []);
    } catch (e) { /* ignore */ }
  };

  const handleGenerateDocs = async (type) => {
    setGenerating(true);
    try {
      const res = await axios.post(`${API}/documents/generate`, {
        job_title: rec.title,
        company_type: rec.company_type,
        salary_range: rec.salary_range,
        why_match: rec.why_match,
        doc_type: type
      }, { timeout: 120000 });
      setGeneratedDocs(res.data);
      toast.success("Documents generated!");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const downloadAsFile = (text, filename) => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!rec) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#09090b] border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="recommendation-modal">
        <DialogHeader>
          <DialogTitle className="font-bold text-lg tracking-tight" style={{ fontFamily: 'Chivo, sans-serif' }}>
            {rec.title}
          </DialogTitle>
        </DialogHeader>

        {/* Job Info */}
        <div className="space-y-3 py-2">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-secondary border-secondary/30 font-mono-data">{rec.match_score}% Match</Badge>
            <Badge variant="outline" className="text-primary border-primary/30 font-mono-data">{rec.salary_range}</Badge>
          </div>
          <div className="text-sm text-muted-foreground">{rec.company_type}</div>
          <div className="text-sm text-muted-foreground leading-relaxed">{rec.why_match}</div>
          {rec.search_keywords?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {rec.search_keywords.map((kw, i) => (
                <Badge key={i} variant="outline" className="text-xs border-white/10 text-muted-foreground">{kw}</Badge>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button size="sm" className="bg-pink-500/20 text-pink-400 hover:bg-pink-500/30 border border-pink-500/30" onClick={() => onSave(rec)} data-testid="modal-save-btn">
              <Heart className="w-3.5 h-3.5 mr-1.5" /> Save to Wishlist
            </Button>
            <Button size="sm" className="bg-secondary/20 text-secondary hover:bg-secondary/30 border border-secondary/30" onClick={() => { onApply(rec); onClose(); }} data-testid="modal-apply-btn">
              <Briefcase className="w-3.5 h-3.5 mr-1.5" /> Apply (Add to Tracker)
            </Button>
          </div>
        </div>

        {/* Search Links */}
        <div className="pt-4 border-t border-white/5">
          <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-3" style={{ fontFamily: 'Chivo, sans-serif' }}>
            Search "{rec.title}" on Job Sites
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {searchLinks.map((link, i) => (
              <a
                key={i}
                href={link.search_url}
                target="_blank"
                rel="noopener noreferrer"
                data-testid={`modal-search-${link.site_id}`}
                className="flex items-center gap-2 p-2.5 rounded-lg bg-white/[0.02] border border-white/5 hover:border-primary/30 hover:bg-primary/5 transition-all text-xs group"
              >
                <Globe className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary shrink-0" />
                <span className="truncate">{link.site_name}</span>
                <ExternalLink className="w-3 h-3 text-muted-foreground/30 ml-auto shrink-0" />
              </a>
            ))}
          </div>
        </div>

        {/* Document Generation */}
        <div className="pt-4 border-t border-white/5">
          <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-3" style={{ fontFamily: 'Chivo, sans-serif' }}>
            Generate ATS Documents
          </h4>

          {!generatedDocs ? (
            <div className="flex gap-2">
              <Button
                size="sm" variant="outline"
                className="border-primary/30 text-primary hover:bg-primary/10"
                onClick={() => handleGenerateDocs("both")}
                disabled={generating}
                data-testid="generate-docs-btn"
              >
                {generating ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5 mr-1.5" />}
                {generating ? "Generating..." : "Resume + Cover Letter"}
              </Button>
              <Button
                size="sm" variant="outline"
                className="border-white/10 text-muted-foreground hover:text-primary hover:border-primary/30"
                onClick={() => handleGenerateDocs("resume")}
                disabled={generating}
                data-testid="generate-resume-btn"
              >
                Resume Only
              </Button>
              <Button
                size="sm" variant="outline"
                className="border-white/10 text-muted-foreground hover:text-primary hover:border-primary/30"
                onClick={() => handleGenerateDocs("cover_letter")}
                disabled={generating}
                data-testid="generate-cl-btn"
              >
                Cover Letter Only
              </Button>
            </div>
          ) : (
            <Tabs value={activeDocTab} onValueChange={setActiveDocTab}>
              <TabsList className="bg-white/[0.03] border border-white/5">
                {generatedDocs.resume && <TabsTrigger value="resume" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary text-xs">Resume</TabsTrigger>}
                {generatedDocs.cover_letter && <TabsTrigger value="cover_letter" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary text-xs">Cover Letter</TabsTrigger>}
              </TabsList>

              {generatedDocs.resume && (
                <TabsContent value="resume" className="mt-3">
                  <div className="flex gap-2 mb-2">
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => copyToClipboard(generatedDocs.resume)} data-testid="copy-resume-btn">
                      <Copy className="w-3 h-3 mr-1" /> Copy
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => downloadAsFile(generatedDocs.resume, `Resume_${rec.title.replace(/\s+/g, '_')}.txt`)} data-testid="download-resume-btn">
                      <Download className="w-3 h-3 mr-1" /> Download
                    </Button>
                  </div>
                  <pre className="bg-black/50 border border-white/5 rounded-lg p-4 text-xs text-muted-foreground whitespace-pre-wrap max-h-[300px] overflow-y-auto font-mono-data" data-testid="resume-preview">
                    {generatedDocs.resume}
                  </pre>
                </TabsContent>
              )}

              {generatedDocs.cover_letter && (
                <TabsContent value="cover_letter" className="mt-3">
                  <div className="flex gap-2 mb-2">
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => copyToClipboard(generatedDocs.cover_letter)} data-testid="copy-cl-btn">
                      <Copy className="w-3 h-3 mr-1" /> Copy
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => downloadAsFile(generatedDocs.cover_letter, `CoverLetter_${rec.title.replace(/\s+/g, '_')}.txt`)} data-testid="download-cl-btn">
                      <Download className="w-3 h-3 mr-1" /> Download
                    </Button>
                  </div>
                  <pre className="bg-black/50 border border-white/5 rounded-lg p-4 text-xs text-muted-foreground whitespace-pre-wrap max-h-[300px] overflow-y-auto font-mono-data" data-testid="cl-preview">
                    {generatedDocs.cover_letter}
                  </pre>
                </TabsContent>
              )}
            </Tabs>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
