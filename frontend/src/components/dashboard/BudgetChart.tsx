// src/components/dashboard/BudgetChart.tsx
"use client";

import { useEffect, useState } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';
import type { Budget, BudgetUsageItem } from '@/types/models';
import { api } from '@/lib/api';

function buildBudgetData(budgets: Budget[]): BudgetUsageItem[] {
    return budgets.map(b => {
        const percent = b.anggaranBulanan > 0 ? (b.terpakai / b.anggaranBulanan) * 100 : 0;
        return {
            name: `${b.departemen} ${b.kategori}`.substring(0, 14),
            used: b.terpakai / 1_000_000, // Convert to Millions
            limit: b.anggaranBulanan / 1_000_000,
            percent: Math.round(percent),
        };
    });
}

const getColor = (percent: number) => {
    if (percent >= 90) return '#f87171'; // Red
    if (percent >= 75) return '#fbbf24'; // Amber
    return '#34d399'; // Emerald
};

export function BudgetChart() {
    const [data, setData] = useState<BudgetUsageItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getBudgets()
            .then(budgets => setData(buildBudgetData(budgets)))
            .catch(err => console.error('Budget fetch error:', err))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="glass-card p-6 h-[400px] flex flex-col mt-6">
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-white tracking-tight">Department Budget Usage</h3>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {loading ? 'Loading from Google Sheets...' : `${data.length} departments from Spreadsheet`}
                    </p>
                </div>
                {loading && (
                    <div className="w-5 h-5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin"></div>
                )}
            </div>

            <div className="flex-1 w-full h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        layout="vertical"
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={true} vertical={false} />
                        <XAxis type="number" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis
                            dataKey="name"
                            type="category"
                            stroke="#cbd5e1"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            width={100}
                        />
                        <Tooltip
                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                            contentStyle={{
                                backgroundColor: 'rgba(15,22,41,0.9)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '8px',
                                color: '#fff'
                            }}
                            formatter={(value: number, name: string) => [
                                `Rp ${value.toFixed(1)}M`,
                                name === 'used' ? 'Terpakai' : name
                            ]}
                        />
                        <Bar dataKey="used" radius={[0, 4, 4, 0]} animationDuration={1500} barSize={24}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={getColor(entry.percent)} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
