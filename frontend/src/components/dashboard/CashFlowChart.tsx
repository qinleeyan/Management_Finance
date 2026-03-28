// src/components/dashboard/CashFlowChart.tsx
"use client";

import { useEffect, useState } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import type { Transaction, CashFlowDataPoint } from '@/types/models';
import { api } from '@/lib/api';

interface ExtendedDataPoint extends CashFlowDataPoint {
    isForecast?: boolean;
}

function buildCashFlowData(txs: Transaction[]): CashFlowDataPoint[] {
    const grouped: Record<string, { masuk: number; keluar: number }> = {};
    txs.forEach(tx => {
        const date = tx.tanggal.split('T')[0];
        if (!grouped[date]) grouped[date] = { masuk: 0, keluar: 0 };
        if (tx.tipe === 'Masuk') grouped[date].masuk += tx.nominal;
        else grouped[date].keluar += tx.nominal;
    });
    const sorted = Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
    let saldo = 0;
    return sorted.map(([date, { masuk, keluar }]) => {
        saldo += masuk - keluar;
        return { date, masuk, keluar, saldo };
    });
}

export function CashFlowChart() {
    const [data, setData] = useState<ExtendedDataPoint[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([api.getTransactions(), api.getForecast(30)])
            .then(([txs, aiResult]) => {
                const history = buildCashFlowData(txs);
                let forecastData: ExtendedDataPoint[] = [];
                if (aiResult.status === 'success' && aiResult.forecast) {
                    forecastData = aiResult.forecast.map((f: any) => ({
                        date: f.date, masuk: 0, keluar: 0,
                        saldo: f.predicted_saldo, isForecast: true
                    }));
                }
                setData([...history, ...forecastData]);
            })
            .catch(err => console.error('CashFlow fetch error:', err))
            .finally(() => setLoading(false));
    }, []);

    const formatJuta = (val: number) => {
        if (val >= 1e9) return `${(val / 1e9).toFixed(1)}B`;
        if (val >= 1e6) return `${(val / 1e6).toFixed(0)}M`;
        return val.toString();
    };

    return (
        <div className="glass-card p-6 h-[400px] flex flex-col">
            <div className="section-title mb-4">
                <h3>Cash Flow Trend</h3>
                <p>{loading ? 'Memuat...' : `${data.length} hari dari Spreadsheet`}</p>
            </div>

            <div className="flex-1 w-full min-h-[250px]">
                {loading ? (
                    <div className="skeleton h-full w-full rounded-xl" />
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,120,160,0.06)" vertical={false} />
                            <XAxis dataKey="date" stroke="#555e72" fontSize={10} tickLine={false} axisLine={false} dy={8}
                                tickFormatter={(val: string) => {
                                    const d = new Date(val);
                                    return `${d.getDate()}/${d.getMonth() + 1}`;
                                }} />
                            <YAxis stroke="#555e72" fontSize={10} tickLine={false} axisLine={false} tickFormatter={formatJuta} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(6,8,15,0.95)',
                                    border: '1px solid rgba(6,182,212,0.12)',
                                    borderRadius: '14px',
                                    color: '#e8ecf4',
                                    boxShadow: '0 24px 64px -16px rgba(0,0,0,0.7)',
                                    fontSize: '12px',
                                }}
                                formatter={(value: number, name: string) => [
                                    `Rp ${new Intl.NumberFormat('id-ID').format(value)}`,
                                    name === 'saldo' ? 'Saldo' : name === 'masuk' ? 'Masuk' : 'Keluar'
                                ]}
                                labelFormatter={(label: string) => `Tanggal: ${label}`}
                            />
                            <Legend verticalAlign="top" height={36} iconSize={8} iconType="circle"
                                wrapperStyle={{ fontSize: '11px', color: '#8892a6' }} />
                            <Area name="Saldo Historis" type="monotone"
                                dataKey={(d) => d.isForecast ? null : d.saldo}
                                stroke="#06b6d4" strokeWidth={2.5} fillOpacity={1}
                                fill="url(#colorSaldo)" animationDuration={1500} />
                            <Area name="AI Forecast (30H)" type="monotone"
                                dataKey={(d) => d.isForecast ? d.saldo : null}
                                stroke="#8b5cf6" strokeWidth={2} strokeDasharray="6 4"
                                fillOpacity={0} animationDuration={1500} />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}
