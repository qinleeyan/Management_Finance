"use client";
import { useState, useEffect } from 'react';
import { CrudModal } from '@/components/ui/CrudModal';
import { Save, Trash2, BarChart3, FileText, DollarSign, Building } from 'lucide-react';
import type { Budget } from '@/types/models';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSave: (b: Record<string, any>) => Promise<void>;
    onDelete?: () => Promise<void>;
    budget?: Budget | null;
}

const DEPTS = ['Keuangan', 'Marketing', 'IT', 'HRD', 'Operasional', 'Legal', 'Produksi', 'R&D', 'Lainnya'];
const CATS = ['Gaji', 'Operasional', 'Pemasaran', 'Teknologi', 'Sewa', 'Utilitas', 'Perjalanan', 'Pelatihan', 'Lainnya'];

export function BudgetModal({ isOpen, onClose, onSave, onDelete, budget }: Props) {
    const [form, setForm] = useState<Record<string, any>>({
        Departemen: 'Keuangan', Kategori: 'Operasional', AnggaranBulanan: 0, Terpakai: 0, PersentaseTerpakai: '', Keterangan: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (budget) {
            setForm({
                Departemen: budget.departemen || 'Keuangan',
                Kategori: budget.kategori || 'Operasional',
                AnggaranBulanan: budget.anggaranBulanan || 0,
                Terpakai: budget.terpakai || 0,
                PersentaseTerpakai: budget.persentaseTerpakai || '',
                Keterangan: budget.keterangan || ''
            });
        } else {
            setForm({ Departemen: 'Keuangan', Kategori: 'Operasional', AnggaranBulanan: 0, Terpakai: 0, PersentaseTerpakai: '', Keterangan: '' });
        }
    }, [budget, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const pct = form.AnggaranBulanan > 0 ? ((form.Terpakai / form.AnggaranBulanan) * 100).toFixed(1) + '%' : '0%';
        setLoading(true);
        try { await onSave({ ...form, PersentaseTerpakai: pct }); onClose(); } finally { setLoading(false); }
    };

    return (
        <CrudModal isOpen={isOpen} onClose={onClose} title={budget ? 'Edit Anggaran' : 'Anggaran Baru'} icon={<BarChart3 className="text-accent-amber" size={20} />}
            footer={
                <div className="flex items-center justify-between w-full">
                    {budget && onDelete ? (
                        <button type="button" className="btn btn-danger btn-sm" disabled={loading}
                            onClick={async () => { if (confirm('Hapus anggaran ini?')) { setLoading(true); await onDelete(); onClose(); setLoading(false); } }}>
                            <Trash2 size={15} /> Hapus
                        </button>
                    ) : <div />}
                    <div className="flex gap-3">
                        <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} disabled={loading}>Batal</button>
                        <button type="submit" form="bgt-form" className="btn btn-primary btn-sm" disabled={loading}>
                            {loading ? <BarChart3 size={15} className="animate-spin" /> : <Save size={15} />} Simpan
                        </button>
                    </div>
                </div>
            }
        >
            <form id="bgt-form" onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div><label className="form-label"><Building size={13} /> Departemen</label>
                        <select value={form.Departemen} onChange={e => setForm({ ...form, Departemen: e.target.value })} className="form-input">
                            {DEPTS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select></div>
                    <div><label className="form-label"><FileText size={13} /> Kategori</label>
                        <select value={form.Kategori} onChange={e => setForm({ ...form, Kategori: e.target.value })} className="form-input">
                            {CATS.map(c => <option key={c} value={c}>{c}</option>)}
                        </select></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div><label className="form-label"><DollarSign size={13} /> Anggaran Bulanan (Rp)</label>
                        <input type="number" required min="0" step="100000" value={form.AnggaranBulanan} onChange={e => setForm({ ...form, AnggaranBulanan: Number(e.target.value) })} className="form-input font-mono" /></div>
                    <div><label className="form-label"><DollarSign size={13} /> Terpakai (Rp)</label>
                        <input type="number" required min="0" step="100000" value={form.Terpakai} onChange={e => setForm({ ...form, Terpakai: Number(e.target.value) })} className="form-input font-mono" /></div>
                </div>
                {form.AnggaranBulanan > 0 && (
                    <div className="p-3 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-subtle)]">
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-text-secondary">Penggunaan Anggaran</span>
                            <span className={`font-semibold ${(form.Terpakai / form.AnggaranBulanan) * 100 > 90 ? 'text-red-400' : (form.Terpakai / form.AnggaranBulanan) * 100 > 70 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                {((form.Terpakai / form.AnggaranBulanan) * 100).toFixed(1)}%
                            </span>
                        </div>
                        <div className="progress-bar">
                            <div className={`progress-fill ${(form.Terpakai / form.AnggaranBulanan) * 100 > 90 ? 'bg-red-500' : (form.Terpakai / form.AnggaranBulanan) * 100 > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                style={{ width: `${Math.min((form.Terpakai / form.AnggaranBulanan) * 100, 100)}%` }} />
                        </div>
                    </div>
                )}
                <div><label className="form-label"><FileText size={13} /> Keterangan</label>
                    <textarea placeholder="Catatan tambahan..." value={form.Keterangan} onChange={e => setForm({ ...form, Keterangan: e.target.value })} className="form-input" rows={2} /></div>
            </form>
        </CrudModal>
    );
}
