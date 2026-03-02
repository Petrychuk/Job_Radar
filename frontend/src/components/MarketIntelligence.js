import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { TrendingUp, MapPin, Building2, Briefcase, Zap, Target, Brain, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Treemap } from "recharts";

import API from '@/lib/api';
const COLORS = ['#3b82f6', '#22c55e', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#6366f1'];

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#18181b] border border-white/10 rounded-lg px-3 py-2 text-xs shadow-xl">
      <div className="text-muted-foreground">{label || payload[0]?.name}</div>
      <div className="font-mono-data text-primary font-bold">{payload[0]?.value}</div>
    </div>
  );
};

export default function MarketIntelligence() {
  const [data, setData] = useState(null);
  const [insights, setInsights] = useState(null);
  const [skillGap, setSkillGap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [loadingSkillGap, setLoadingSkillGap] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const res = await axios.get(`${API}/market/intelligence`);
      setData(res.data);
    } catch (e) { /* ignore */ }
    finally { setLoading(false); }
  };

  const loadInsights = async () => {
    setLoadingInsights(true);
    try {
      const res = await axios.get(`${API}/market/ai-insights`, { timeout: 60000 });
      setInsights(res.data);
    } catch (e) { toast.error("Failed to generate insights"); }
    finally { setLoadingInsights(false); }
  };

  const loadSkillGap = async () => {
    setLoadingSkillGap(true);
    try {
      const res = await axios.post(`${API}/skills/gap-analysis`, { target_role: "" }, { timeout: 60000 });
      setSkillGap(res.data);
    } catch (e) { toast.error("Upload a resume first for skill gap analysis"); }
    finally { setLoadingSkillGap(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin mr-2" />Loading market data...</div>;

  const funnel = data?.funnel || {};
  const srcEff = data?.source_effectiveness || {};
  const rolePerf = data?.role_performance || {};

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Chivo, sans-serif' }}>
          MARKET <span className="text-primary">INTELLIGENCE</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Strategic insights from your job search data</p>
      </div>

      {(!data || data.total_applications === 0) ? (
        <div className="glass-card rounded-xl p-12 text-center text-muted-foreground">
          <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p>Start tracking applications to see market intelligence.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Key Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Applications", value: data.total_applications, icon: Briefcase, color: "text-primary" },
              { label: "Top Tech", value: data.tech_trends?.[0]?.name || '-', icon: Zap, color: "text-secondary" },
              { label: "Top Location", value: data.location_analysis?.[0]?.name || '-', icon: MapPin, color: "text-accent" },
              { label: "Top Company", value: data.company_rankings?.[0]?.name || '-', icon: Building2, color: "text-yellow-500" },
            ].map((m, i) => (
              <div key={i} className="glass-card rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <m.icon className={`w-4 h-4 ${m.color}`} />
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">{m.label}</span>
                </div>
                <div className={`text-lg font-bold font-mono-data ${m.color} truncate`}>{m.value}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Tech Demand */}
            {data.tech_trends?.length > 0 && (
              <div className="glass-card rounded-xl p-5" data-testid="chart-tech-demand">
                <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-4" style={{ fontFamily: 'Chivo, sans-serif' }}>Tech Demand</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={data.tech_trends.slice(0, 10)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} stroke="transparent" />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} width={100} stroke="transparent" />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>{data.tech_trends.slice(0, 10).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Location Analysis */}
            {data.location_analysis?.length > 0 && (
              <div className="glass-card rounded-xl p-5" data-testid="chart-locations">
                <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-4" style={{ fontFamily: 'Chivo, sans-serif' }}>Jobs by Location</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={data.location_analysis} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="count" stroke="none">
                      {data.location_analysis.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-3 mt-1">
                  {data.location_analysis.map((d, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-muted-foreground">{d.name}</span> <span className="font-mono-data font-bold">{d.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Company Rankings */}
            {data.company_rankings?.length > 0 && (
              <div className="glass-card rounded-xl p-5" data-testid="chart-companies">
                <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-4" style={{ fontFamily: 'Chivo, sans-serif' }}>Top Companies</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={data.company_rankings} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} stroke="transparent" />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} width={110} stroke="transparent" />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Application Funnel */}
            <div className="glass-card rounded-xl p-5" data-testid="chart-funnel">
              <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-4" style={{ fontFamily: 'Chivo, sans-serif' }}>Application Funnel</h3>
              <div className="space-y-3">
                {[
                  { label: "New", count: funnel["New"] || 0, color: "#94a3b8" },
                  { label: "Applied", count: funnel["Applied"] || 0, color: "#8b5cf6" },
                  { label: "Interview", count: funnel["Interview"] || 0, color: "#3b82f6" },
                  { label: "Offer", count: funnel["Offer"] || 0, color: "#22c55e" },
                  { label: "Rejected", count: funnel["Rejected"] || 0, color: "#ef4444" },
                ].map((stage, i) => {
                  const maxCount = Math.max(...Object.values(funnel), 1);
                  const width = Math.max((stage.count / maxCount) * 100, 5);
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-20 text-xs text-muted-foreground text-right">{stage.label}</div>
                      <div className="flex-1 bg-white/[0.03] rounded-full h-6 overflow-hidden">
                        <div className="h-full rounded-full flex items-center px-3 transition-all" style={{ width: `${width}%`, background: stage.color }}>
                          <span className="text-xs font-bold font-mono-data text-white">{stage.count}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Source Effectiveness */}
            {Object.keys(srcEff).length > 0 && (
              <div className="glass-card rounded-xl p-5 lg:col-span-2" data-testid="source-effectiveness">
                <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-4" style={{ fontFamily: 'Chivo, sans-serif' }}>Source Effectiveness</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {Object.entries(srcEff).filter(([k]) => k).map(([src, d], i) => {
                    const rate = d.total > 0 ? Math.round((d.interview + d.offer) / d.total * 100) : 0;
                    return (
                      <div key={i} className="bg-white/[0.02] rounded-lg p-3 border border-white/5">
                        <div className="font-medium text-xs truncate mb-1">{src}</div>
                        <div className="flex items-baseline gap-2">
                          <span className={`text-xl font-bold font-mono-data ${rate >= 30 ? 'text-secondary' : rate >= 15 ? 'text-primary' : 'text-muted-foreground'}`}>{rate}%</span>
                          <span className="text-xs text-muted-foreground">response</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 font-mono-data">{d.total} total / {d.interview} interviews / {d.offer} offers</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Role Performance */}
            {Object.keys(rolePerf).length > 0 && (
              <div className="glass-card rounded-xl p-5 lg:col-span-2" data-testid="role-performance">
                <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-4" style={{ fontFamily: 'Chivo, sans-serif' }}>
                  <Target className="w-4 h-4 inline mr-1" /> Conversion by Role Type
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {Object.entries(rolePerf).map(([role, d], i) => {
                    const rate = d.total > 0 ? Math.round((d.interview + d.offer) / d.total * 100) : 0;
                    return (
                      <div key={i} className="bg-white/[0.02] rounded-lg p-3 border border-white/5">
                        <div className="font-medium text-xs mb-1">{role}</div>
                        <div className="text-2xl font-bold font-mono-data" style={{ color: rate >= 30 ? '#22c55e' : rate >= 15 ? '#3b82f6' : '#94a3b8' }}>{rate}%</div>
                        <div className="text-xs text-muted-foreground font-mono-data">{d.total} apps / {d.interview} int / {d.offer} offers</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* AI Insights */}
          <div className="glass-card rounded-xl p-5" data-testid="ai-insights">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-xs uppercase tracking-wider text-yellow-500" style={{ fontFamily: 'Chivo, sans-serif' }}>
                <Brain className="w-4 h-4 inline mr-1" /> AI Strategic Insights
              </h3>
              <Button variant="outline" size="sm" className="border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10" onClick={loadInsights} disabled={loadingInsights} data-testid="generate-insights-btn">
                {loadingInsights ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Brain className="w-3.5 h-3.5 mr-1" />}
                {loadingInsights ? "Analyzing..." : insights ? "Refresh" : "Generate Insights"}
              </Button>
            </div>
            {insights ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">{insights.market_summary}</p>
                {insights.strategic_advice?.length > 0 && (
                  <div>
                    <div className="text-xs font-bold text-primary uppercase mb-2">Strategic Advice</div>
                    <ul className="space-y-1">{insights.strategic_advice.map((a, i) => <li key={i} className="text-xs text-muted-foreground flex gap-2"><span className="text-primary shrink-0">-</span>{a}</li>)}</ul>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {insights.hot_skills?.length > 0 && (
                    <div className="bg-secondary/5 rounded-lg p-3 border border-secondary/20">
                      <div className="text-xs font-bold text-secondary uppercase mb-2">Hot Skills</div>
                      <div className="flex flex-wrap gap-1">{insights.hot_skills.map((s, i) => <Badge key={i} variant="outline" className="text-xs border-secondary/30 text-secondary">{s}</Badge>)}</div>
                    </div>
                  )}
                  {insights.weak_spots?.length > 0 && (
                    <div className="bg-destructive/5 rounded-lg p-3 border border-destructive/20">
                      <div className="text-xs font-bold text-destructive uppercase mb-2">Weak Spots</div>
                      <ul className="space-y-1">{insights.weak_spots.map((w, i) => <li key={i} className="text-xs text-muted-foreground">{w}</li>)}</ul>
                    </div>
                  )}
                  {insights.best_strategy && (
                    <div className="bg-primary/5 rounded-lg p-3 border border-primary/20">
                      <div className="text-xs font-bold text-primary uppercase mb-2">Best Strategy</div>
                      <p className="text-xs text-muted-foreground">{insights.best_strategy}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Click "Generate Insights" for AI-powered strategic analysis based on your application data.</p>
            )}
          </div>

          {/* Skill Gap */}
          <div className="glass-card rounded-xl p-5" data-testid="skill-gap">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-xs uppercase tracking-wider text-accent" style={{ fontFamily: 'Chivo, sans-serif' }}>
                <Target className="w-4 h-4 inline mr-1" /> Skill Gap Planner
              </h3>
              <Button variant="outline" size="sm" className="border-accent/30 text-accent hover:bg-accent/10" onClick={loadSkillGap} disabled={loadingSkillGap} data-testid="analyze-skill-gap-btn">
                {loadingSkillGap ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Target className="w-3.5 h-3.5 mr-1" />}
                {loadingSkillGap ? "Analyzing..." : skillGap ? "Refresh" : "Analyze Skill Gaps"}
              </Button>
            </div>
            {skillGap ? (
              <div className="space-y-4">
                {skillGap.current_strengths?.length > 0 && (
                  <div>
                    <div className="text-xs font-bold text-secondary uppercase mb-2">Your Strengths</div>
                    <div className="flex flex-wrap gap-1">{skillGap.current_strengths.map((s, i) => <Badge key={i} className="bg-secondary/10 text-secondary border border-secondary/20 text-xs">{s}</Badge>)}</div>
                  </div>
                )}
                {skillGap.skill_gaps?.length > 0 && (
                  <div>
                    <div className="text-xs font-bold text-destructive uppercase mb-2">Skill Gaps</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {skillGap.skill_gaps.map((g, i) => (
                        <div key={i} className="bg-white/[0.02] rounded-lg p-3 border border-white/5">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-xs">{g.skill}</span>
                            <Badge variant="outline" className={`text-xs ${g.importance === 'Critical' ? 'text-destructive border-destructive/30' : g.importance === 'High' ? 'text-yellow-500 border-yellow-500/30' : 'text-muted-foreground border-white/10'}`}>{g.importance}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{g.reason}</p>
                          {g.learning_time && <p className="text-xs text-primary/70 font-mono-data mt-1">{g.learning_time}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {skillGap.study_plan?.length > 0 && (
                  <div>
                    <div className="text-xs font-bold text-primary uppercase mb-2">Study Plan</div>
                    <div className="space-y-2">
                      {skillGap.study_plan.map((p, i) => (
                        <div key={i} className="bg-primary/5 rounded-lg p-3 border border-primary/10">
                          <div className="font-medium text-xs text-primary mb-1">{p.skill}</div>
                          {p.resources?.length > 0 && <div className="text-xs text-muted-foreground">Resources: {p.resources.join(', ')}</div>}
                          {p.project_idea && <div className="text-xs text-muted-foreground mt-1">Project: {p.project_idea}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {skillGap.priority_order?.length > 0 && (
                  <div>
                    <div className="text-xs font-bold text-yellow-500 uppercase mb-2">Priority Order (by ROI)</div>
                    <div className="flex flex-wrap gap-2">
                      {skillGap.priority_order.map((s, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-xs">
                          <span className="font-mono-data text-yellow-500 font-bold">{i + 1}.</span>
                          <span className="text-muted-foreground">{s}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Click "Analyze Skill Gaps" to get AI-powered recommendations on what to learn next based on market demand.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
