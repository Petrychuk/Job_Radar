import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Settings, Mail, Bell, Save, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function UserSettings({ user }) {
  const [settings, setSettings] = useState({
    notification_email: user?.notification_email || user?.email || "",
    cron_email_enabled: user?.cron_email_enabled || false
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${API}/auth/settings`, settings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update local storage
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      storedUser.notification_email = settings.notification_email;
      storedUser.cron_email_enabled = settings.cron_email_enabled;
      localStorage.setItem("user", JSON.stringify(storedUser));
      
      setSaved(true);
      toast.success("Settings saved!");
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Chivo, sans-serif' }}>
          <Settings className="w-6 h-6 inline text-primary mr-2" />
          USER <span className="text-primary">SETTINGS</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account and notification preferences</p>
      </div>

      <div className="max-w-xl space-y-6">
        {/* Account Info */}
        <div className="glass-card rounded-xl p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Account</h2>
          <div className="space-y-4">
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Email</Label>
              <Input
                value={user?.email || ""}
                disabled
                className="bg-black/30 border-white/10 text-muted-foreground"
              />
              <p className="text-xs text-muted-foreground mt-1">Your login email cannot be changed</p>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Name</Label>
              <Input
                value={user?.name || ""}
                disabled
                className="bg-black/30 border-white/10 text-muted-foreground"
              />
            </div>
          </div>
        </div>

        {/* Email Notifications */}
        <div className="glass-card rounded-xl p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
            <Bell className="w-4 h-4" /> Email Notifications
          </h2>
          
          <div className="space-y-5">
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">
                <Mail className="w-3 h-3 inline mr-1" /> Notification Email
              </Label>
              <Input
                data-testid="notification-email"
                type="email"
                value={settings.notification_email}
                onChange={(e) => setSettings({ ...settings, notification_email: e.target.value })}
                placeholder="your@email.com"
                className="bg-black/50 border-white/10"
              />
              <p className="text-xs text-muted-foreground mt-1">Auto-search results will be sent to this email</p>
            </div>

            <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-lg border border-white/5">
              <div>
                <div className="text-sm font-medium">Auto-Search Email Alerts</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Receive email when cron jobs find new vacancies
                </div>
              </div>
              <Switch
                data-testid="cron-email-toggle"
                checked={settings.cron_email_enabled}
                onCheckedChange={(checked) => setSettings({ ...settings, cron_email_enabled: checked })}
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="w-full bg-primary hover:bg-primary/90 h-11"
          data-testid="save-settings-btn"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : saved ? (
            <CheckCircle className="w-4 h-4 mr-2" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          {saving ? "Saving..." : saved ? "Saved!" : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}
