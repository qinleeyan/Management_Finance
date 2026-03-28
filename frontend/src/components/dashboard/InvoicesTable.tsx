"use client";
import { useEffect, useState } from 'react';
import { Search, RefreshCw, Plus, Edit2, Users, AlertTriangle } from 'lucide-react';
import type { Invoice } from '@/types/models';
import { api } from '@/lib/api';
import { InvoiceModal } from './InvoiceModal';

export function InvoicesTable() {
    const [data, setData] = useState<Invoice[]>([]);
    const [filtered, setFiltered] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selected, setSelected] = useState<Invoice | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const inv = await api.getInvoices();
            const withIdx = inv.map((d: any, i: number) => ({ ...d, _rowIndex: d._rowIndex || i + 2 }));
            setData(withIdx); setFiltered(withIdx);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);
    useEffect(() => {
        let r = data;
        if (filterStatus !== 'all') r = r.filter(inv => inv.statusPembayaran === filterStatus);
        if (search) r = r.filter(inv => inv.namaKlien?.toLowerCase().includes(search.toLowerCase()) || inv.id?.toLowerCase().includes(search.toLowerCase()));
        setFiltered(r);
    }, [search, filterStatus, data]);

    const fmt = (n: number) => new Intl.NumberFormat('id-ID').format(n);
    const statusBadge = (s: string) => {
        if (s === 'Lunas') return 'badge-success';
        if (s === 'Jatuh Tempo') return 'badge-danger';
        return 'badge-warning';
    };

    const isOverdue = (inv: Invoice) => {
        if (inv.statusPembayaran === 'Lunas') return false;
        return new Date(inv.tanggalJatuhTempo) < new Date();
    };

    const totalAR = filtered.filter(inv => inv.statusPembayaran !== 'Lunas').reduce((s, inv) => s + inv.nilaiInvoice, 0);

    const handleSave = async (d: Record<string, any>) => {
        if (selected?._rowIndex) await api.mutateSheet('update', 'Piutang_Klien', d, selected._rowIndex);
        else await api.mutateSheet('create', 'Piutang_Klien', d);
        await fetchData();
    };
    const handleDelete = async () => {
        if (!selected?._rowIndex) return;
        await api.mutateSheet('delete', 'Piutang_Klien', null, selected._rowIndex);
        await fetchData();
    };

    return (
        <div className="glass-card animate-fade-in">
            <div className="p-5 pb-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2"><Users size={20} className="text-accent-emerald" /> Piutang Klien</h3>
                    <p className="text-sm text-text-secondary mt-0.5">{filtered.length} piutang • Total AR: <span className="text-accent-amber font-semibold">Rp {fmt(totalAR)}</span></p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <button onClick={() => { setSelected(null); setIsModalOpen(true); }} className="btn btn-primary btn-sm"><Plus size={15} /> Tambah</button>
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                        <input type="text" placeholder="Cari klien..." value={search} onChange={e => setSearch(e.target.value)} className="form-input pl-9 !py-1.5 text-sm w-40" />
                    </div>
                    {['all', 'Belum Lunas', 'Lunas', 'Jatuh Tempo'].map(s => (
                        <button key={s} onClick={() => setFilterStatus(s)} className={`btn btn-sm !px-3 !py-1.5 text-xs ${filterStatus === s ? 'btn-primary' : 'btn-ghost'}`}>
                            {s === 'all' ? 'Semua' : s}
                        </button>
                    ))}
                    <button onClick={fetchData} className="btn btn-ghost btn-sm !p-1.5"><RefreshCw size={15} className={loading ? 'animate-spin' : ''} /></button>
                </div>
            </div>

            <div className="overflow-x-auto px-1 pb-1">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Klien</th>
                            <th className="text-right">Nilai Invoice</th>
                            <th className="hidden lg:table-cell">Tgl Tagihan</th>
                            <th>Jatuh Tempo</th>
                            <th>Status</th>
                            <th className="text-center w-12">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {!loading && filtered.length === 0 ? (
                            <tr><td colSpan={7} className="py-12 text-center text-text-muted">Tidak ada piutang ditemukan</td></tr>
                        ) : filtered.map((inv, i) => (
                            <tr key={i} className="group">
                                <td className="font-mono text-text-secondary text-sm">{inv.id}</td>
                                <td className="text-white font-medium">{inv.namaKlien}</td>
                                <td className="text-right font-mono text-accent-amber font-semibold">Rp {fmt(inv.nilaiInvoice)}</td>
                                <td className="hidden lg:table-cell text-text-secondary">{new Date(inv.tanggalTagihan).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                <td className={`whitespace-nowrap ${isOverdue(inv) ? 'text-red-400' : 'text-text-secondary'}`}>
                                    {isOverdue(inv) && <AlertTriangle size={13} className="inline mr-1 text-red-400" />}
                                    {new Date(inv.tanggalJatuhTempo).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </td>
                                <td><span className={`badge ${statusBadge(inv.statusPembayaran)}`}>{inv.statusPembayaran}</span></td>
                                <td className="text-center">
                                    <button onClick={() => { setSelected(inv); setIsModalOpen(true); }} className="p-1.5 rounded-md text-text-muted hover:text-accent-blue hover:bg-accent-blue/10 transition opacity-0 group-hover:opacity-100 focus:opacity-100" title="Edit">
                                        <Edit2 size={15} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    {filtered.length > 0 && (
                        <tfoot>
                            <tr className="border-t border-[var(--border-subtle)]">
                                <td colSpan={2} className="py-3 px-4 text-xs font-semibold uppercase text-text-muted">Total Outstanding</td>
                                <td className="py-3 px-4 text-accent-amber font-bold text-sm text-right">Rp {fmt(totalAR)}</td>
                                <td colSpan={4}></td>
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>

            <InvoiceModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} onDelete={handleDelete} invoice={selected} />
        </div>
    );
}
