"use client";
import { useEffect, useState } from 'react';
import { Search, RefreshCw, Plus, Edit2, BarChart3 } from 'lucide-react';
import type { Budget } from '@/types/models';
import { api } from '@/lib/api';
import { BudgetModal } from './BudgetModal';

export function BudgetTable() {
    const [data, setData] = useState<Budget[]>([]);
    const [filtered, setFiltered] = useState<Budget[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selected, setSelected] = useState<Budget | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const bgt = await api.getBudgets();
            const withIdx = bgt.map((d: any, i: number) => ({ ...d, _rowIndex: d._rowIndex || i + 2 }));
            setData(withIdx); setFiltered(withIdx);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);
    useEffect(() => {
        let r = data;
        if (search) r = r.filter(b => b.departemen?.toLowerCase().includes(search.toLowerCase()) || b.kategori?.toLowerCase().includes(search.toLowerCase()));
        setFiltered(r);
    }, [search, data]);

    const fmt = (n: number) => new Intl.NumberFormat('id-ID').format(n);
    const pct = (b: Budget) => b.anggaranBulanan > 0 ? (b.terpakai / b.anggaranBulanan) * 100 : 0;
    const pctColor = (p: number) => p > 90 ? 'bg-red-500' : p > 70 ? 'bg-amber-500' : 'bg-emerald-500';
    const pctText = (p: number) => p > 90 ? 'text-red-400' : p > 70 ? 'text-amber-400' : 'text-emerald-400';

    const totalAnggaran = filtered.reduce((s, b) => s + b.anggaranBulanan, 0);
    const totalTerpakai = filtered.reduce((s, b) => s + b.terpakai, 0);
    const overallPct = totalAnggaran > 0 ? (totalTerpakai / totalAnggaran) * 100 : 0;

    const handleSave = async (d: Record<string, any>) => {
        if (selected?._rowIndex) await api.mutateSheet('update', 'Budget_Dept', d, selected._rowIndex);
        else await api.mutateSheet('create', 'Budget_Dept', d);
        await fetchData();
    };
    const handleDelete = async () => {
        if (!selected?._rowIndex) return;
        await api.mutateSheet('delete', 'Budget_Dept', null, selected._rowIndex);
        await fetchData();
    };

    return (
        <div className="glass-card animate-fade-in">
            <div className="p-5 pb-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2"><BarChart3 size={20} className="text-accent-amber" /> Anggaran Departemen</h3>
                    <p className="text-sm text-text-secondary mt-0.5">{filtered.length} anggaran • Penggunaan: <span className={`font-semibold ${pctText(overallPct)}`}>{overallPct.toFixed(1)}%</span></p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <button onClick={() => { setSelected(null); setIsModalOpen(true); }} className="btn btn-primary btn-sm"><Plus size={15} /> Tambah</button>
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                        <input type="text" placeholder="Cari..." value={search} onChange={e => setSearch(e.target.value)} className="form-input pl-9 !py-1.5 text-sm w-40" />
                    </div>
                    <button onClick={fetchData} className="btn btn-ghost btn-sm !p-1.5"><RefreshCw size={15} className={loading ? 'animate-spin' : ''} /></button>
                </div>
            </div>

            <div className="overflow-x-auto px-1 pb-1">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Departemen</th>
                            <th>Kategori</th>
                            <th className="text-right">Anggaran</th>
                            <th className="text-right">Terpakai</th>
                            <th>Penggunaan</th>
                            <th className="hidden lg:table-cell">Keterangan</th>
                            <th className="text-center w-12">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {!loading && filtered.length === 0 ? (
                            <tr><td colSpan={7} className="py-12 text-center text-text-muted">Tidak ada anggaran ditemukan</td></tr>
                        ) : filtered.map((b, i) => (
                            <tr key={i} className="group">
                                <td className="text-white font-medium">{b.departemen}</td>
                                <td><span className="badge badge-neutral">{b.kategori}</span></td>
                                <td className="text-right font-mono text-text-secondary">Rp {fmt(b.anggaranBulanan)}</td>
                                <td className="text-right font-mono text-white font-semibold">Rp {fmt(b.terpakai)}</td>
                                <td className="min-w-[160px]">
                                    <div className="flex items-center gap-3">
                                        <div className="progress-bar flex-1">
                                            <div className={`progress-fill ${pctColor(pct(b))}`} style={{ width: `${Math.min(pct(b), 100)}%` }} />
                                        </div>
                                        <span className={`text-xs font-semibold ${pctText(pct(b))} w-12 text-right`}>{pct(b).toFixed(0)}%</span>
                                    </div>
                                </td>
                                <td className="hidden lg:table-cell text-text-muted text-sm truncate max-w-[200px]">{b.keterangan || '-'}</td>
                                <td className="text-center">
                                    <button onClick={() => { setSelected(b); setIsModalOpen(true); }} className="p-1.5 rounded-md text-text-muted hover:text-accent-blue hover:bg-accent-blue/10 transition opacity-0 group-hover:opacity-100 focus:opacity-100" title="Edit">
                                        <Edit2 size={15} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    {filtered.length > 0 && (
                        <tfoot>
                            <tr className="border-t border-[var(--border-subtle)]">
                                <td colSpan={2} className="py-3 px-4 text-xs font-semibold uppercase text-text-muted">Total</td>
                                <td className="py-3 px-4 text-text-secondary font-semibold text-sm text-right">Rp {fmt(totalAnggaran)}</td>
                                <td className="py-3 px-4 text-white font-bold text-sm text-right">Rp {fmt(totalTerpakai)}</td>
                                <td className="py-3 px-4">
                                    <div className="flex items-center gap-3">
                                        <div className="progress-bar flex-1"><div className={`progress-fill ${pctColor(overallPct)}`} style={{ width: `${Math.min(overallPct, 100)}%` }} /></div>
                                        <span className={`text-xs font-semibold ${pctText(overallPct)} w-12 text-right`}>{overallPct.toFixed(0)}%</span>
                                    </div>
                                </td>
                                <td colSpan={2}></td>
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>

            <BudgetModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} onDelete={handleDelete} budget={selected} />
        </div>
    );
}
