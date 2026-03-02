import { useState, useEffect } from "react";
import axios from "axios";
import { BarChart3, TrendingUp, Target, XCircle, Briefcase } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

const API = process.env.REACT_APP_BACKEND_URL;

const STATUS_COLORS = {
  'New': '#94a3b8', 'Applied': '#8b5cf6', 'Interview': '#3b82f6',
  'Offer': '#22c55e', 'Rejected': '#ef4444', 'Withdrawn': '#f59e0b', 'No Response': '#6b7280'
};

const CHART_COLORS = ['#3b82f6', '#22c55e', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#18181b] border border-white/10 rounded-lg px-3 py-2 text-xs shadow-xl">
      <div className="text-muted-foreground mb-1">{label || payload[0]?.name}</div>
      <div className="font-mono-data text-primary font-bold">{payload[0]?.value}</div>
    </div>
  );
};

export default function Statistics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API}/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(res.data);
      } catch (e) { /* ignore */ }
      finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading statistics...</div>;
  if (!stats || stats.total === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold tracking-tight mb-4" style={{ fontFamily: 'Chivo, sans-serif' }}>
          ANALYTICS <span className="text-primary">DASHBOARD</span>
        </h1>
        <div className="glass-card rounded-xl p-12 text-center text-muted-foreground">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>No data yet. Start tracking applications to see analytics.</p>
        </div>
      </div>
    );
  }

  const statusData = Object.entries(stats.status_counts).map(([name, value]) => ({ name, value, fill: STATUS_COLORS[name] || '#6b7280' }));
  const sourceData = Object.entries(stats.source_counts).slice(0, 8).map(([name, value]) => ({ name: name.length > 15 ? name.slice(0, 15) + '...' : name, value }));
  const techData = Object.entries(stats.tech_counts).slice(0, 8).map(([name, value]) => ({ name: name.length > 15 ? name.slice(0, 15) + '...' : name, value }));
  const monthlyData = stats.monthly_trend || [];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Chivo, sans-serif' }}>
          ANALYTICS <span className="text-primary">DASHBOARD</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Track your job search progress</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Applications", value: stats.total, icon: Briefcase, color: "text-primary" },
          { label: "Interviews", value: stats.status_counts?.Interview || 0, icon: Target, color: "text-blue-400" },
          { label: "Response Rate", value: `${stats.response_rate}%`, icon: TrendingUp, color: "text-secondary" },
          { label: "Rejection Rate", value: `${stats.rejection_rate}%`, icon: XCircle, color: "text-destructive" },
        ].map((m, i) => (
          <div key={i} className="glass-card rounded-xl p-5" data-testid={`stat-${m.label.toLowerCase().replace(/\s/g, '-')}`}>
            <div className="flex items-center gap-2 mb-2">
              <m.icon className={`w-4 h-4 ${m.color}`} />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">{m.label}</span>
            </div>
            <div className={`text-2xl font-bold font-mono-data ${m.color}`}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Status Distribution */}
        <div className="glass-card rounded-xl p-6" data-testid="chart-status">
          <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-4" style={{ fontFamily: 'Chivo, sans-serif' }}>Status Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value" stroke="none">
                {statusData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-3 mt-2">
            {statusData.map((d, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.fill }} />
                <span className="text-muted-foreground">{d.name}</span>
                <span className="font-mono-data font-bold">{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Trend */}
        {monthlyData.length > 0 && (
          <div className="glass-card rounded-xl p-6" data-testid="chart-monthly">
            <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-4" style={{ fontFamily: 'Chivo, sans-serif' }}>Monthly Trend</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} stroke="transparent" />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} stroke="transparent" />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* By Source */}
        {sourceData.length > 0 && (
          <div className="glass-card rounded-xl p-6" data-testid="chart-source">
            <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-4" style={{ fontFamily: 'Chivo, sans-serif' }}>By Source</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={sourceData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} stroke="transparent" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} width={100} stroke="transparent" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {sourceData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* By Technology */}
        {techData.length > 0 && (
          <div className="glass-card rounded-xl p-6" data-testid="chart-tech">
            <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-4" style={{ fontFamily: 'Chivo, sans-serif' }}>By Technology</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={techData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} stroke="transparent" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} width={100} stroke="transparent" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {techData.map((_, i) => <Cell key={i} fill={CHART_COLORS[(i + 2) % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
