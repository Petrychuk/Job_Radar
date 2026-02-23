import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertTriangle, Shield, Target, Lightbulb } from "lucide-react";

export default function ATSReportDialog({ open, onClose, report }) {
  if (!report) return null;

  const score = report.ats_score || 0;
  const scoreColor = score >= 80 ? "text-secondary" : score >= 60 ? "text-yellow-500" : "text-destructive";
  const verdictColor = report.overall_verdict === "Good" ? "bg-secondary/20 text-secondary border-secondary/30" 
    : report.overall_verdict === "Needs Work" ? "bg-yellow-500/20 text-yellow-500 border-yellow-500/30"
    : "bg-destructive/20 text-destructive border-destructive/30";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#09090b] border-white/10 text-white max-w-lg max-h-[85vh] overflow-y-auto" data-testid="ats-report-dialog">
        <DialogHeader>
          <DialogTitle className="font-bold text-lg tracking-tight flex items-center gap-2" style={{ fontFamily: 'Chivo, sans-serif' }}>
            <Shield className="w-5 h-5 text-primary" />
            ATS <span className="text-primary">COMPATIBILITY</span> REPORT
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Score */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`text-5xl font-bold font-mono-data ${scoreColor}`}>{score}</div>
              <div className="text-xs text-muted-foreground uppercase">/ 100<br/>ATS Score</div>
            </div>
            <Badge variant="outline" className={`text-sm px-3 py-1 ${verdictColor}`} data-testid="ats-verdict">
              {report.overall_verdict || "Unknown"}
            </Badge>
          </div>

          {/* Keyword Match */}
          {report.keyword_match?.length > 0 && (
            <div data-testid="ats-matched-keywords">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-secondary" />
                <span className="text-xs font-bold uppercase tracking-wider text-secondary">Matched Keywords</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {report.keyword_match.map((kw, i) => (
                  <Badge key={i} className="bg-secondary/10 text-secondary border border-secondary/20 text-xs">{kw}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Missing Keywords */}
          {report.missing_keywords?.length > 0 && (
            <div data-testid="ats-missing-keywords">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="w-4 h-4 text-destructive" />
                <span className="text-xs font-bold uppercase tracking-wider text-destructive">Missing Keywords</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {report.missing_keywords.map((kw, i) => (
                  <Badge key={i} variant="outline" className="text-xs border-destructive/30 text-destructive">{kw}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Format Issues */}
          {report.format_issues?.length > 0 && (
            <div data-testid="ats-format-issues">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-yellow-500">Format Issues</span>
              </div>
              <ul className="space-y-1 pl-6">
                {report.format_issues.map((issue, i) => (
                  <li key={i} className="text-xs text-muted-foreground list-disc">{issue}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Suggestions */}
          {report.suggestions?.length > 0 && (
            <div data-testid="ats-suggestions">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold uppercase tracking-wider text-primary">Improvement Suggestions</span>
              </div>
              <ul className="space-y-2 bg-primary/5 rounded-lg p-3 border border-primary/10">
                {report.suggestions.map((s, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex gap-2">
                    <span className="text-primary shrink-0 font-bold">{i + 1}.</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Keyword Density */}
          <div className="flex items-center gap-2 pt-2 border-t border-white/5">
            <Target className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              Keyword Density: {report.keyword_density_ok ? 
                <span className="text-secondary font-bold">OK</span> : 
                <span className="text-yellow-500 font-bold">Needs improvement</span>
              }
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
