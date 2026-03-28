"use client";
import { useEffect, useState } from 'react';
import { ArrowDownCircle, ArrowUpCircle, Search, RefreshCw, Plus, Edit2 } from 'lucide-react';
import type { Transaction } from '@/types/models';
import { api } from '@/lib/api';
import { TransactionModal } from './TransactionModal';

export function TransactionsTable() {
    const [data, setData] = useState<Transaction[]>([]);
    const [filtered, setFiltered] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'Masuk' | 'Keluar'>('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const txs = await api.getTransactions();
            const withIdx = txs.map((d: any, i: number) => ({ ...d, _rowIndex: d._rowIndex || i + 2 }));
            setData(withIdx); setFiltered(withIdx);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);
    useEffect(() => {
        let r = data;
        if (filterType !== 'all') r = r.filter(t => t.tipe === filterType);
        if (search) r = r.filter(t => t.keterangan.toLowerCase().includes(search.toLowerCase()) || t.kategori.toLowerCase().includes(search.toLowerCase()));
        setFiltered(r);
    }, [search, filterType, data]);

    const fmt = (n: number) => new Intl.NumberFormat('id-ID').format(n);
    const totalMasuk = filtered.filter(t => t.tipe === 'Masuk').reduce((s, t) => s + t.nominal, 0);
    const totalKeluar = filtered.filter(t => t.tipe === 'Keluar').reduce((s, t) => s + t.nominal, 0);

    const handleSave = async (d: Partial<Transaction>) => {
        if (selectedTx?._rowIndex) await api.mutateSheet('update', 'Transaksi_Kas', d, selectedTx._rowIndex);
        else await api.mutateSheet('create', 'Transaksi_Kas', d);
        await fetchData();
    };
    const handleDelete = async () => {
        if (!selectedTx?._rowIndex) return;
        await api.mutateSheet('delete', 'Transaksi_Kas', null, selectedTx._rowIndex);
        await fetchData();
    };

    return (
        <div className="glass-card animate-fade-in">
            <div className="p-5 pb-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h3 className="text-lg font-bold text-white">Buku Kas</h3>
                    <p className="text-sm text-text-secondary mt-0.5">{filtered.length} transaksi dari Google Sheets</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <button onClick={() => { setSelectedTx(null); setIsModalOpen(true); }} className="btn btn-primary btn-sm"><Plus size={15} /> Tambah</button>
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                        <input type="text" placeholder="Cari..." value={search} onChange={e => setSearch(e.target.value)} className="form-input pl-9 !py-1.5 text-sm w-40" />
                    </div>
                    {(['all', 'Masuk', 'Keluar'] as const).map(t => (
                        <button key={t} onClick={() => setFilterType(t)} className={`btn btn-sm !px-3 !py-1.5 text-xs ${filterType === t ? t === 'Masuk' ? '!bg-emerald-500/15 !text-emerald-400 !border-emerald-500/30' : t === 'Keluar' ? '!bg-red-500/15 !text-red-400 !border-red-500/30' : 'btn-primary' : 'btn-ghost'}`}>
                            {t === 'all' ? 'Semua' : t}
                        </button>
                    ))}
                    <button onClick={fetchData} className="btn btn-ghost btn-sm !p-1.5"><RefreshCw size={15} className={loading ? 'animate-spin' : ''} /></button>
                </div>
            </div>

            <div className="overflow-x-auto px-1 pb-1">
                {loading && (
                    <div className="absolute inset-0 bg-[var(--bg-primary)]/40 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-xl">
                        <div className="flex items-center gap-3 text-white font-medium"><RefreshCw className="animate-spin text-accent-blue" size={20} /> Memuat data...</div>
                    </div>
                )}
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Tanggal</th>
                            <th>Keterangan</th>
                            <th className="hidden md:table-cell">Kategori</th>
                            <th>Tipe</th>
                            <th className="text-right">Nominal</th>
                            <th className="text-center w-12">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {!loading && filtered.length === 0 ? (
                            <tr><td colSpan={6} className="py-12 text-center text-text-muted">Tidak ada transaksi ditemukan</td></tr>
                        ) : filtered.map((tx, i) => (
                            <tr key={i} className="group">
                                <td className="whitespace-nowrap text-text-secondary">{new Date(tx.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                <td className="text-white font-medium">{tx.keterangan}</td>
                                <td className="hidden md:table-cell"><span className="badge badge-info">{tx.kategori}</span></td>
                                <td>
                                    <span className={`flex items-center gap-1.5 font-semibold text-xs ${tx.tipe === 'Masuk' ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {tx.tipe === 'Masuk' ? <ArrowDownCircle size={14} /> : <ArrowUpCircle size={14} />} {tx.tipe}
                                    </span>
                                </td>
                                <td className={`text-right font-mono font-semibold ${tx.tipe === 'Masuk' ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {tx.tipe === 'Masuk' ? '+' : '-'} Rp {fmt(tx.nominal)}
                                </td>
                                <td className="text-center">
                                    <button onClick={() => { setSelectedTx(tx); setIsModalOpen(true); }} className="p-1.5 rounded-md text-text-muted hover:text-accent-blue hover:bg-accent-blue/10 transition opacity-0 group-hover:opacity-100 focus:opacity-100" title="Edit">
                                        <Edit2 size={15} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    {filtered.length > 0 && (
                        <tfoot>
                            <tr className="border-t border-[var(--border-subtle)]">
                                <td colSpan={3} className="py-3 px-4 text-xs font-semibold uppercase text-text-muted">Total</td>
                                <td className="py-3 px-4 text-emerald-400 font-semibold text-sm">+ Rp {fmt(totalMasuk)}</td>
                                <td className="py-3 px-4 text-red-400 font-semibold text-sm text-right">- Rp {fmt(totalKeluar)}</td>
                                <td className={`py-3 px-4 font-bold text-sm text-center ${totalMasuk - totalKeluar >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {totalMasuk - totalKeluar >= 0 ? '+' : ''}{fmt(totalMasuk - totalKeluar)}
                                </td>
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>

            <TransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} onDelete={handleDelete} transaction={selectedTx} />
        </div>
    );
}
