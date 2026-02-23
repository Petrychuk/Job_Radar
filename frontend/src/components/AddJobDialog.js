import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const STATUSES = ["New", "Applied", "Interview", "Offer", "Rejected", "Withdrawn", "No Response"];

const fields = [
  { key: "position", label: "Position", type: "text", required: true },
  { key: "company", label: "Company", type: "text" },
  { key: "date_posted", label: "Date Posted", type: "date" },
  { key: "salary", label: "Salary", type: "text" },
  { key: "location", label: "Location", type: "text" },
  { key: "technology", label: "Technology / Stack", type: "text" },
  { key: "source", label: "Source (Site)", type: "text" },
  { key: "link", label: "Job Link (URL)", type: "url" },
  { key: "site_url", label: "Company Page URL", type: "url" },
  { key: "contact", label: "Contact (HR)", type: "text" },
];

export default function AddJobDialog({ open, onOpenChange, job, onSave }) {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (job) {
      setForm({ ...job });
    } else {
      setForm({ status: "New", date_posted: new Date().toISOString().split('T')[0] });
    }
  }, [job, open]);

  const handleChange = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (!form.position?.trim()) {
      toast.error("Position is required");
      return;
    }
    setSaving(true);
    try {
      if (job?.id) {
        await axios.put(`${API}/tracker/${job.id}`, form);
        toast.success("Job updated");
      } else {
        await axios.post(`${API}/tracker`, form);
        toast.success("Job added to tracker");
      }
      onSave();
    } catch (e) {
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#09090b] border-white/10 text-white max-w-lg max-h-[85vh] overflow-y-auto" data-testid="add-job-dialog">
        <DialogHeader>
          <DialogTitle className="font-bold tracking-tight" style={{ fontFamily: 'Chivo, sans-serif' }}>
            {job ? "EDIT" : "ADD"} <span className="text-primary">APPLICATION</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Status */}
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Status</Label>
            <Select value={form.status || "New"} onValueChange={(v) => handleChange("status", v)}>
              <SelectTrigger data-testid="status-select" className="bg-black/50 border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#18181b] border-white/10">
                {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Fields */}
          {fields.map(f => (
            <div key={f.key}>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">{f.label}</Label>
              <Input
                data-testid={`field-${f.key}`}
                type={f.type}
                value={form[f.key] || ""}
                onChange={(e) => handleChange(f.key, e.target.value)}
                className="bg-black/50 border-white/10 font-mono-data text-sm"
                placeholder={f.label}
              />
            </div>
          ))}

          {/* Notes */}
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Notes</Label>
            <Textarea
              data-testid="field-notes"
              value={form.notes || ""}
              onChange={(e) => handleChange("notes", e.target.value)}
              className="bg-black/50 border-white/10 font-mono-data text-sm min-h-[80px]"
              placeholder="Additional notes..."
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" className="border-white/10" onClick={() => onOpenChange(false)} data-testid="cancel-btn">Cancel</Button>
          <Button className="bg-primary hover:bg-primary/90 text-white" onClick={handleSave} disabled={saving} data-testid="save-job-btn">
            {saving ? "Saving..." : job ? "Update" : "Add Job"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
