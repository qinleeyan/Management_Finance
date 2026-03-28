// src/components/dashboard/ForecastPanel.tsx
"use client";

import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { BrainCircuit, RefreshCw, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';

interface ForecastPoint { date: string; predicted_saldo: number; }

export function ForecastPanel() {
    const [data, setData] = useState<ForecastPoint[]>([]);
    const [variance, setVariance] = useState(0);
    const [loading, setLoading] = useState(true);
    const [days, setDays] = useState(30);

    const load = (d: number) => {
        setLoading(true);
        api.getForecast(d)
            .then(res => {
                if (res.status === 'success') {
                    setData(res.forecast);
                    setVariance(res.historical_variance);
                }
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(days); }, [days]);

    const fmt = (n: number) => {
        if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
        if (n >= 1e6) return `${(n / 1e6).toFixed(0)}M`;
        return n.toFixed(0);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header Card */}
            <div className="glass-card p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30">
                            <BrainCircuit size={24} className="text-yellow-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">AI Cash Flow Forecast</h3>
                            <p className="text-sm text-text-secondary">Linear Regression Model • scikit-learn</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {[7, 30, 60, 90].map(d => (
                            <button key={d} onClick={() => setDays(d)} className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${days === d ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400' : 'border-[var(--glass-border)] text-text-secondary hover:text-white'
                                }`}>
                                {d}D
                            </button>
                        ))}
                        <button onClick={() => load(days)} className="p-1.5 rounded-lg border border-[var(--glass-border)] text-text-secondary hover:text-yellow-400 transition-all">
                            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>

                {/* Model Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                    <StatBox label="Model" value="LinearRegression" />
                    <StatBox label="R² Score" value={`${(variance * 100).toFixed(1)}%`} />
                    <StatBox label="Forecast Days" value={`${days}`} />
                    <StatBox label="Data Points" value={`${data.length}`} />
                </div>
            </div>

            {/* Forecast Chart */}
            <div className="glass-card p-6 h-[350px] sm:h-[400px]">
                <h4 className="text-sm font-semibold text-yellow-400 mb-4 flex items-center gap-2">
                    <Sparkles size={14} /> Predicted Cash Balance (Next {days} Days)
                </h4>
                <div className="w-full h-[280px] sm:h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                            <defs>
                                <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false}
                                tickFormatter={(v: string) => { const d = new Date(v); return `${d.getDate()}/${d.getMonth() + 1}`; }} />
                            <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={fmt} />
                            <Tooltip contentStyle={{ backgroundColor: 'rgba(15,22,41,0.95)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: '8px', color: '#fff' }}
                                formatter={(v: number) => [`Rp ${new Intl.NumberFormat('id-ID').format(v)}`, 'Predicted Balance']} />
                            <Area type="monotone" dataKey="predicted_saldo" stroke="#fbbf24" strokeWidth={2.5} fillOpacity={1} fill="url(#forecastGrad)" animationDuration={1200} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}

function StatBox({ label, value }: { label: string; value: string }) {
    return (
        <div className="p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--glass-border)]">
            <p className="text-[10px] text-text-muted uppercase tracking-wider">{label}</p>
            <p className="text-sm font-bold text-white mt-0.5">{value}</p>
        </div>
    );
}
