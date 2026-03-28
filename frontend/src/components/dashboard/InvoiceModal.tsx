"use client";
import { useState, useEffect } from 'react';
import { CrudModal } from '@/components/ui/CrudModal';
import { Save, Trash2, Users, Calendar, FileText, DollarSign, Phone, Hash } from 'lucide-react';
import type { Invoice } from '@/types/models';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSave: (inv: Record<string, any>) => Promise<void>;
    onDelete?: () => Promise<void>;
    invoice?: Invoice | null;
}

const STATUSES = ['Belum Lunas', 'Lunas', 'Jatuh Tempo', 'Sebagian'];

export function InvoiceModal({ isOpen, onClose, onSave, onDelete, invoice }: Props) {
    const [form, setForm] = useState<Record<string, any>>({
        ID: '', NamaKlien: '', NilaiInvoice: 0, TanggalTagihan: '', TanggalJatuhTempo: '', StatusPembayaran: 'Belum Lunas', 'Kontak Klien': '', Keterangan: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (invoice) {
            setForm({
                ID: invoice.id || '',
                NamaKlien: invoice.namaKlien || '',
                NilaiInvoice: invoice.nilaiInvoice || 0,
                TanggalTagihan: invoice.tanggalTagihan?.split('T')[0] || '',
                TanggalJatuhTempo: invoice.tanggalJatuhTempo?.split('T')[0] || '',
                StatusPembayaran: invoice.statusPembayaran || 'Belum Lunas',
                'Kontak Klien': invoice.kontakKlien || '',
                Keterangan: invoice.keterangan || ''
            });
        } else {
            setForm({ ID: '', NamaKlien: '', NilaiInvoice: 0, TanggalTagihan: new Date().toISOString().split('T')[0], TanggalJatuhTempo: '', StatusPembayaran: 'Belum Lunas', 'Kontak Klien': '', Keterangan: '' });
        }
    }, [invoice, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try { await onSave(form); onClose(); } finally { setLoading(false); }
    };

    return (
        <CrudModal isOpen={isOpen} onClose={onClose} title={invoice ? 'Edit Piutang' : 'Piutang Baru'} icon={<Users className="text-accent-emerald" size={20} />} size="lg"
            footer={
                <div className="flex items-center justify-between w-full">
                    {invoice && onDelete ? (
                        <button type="button" className="btn btn-danger btn-sm" disabled={loading}
                            onClick={async () => { if (confirm('Hapus piutang ini?')) { setLoading(true); await onDelete(); onClose(); setLoading(false); } }}>
                            <Trash2 size={15} /> Hapus
                        </button>
                    ) : <div />}
                    <div className="flex gap-3">
                        <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} disabled={loading}>Batal</button>
                        <button type="submit" form="inv-form" className="btn btn-primary btn-sm" disabled={loading}>
                            {loading ? <Users size={15} className="animate-spin" /> : <Save size={15} />} Simpan
                        </button>
                    </div>
                </div>
            }
        >
            <form id="inv-form" onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div><label className="form-label"><Hash size={13} /> ID Invoice</label>
                        <input type="text" required placeholder="INV-001" value={form.ID} onChange={e => setForm({ ...form, ID: e.target.value })} className="form-input" /></div>
                    <div><label className="form-label"><Users size={13} /> Nama Klien</label>
                        <input type="text" required placeholder="PT Contoh" value={form.NamaKlien} onChange={e => setForm({ ...form, NamaKlien: e.target.value })} className="form-input" /></div>
                </div>
                <div><label className="form-label"><DollarSign size={13} /> Nilai Invoice (Rp)</label>
                    <input type="number" required min="0" step="1000" value={form.NilaiInvoice} onChange={e => setForm({ ...form, NilaiInvoice: Number(e.target.value) })} className="form-input font-mono" /></div>
                <div className="grid grid-cols-2 gap-4">
                    <div><label className="form-label"><Calendar size={13} /> Tanggal Tagihan</label>
                        <input type="date" required value={form.TanggalTagihan} onChange={e => setForm({ ...form, TanggalTagihan: e.target.value })} className="form-input" /></div>
                    <div><label className="form-label"><Calendar size={13} /> Jatuh Tempo</label>
                        <input type="date" required value={form.TanggalJatuhTempo} onChange={e => setForm({ ...form, TanggalJatuhTempo: e.target.value })} className="form-input" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div><label className="form-label"><FileText size={13} /> Status Pembayaran</label>
                        <select value={form.StatusPembayaran} onChange={e => setForm({ ...form, StatusPembayaran: e.target.value })} className="form-input">
                            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select></div>
                    <div><label className="form-label"><Phone size={13} /> Kontak Klien</label>
                        <input type="text" placeholder="08xx / email" value={form['Kontak Klien']} onChange={e => setForm({ ...form, 'Kontak Klien': e.target.value })} className="form-input" /></div>
                </div>
                <div><label className="form-label"><FileText size={13} /> Keterangan</label>
                    <textarea placeholder="Catatan tambahan..." value={form.Keterangan} onChange={e => setForm({ ...form, Keterangan: e.target.value })} className="form-input" rows={2} /></div>
            </form>
        </CrudModal>
    );
}
