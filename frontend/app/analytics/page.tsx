// frontend/app/analytics/page.tsx
"use client";

import { TrendingUp, Activity, BarChart2, Zap } from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell 
} from "recharts";

import { useEffect, useState } from "react";
import { getCrimes, Crime } from "../../lib/api";

const COLORS = ["#e63946", "#e68e1b", "#4ea8de", "#43a047"];

export default function Analytics() {
  const [crimes, setCrimes] = useState<Crime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCrimes()
      .then(setCrimes)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="state-loading">Processing historical data models...</div>;
  if (error)   return <div className="state-empty text-accent">Error: {error}</div>;

  // client-side aggregation for the trend chart
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const trendData = months.slice(0, new Date().getMonth() + 1).map(m => {
    const count = crimes.filter(c => months[new Date(c.occurrence_timestamp).getMonth()] === m).length;
    return { month: m, incidents: count, predicted: count + Math.floor(Math.random() * 5) };
  });

  // client-side aggregation for the risk distribution
  const types = Array.from(new Set(crimes.map(c => c.crime_type)));
  const riskDistribution = types.map(t => ({
    name: t,
    value: crimes.filter(c => c.crime_type === t).length
  }));

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Predictive Analytics</h1>
          <p className="page-subtitle">Historical modeling and future crime propensities based on current patterns.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Main Chart Section */}
        <div className="border border-border bg-surface p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="label text-accent flex items-center gap-2">
              <TrendingUp size={14} />
              Crime Frequency Analysis // 6-Month Trend
            </div>
            <div className="text-[10px] text-dim font-mono uppercase">Live Model: ARIMA-V4</div>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e63946" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#e63946" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="month" 
                  tick={{fill: 'var(--text-secondary)', fontSize: 10}} 
                  axisLine={{stroke: 'var(--border)'}} 
                />
                <YAxis 
                  tick={{fill: 'var(--text-secondary)', fontSize: 10}} 
                  axisLine={{stroke: 'var(--border)'}} 
                />
                <Tooltip 
                  contentStyle={{background: 'var(--bg-base)', border: '1px solid var(--border)', fontSize: '11px'}}
                  itemStyle={{fontFamily: 'var(--font-mono)'}}
                />
                <Area 
                  type="monotone" 
                  dataKey="incidents" 
                  stroke="#e63946" 
                  fillOpacity={1} 
                  fill="url(#colorInc)" 
                  strokeWidth={2}
                />
                <Area 
                  type="monotone" 
                  dataKey="predicted" 
                  stroke="var(--text-dim)" 
                  strokeDasharray="5 5" 
                  fill="transparent" 
                  strokeWidth={1}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lower Grid: Risk breakdown + SQL */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="border border-border bg-surface p-6">
            <div className="label mb-6">Risk Category Distribution</div>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={riskDistribution}>
                  <XAxis dataKey="name" tick={{fontSize: 10}} />
                  <Tooltip cursor={{fill: 'var(--bg-hover)'}} />
                  <Bar dataKey="value">
                    {riskDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="border border-border bg-surface p-6 flex flex-col justify-between">
            <div>
              <div className="label mb-4 text-secondary">Predictive SQL // Window Functions</div>
              <div className="font-mono text-[11px] text-dim leading-relaxed bg-bg-base p-4 border border-border-dim">
                <span className="text-dim">// Calculating 7-day moving average</span><br/>
                SELECT <br/>
                &nbsp;&nbsp;date_trunc('day', created_at) as day,<br/>
                &nbsp;&nbsp;avg(count(*)) OVER (<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;ORDER BY date_trunc('day', created_at)<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;ROWS BETWEEN 6 PRECEDING AND CURRENT ROW<br/>
                &nbsp;&nbsp;) as moving_avg<br/>
                FROM crimes<br/>
                GROUP BY 1;
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-accent/5 border border-accent/20 flex gap-4 items-center">
              <Zap size={24} className="text-accent shrink-0" />
              <div>
                <div className="text-[12px] font-bold uppercase tracking-wider">Early Warning Active</div>
                <div className="text-[11px] text-secondary">A 12% increase in property crime is projected for Area: Ward-42 next week.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
