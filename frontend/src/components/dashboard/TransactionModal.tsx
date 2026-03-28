"use client";
import { useState, useEffect } from 'react';
import { CrudModal } from '@/components/ui/CrudModal';
import { Save, Trash2, Activity, Calendar, FileText, Tag, DollarSign } from 'lucide-react';
import type { Transaction } from '@/types/models';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSave: (tx: Partial<Transaction>) => Promise<void>;
    onDelete?: () => Promise<void>;
    transaction?: Transaction | null;
}

const CATEGORIES = ['Operasional', 'Pemasaran', 'Investasi', 'Pinjaman', 'Penjualan', 'Gaji', 'Sewa', 'Utilitas', 'Internal', 'Lainnya'];

export function TransactionModal({ isOpen, onClose, onSave, onDelete, transaction }: Props) {
    const [form, setForm] = useState({ tanggal: '', keterangan: '', kategori: 'Operasional', tipe: 'Keluar', nominal: 0 });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (transaction) {
            setForm({
                tanggal: transaction.tanggal?.split('T')[0] || '',
                keterangan: transaction.keterangan || '',
                kategori: transaction.kategori || 'Operasional',
                tipe: transaction.tipe || 'Keluar',
                nominal: transaction.nominal || 0,
            });
        } else {
            setForm({ tanggal: new Date().toISOString().split('T')[0], keterangan: '', kategori: 'Operasional', tipe: 'Keluar', nominal: 0 });
        }
    }, [transaction, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try { await onSave(form); onClose(); } finally { setLoading(false); }
    };

    return (
        <CrudModal
            isOpen={isOpen}
            onClose={onClose}
            title={transaction ? 'Edit Transaksi' : 'Transaksi Baru'}
            icon={<Activity className="text-accent-blue" size={20} />}
            footer={
                <div className="flex items-center justify-between w-full">
                    {transaction && onDelete ? (
                        <button type="button" className="btn btn-danger btn-sm" disabled={loading}
                            onClick={async () => { if (confirm('Hapus transaksi ini?')) { setLoading(true); await onDelete(); onClose(); setLoading(false); } }}>
                            <Trash2 size={15} /> Hapus
                        </button>
                    ) : <div />}
                    <div className="flex gap-3">
                        <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} disabled={loading}>Batal</button>
                        <button type="submit" form="tx-form" className="btn btn-primary btn-sm" disabled={loading}>
                            {loading ? <Activity size={15} className="animate-spin" /> : <Save size={15} />} Simpan
                        </button>
                    </div>
                </div>
            }
        >
            <form id="tx-form" onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="form-label"><Calendar size={13} /> Tanggal</label>
                    <input type="date" required value={form.tanggal} onChange={e => setForm({ ...form, tanggal: e.target.value })} className="form-input" />
                </div>
                <div>
                    <label className="form-label"><FileText size={13} /> Keterangan</label>
                    <input type="text" required placeholder="Deskripsi transaksi..." value={form.keterangan} onChange={e => setForm({ ...form, keterangan: e.target.value })} className="form-input" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="form-label"><Tag size={13} /> Kategori</label>
                        <select value={form.kategori} onChange={e => setForm({ ...form, kategori: e.target.value })} className="form-input">
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="form-label"><Activity size={13} /> Tipe</label>
                        <select value={form.tipe} onChange={e => setForm({ ...form, tipe: e.target.value })} className="form-input">
                            <option value="Masuk">Masuk (Pemasukan)</option>
                            <option value="Keluar">Keluar (Pengeluaran)</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label className="form-label"><DollarSign size={13} /> Nominal (Rp)</label>
                    <input type="number" required min="0" step="1000" value={form.nominal} onChange={e => setForm({ ...form, nominal: Number(e.target.value) })} className="form-input font-mono" />
                </div>
            </form>
        </CrudModal>
    );
}
