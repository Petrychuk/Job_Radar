import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Heart, Trash2, Briefcase, ExternalLink, FileDown, Loader2, Globe, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import RecommendationModal from "@/components/RecommendationModal";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Wishlist() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRec, setSelectedRec] = useState(null);

  useEffect(() => { loadWishlist(); }, []);

  const loadWishlist = async () => {
    try {
      const res = await axios.get(`${API}/wishlist`);
      setItems(res.data || []);
    } catch (e) {
      toast.error("Failed to load wishlist");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id) => {
    try {
      await axios.delete(`${API}/wishlist/${id}`);
      setItems(prev => prev.filter(i => i.id !== id));
      toast.success("Removed from wishlist");
    } catch (e) {
      toast.error("Failed to remove");
    }
  };

  const handleApply = async (item) => {
    try {
      await axios.post(`${API}/wishlist/${item.id}/apply`);
      // Remove from local state since backend deletes it
      setItems(prev => prev.filter(i => i.id !== item.id));
      toast.success(`"${item.title}" added to tracker!`);
    } catch (e) {
      toast.error("Failed to apply");
    }
  };

  const handleSaveToWishlist = async (rec) => {
    // Already in wishlist, just show toast
    toast.info("Already in your wishlist");
  };

  const handleApplyRec = async (rec) => {
    try {
      await axios.post(`${API}/tracker`, {
        position: rec.title, company: rec.company_type, salary: rec.salary_range,
        location: "Australia", technology: (rec.search_keywords || []).join(", "),
        status: "New", source: "AI Recommendation", date_posted: new Date().toISOString().split('T')[0],
        notes: `Match: ${rec.match_score}% - ${rec.why_match}`
      });
      toast.success(`"${rec.title}" added to tracker!`);
    } catch (e) {
      toast.error("Failed to add to tracker");
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Chivo, sans-serif' }}>
          <Heart className="w-6 h-6 inline text-pink-400 mr-2" />
          WISH<span className="text-pink-400">LIST</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your saved job recommendations
          {items.length > 0 && <span className="font-mono-data ml-2">({items.length} saved)</span>}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading...
        </div>
      ) : items.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center text-muted-foreground">
          <Heart className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p>Your wishlist is empty.</p>
          <p className="text-xs mt-2">Save recommendations from the Resume Analysis tab.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Saved Items */}
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider text-pink-400 mb-3" style={{ fontFamily: 'Chivo, sans-serif' }}>
              <Star className="w-4 h-4 inline mr-1" /> Saved ({items.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {items.map((item) => (
                <div key={item.id} className="glass-card rounded-xl p-5 flex flex-col group" data-testid={`wishlist-item-${item.id}`}>
                  <div className="flex items-start justify-between mb-2">
                    <button className="font-medium text-sm text-left hover:text-primary transition-colors" onClick={() => setSelectedRec(item)}>
                      {item.title}
                    </button>
                    <Badge variant="outline" className="text-xs text-secondary border-secondary/30 font-mono-data shrink-0 ml-2">{item.match_score}%</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mb-1">{item.company_type}</div>
                  <div className="text-xs text-primary/70 font-mono-data mb-1">{item.salary_range}</div>
                  <div className="text-xs text-muted-foreground/60 mb-4 flex-1">{item.why_match}</div>

                  <div className="flex gap-1.5 mt-auto pt-3 border-t border-white/5">
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-primary" onClick={() => setSelectedRec(item)} data-testid={`wl-detail-${item.id}`}>
                      <Globe className="w-3 h-3 mr-1" /> Details
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-secondary" onClick={() => handleApply(item)} data-testid={`wl-apply-${item.id}`}>
                      <Briefcase className="w-3 h-3 mr-1" /> Apply
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-destructive ml-auto" onClick={() => handleRemove(item.id)} data-testid={`wl-remove-${item.id}`}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedRec && (
        <RecommendationModal
          rec={selectedRec}
          open={!!selectedRec}
          onClose={() => setSelectedRec(null)}
          onSave={handleSaveToWishlist}
          onApply={handleApplyRec}
        />
      )}
    </div>
  );
}
