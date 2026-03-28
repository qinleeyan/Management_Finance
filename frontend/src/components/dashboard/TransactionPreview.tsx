// src/components/dashboard/TransactionPreview.tsx
"use client";

import { useEffect, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, ChevronRight } from 'lucide-react';
import type { Transaction } from '@/types/models';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/Skeleton';

interface TransactionPreviewProps {
    onViewAll?: () => void;
}

export function TransactionPreview({ onViewAll }: TransactionPreviewProps) {
    const [txs, setTxs] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getTransactions()
            .then(data => setTxs(data.slice(-5).reverse()))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const fmt = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

    const categoryIcon: Record<string, string> = {
        'Operasional': '⚙️',
        'Gaji': '👤',
        'Pendapatan Proyek': '💼',
        'Pemasaran': '📢',
        'Utilitas': '💡',
        'Perawatan': '🔧',
    };

    return (
        <div className="glass-card p-6">
            <div className="flex justify-between items-center mb-5">
                <div className="section-title mb-0">
                    <h3>Transaksi Terkini</h3>
                </div>
                {onViewAll && (
                    <button
                        onClick={onViewAll}
                        className="flex items-center gap-1 text-xs font-semibold text-accent-blue hover:text-sky-300 transition-colors"
                    >
                        Lihat Semua <ChevronRight size={14} />
                    </button>
                )}
            </div>

            <div className="space-y-1">
                {loading ? (
                    Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} variant="row" />)
                ) : txs.length === 0 ? (
                    <p className="text-center text-text-muted py-8 text-sm">Belum ada transaksi</p>
                ) : (
                    txs.map((tx, i) => {
                        const isMasuk = tx.tipe === 'Masuk';
                        const date = new Date(tx.tanggal);
                        const icon = categoryIcon[tx.kategori] || '📄';
                        return (
                            <div key={i} className="flex items-center gap-4 py-3 px-3 rounded-xl hover:bg-white/[0.02] transition-all group">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                                    style={{
                                        background: isMasuk ? 'rgba(52,211,153,0.08)' : 'rgba(248,113,113,0.08)',
                                        border: `1px solid ${isMasuk ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)'}`,
                                    }}>
                                    {icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white truncate">{tx.keterangan}</p>
                                    <p className="text-[11px] text-text-muted">
                                        {tx.kategori} • {date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                    </p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className={`text-sm font-bold ${isMasuk ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {isMasuk ? '+' : '-'}{fmt(tx.nominal)}
                                    </p>
                                    <div className="flex items-center justify-end gap-1">
                                        {isMasuk ? <ArrowDownLeft size={10} className="text-emerald-400" /> : <ArrowUpRight size={10} className="text-red-400" />}
                                        <span className="text-[10px] text-text-muted">{isMasuk ? 'Masuk' : 'Keluar'}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
