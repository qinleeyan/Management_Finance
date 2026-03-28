// src/components/dashboard/ARAgingChart.tsx
"use client";

import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { Invoice, ARAgingBucket } from '@/types/models';
import { api } from '@/lib/api';

function buildARAgingData(invoices: Invoice[]): { buckets: ARAgingBucket[]; totalAR: number } {
    const now = new Date();
    const unpaid = invoices.filter(i => i.statusPembayaran === 'Belum Lunas');
    const buckets: Record<string, number> = {
        'Current': 0, '1-30 Hari': 0, '31-60 Hari': 0, '61-90 Hari': 0, '>90 Hari': 0,
    };
    unpaid.forEach(inv => {
        const due = new Date(inv.tanggalJatuhTempo);
        const days = Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
        if (days <= 0) buckets['Current'] += inv.nilaiInvoice;
        else if (days <= 30) buckets['1-30 Hari'] += inv.nilaiInvoice;
        else if (days <= 60) buckets['31-60 Hari'] += inv.nilaiInvoice;
        else if (days <= 90) buckets['61-90 Hari'] += inv.nilaiInvoice;
        else buckets['>90 Hari'] += inv.nilaiInvoice;
    });
    const colors: Record<string, string> = {
        'Current': '#10b981', '1-30 Hari': '#06b6d4', '31-60 Hari': '#f59e0b',
        '61-90 Hari': '#f97316', '>90 Hari': '#f43f5e',
    };
    const data = Object.entries(buckets)
        .filter(([, val]) => val > 0)
        .map(([name, value]) => ({ name, value, color: colors[name] || '#8892a6' }));
    return { buckets: data, totalAR: unpaid.reduce((s, i) => s + i.nilaiInvoice, 0) };
}

export function ARAgingChart() {
    const [data, setData] = useState<ARAgingBucket[]>([]);
    const [totalAR, setTotalAR] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getInvoices()
            .then(invoices => {
                const { buckets, totalAR } = buildARAgingData(invoices);
                setData(buckets);
                setTotalAR(totalAR);
            })
            .catch(err => console.error('AR fetch error:', err))
            .finally(() => setLoading(false));
    }, []);

    const fmt = (val: number) => {
        if (val >= 1e9) return `${(val / 1e9).toFixed(1)}B`;
        if (val >= 1e6) return `${(val / 1e6).toFixed(0)}M`;
        return new Intl.NumberFormat('id-ID').format(val);
    };

    return (
        <div className="glass-card p-6 h-[400px] flex flex-col">
            <div className="section-title mb-2">
                <h3>Aging Piutang</h3>
                <p>{loading ? 'Memuat...' : 'Data dari Spreadsheet'}</p>
            </div>

            <div className="flex-1 w-full relative flex items-center justify-center">
                {loading ? (
                    <div className="skeleton h-[200px] w-[200px] rounded-full" />
                ) : (
                    <>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={data} cx="50%" cy="45%" innerRadius={65} outerRadius={95}
                                    paddingAngle={4} dataKey="value" stroke="none" animationDuration={1500}>
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'rgba(6,8,15,0.95)',
                                        border: '1px solid rgba(6,182,212,0.12)',
                                        borderRadius: '14px',
                                        color: '#e8ecf4',
                                        boxShadow: '0 24px 64px -16px rgba(0,0,0,0.7)',
                                        fontSize: '12px',
                                    }}
                                    formatter={(value: number) => [`Rp ${new Intl.NumberFormat('id-ID').format(value)}`, 'Jumlah']}
                                />
                            </PieChart>
                        </ResponsiveContainer>

                        {/* Center text */}
                        <div className="absolute flex flex-col items-center justify-center pointer-events-none" style={{ top: '38%' }}>
                            <span className="text-2xl font-extrabold text-white">{fmt(totalAR)}</span>
                            <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Total AR</span>
                        </div>
                    </>
                )}
            </div>

            {/* Legend table */}
            {!loading && data.length > 0 && (
                <div className="space-y-1.5 mt-auto pt-2">
                    {data.map((item, i) => (
                        <div key={i} className="flex items-center gap-3 text-[11px]">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: item.color }} />
                            <span className="text-[var(--text-secondary)] flex-1">{item.name}</span>
                            <span className="text-white font-semibold">Rp {fmt(item.value)}</span>
                            <span className="text-[var(--text-muted)] w-10 text-right">
                                {totalAR > 0 ? `${((item.value / totalAR) * 100).toFixed(0)}%` : '0%'}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
