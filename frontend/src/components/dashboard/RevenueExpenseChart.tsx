// src/components/dashboard/RevenueExpenseChart.tsx
"use client";

import { useEffect, useState } from 'react';
import {
    ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import type { Transaction } from '@/types/models';
import { api } from '@/lib/api';

interface MonthlyData {
    month: string;
    masuk: number;
    keluar: number;
    net: number;
}

function aggregateMonthly(txs: Transaction[]): MonthlyData[] {
    const grouped: Record<string, { masuk: number; keluar: number }> = {};
    txs.forEach(tx => {
        const d = new Date(tx.tanggal);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (!grouped[key]) grouped[key] = { masuk: 0, keluar: 0 };
        if (tx.tipe === 'Masuk') grouped[key].masuk += tx.nominal;
        else grouped[key].keluar += tx.nominal;
    });
    return Object.entries(grouped)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, { masuk, keluar }]) => ({
            month,
            masuk: masuk / 1_000_000,
            keluar: keluar / 1_000_000,
            net: (masuk - keluar) / 1_000_000,
        }));
}

export function RevenueExpenseChart() {
    const [data, setData] = useState<MonthlyData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getTransactions()
            .then(txs => setData(aggregateMonthly(txs)))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="glass-card p-6">
            <div className="section-title">
                <h3>Pendapatan vs Pengeluaran</h3>
                <p>{loading ? 'Memuat...' : `${data.length} periode`}</p>
            </div>

            <div className="h-[300px] w-full">
                {loading ? (
                    <div className="skeleton h-full w-full rounded-xl" />
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                            <defs>
                                <linearGradient id="barIncome" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.85} />
                                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.35} />
                                </linearGradient>
                                <linearGradient id="barExpense" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.85} />
                                    <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.35} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,120,160,0.06)" vertical={false} />
                            <XAxis dataKey="month" stroke="#555e72" fontSize={10} tickLine={false} axisLine={false}
                                tickFormatter={(v: string) => {
                                    const [, m] = v.split('-');
                                    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
                                    return months[parseInt(m) - 1] || v;
                                }} />
                            <YAxis stroke="#555e72" fontSize={10} tickLine={false} axisLine={false}
                                tickFormatter={(v: number) => `${v.toFixed(0)}M`} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(6,8,15,0.95)',
                                    border: '1px solid rgba(6,182,212,0.12)',
                                    borderRadius: '14px',
                                    color: '#e8ecf4',
                                    boxShadow: '0 24px 64px -16px rgba(0,0,0,0.7)',
                                    fontSize: '12px',
                                    padding: '12px 16px',
                                }}
                                formatter={(value: number, name: string) => {
                                    const label = name === 'masuk' ? 'Pendapatan' : name === 'keluar' ? 'Pengeluaran' : 'Net Balance';
                                    return [`Rp ${value.toFixed(1)}M`, label];
                                }}
                                labelFormatter={(label: string) => `Periode: ${label}`}
                            />
                            <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8}
                                wrapperStyle={{ fontSize: '11px', color: '#8892a6' }}
                                formatter={(v: string) => v === 'masuk' ? 'Pendapatan' : v === 'keluar' ? 'Pengeluaran' : 'Net Balance'} />
                            <Bar dataKey="masuk" fill="url(#barIncome)" radius={[6, 6, 0, 0]} barSize={24} animationDuration={1200} />
                            <Bar dataKey="keluar" fill="url(#barExpense)" radius={[6, 6, 0, 0]} barSize={24} animationDuration={1200} />
                            <Line type="monotone" dataKey="net" stroke="#8b5cf6" strokeWidth={2.5}
                                dot={{ fill: '#8b5cf6', r: 3.5, stroke: '#06080f', strokeWidth: 2 }}
                                activeDot={{ r: 6, fill: '#8b5cf6', stroke: '#06080f', strokeWidth: 3 }}
                                animationDuration={1500} />
                        </ComposedChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}
