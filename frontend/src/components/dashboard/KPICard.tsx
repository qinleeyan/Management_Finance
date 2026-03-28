// src/components/dashboard/KPICard.tsx
"use client";

import { ReactNode, useEffect, useRef, useState } from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

interface KPICardProps {
    title: string;
    value: string | number;
    icon: ReactNode;
    trend?: { value: string; isPositive: boolean };
    subtitle?: string;
    accentColor?: string;
    sparklineData?: number[];
    statusColor?: 'green' | 'amber' | 'red';
}

export function KPICard({ title, value, icon, trend, subtitle, accentColor = '#06b6d4', sparklineData, statusColor }: KPICardProps) {
    const [visible, setVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.2 });
        if (ref.current) obs.observe(ref.current);
        return () => obs.disconnect();
    }, []);

    const sparkData = sparklineData?.map((v, i) => ({ v, i })) ?? [];

    return (
        <div
            ref={ref}
            className="metric-card group cursor-default"
            style={{ '--metric-accent': accentColor } as React.CSSProperties}
        >
            {/* Top row: title + icon */}
            <div className="flex justify-between items-start mb-1">
                <div className="flex items-center gap-2">
                    {statusColor && <span className={`status-dot ${statusColor}`} />}
                    <p className="text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color: '#555e72' }}>{title}</p>
                </div>
                <div
                    className="p-2 rounded-xl transition-all duration-500"
                    style={{
                        background: `linear-gradient(135deg, ${accentColor}12, ${accentColor}06)`,
                        border: `1px solid ${accentColor}15`,
                        color: accentColor,
                    }}
                >
                    {icon}
                </div>
            </div>

            {/* Value */}
            <h3 className={`text-[22px] font-extrabold tracking-tight text-white mb-1 ${visible ? 'animate-count-up' : 'opacity-0'}`}>
                {value}
            </h3>

            {/* Sparkline */}
            {sparkData.length > 1 && (
                <div className="h-7 w-full mb-1.5 opacity-50 group-hover:opacity-80 transition-opacity duration-500">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={sparkData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id={`spark-${title.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={accentColor} stopOpacity={0.25} />
                                    <stop offset="100%" stopColor={accentColor} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <Area
                                type="monotone"
                                dataKey="v"
                                stroke={accentColor}
                                strokeWidth={1.5}
                                fill={`url(#spark-${title.replace(/\s/g, '')})`}
                                animationDuration={1000}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Trend / Subtitle */}
            {trend ? (
                <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md ${trend.isPositive
                            ? 'bg-emerald-500/8 text-emerald-400'
                            : 'bg-rose-500/8 text-rose-400'
                        }`}>
                        {trend.isPositive ? '↑' : '↓'} {trend.value}
                    </span>
                    <span className="text-[9px] text-[var(--text-muted)]">vs bulan lalu</span>
                </div>
            ) : subtitle ? (
                <p className="text-[10px] text-[var(--text-muted)]">{subtitle}</p>
            ) : null}
        </div>
    );
}
