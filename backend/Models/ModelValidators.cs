using FluentValidation;

namespace LedgerAI.Backend.Models
{
    public class TransactionValidator : AbstractValidator<Transaction>
    {
        public TransactionValidator()
        {
            RuleFor(t => t.Keterangan).NotEmpty().WithMessage("Keterangan transaksi tidak boleh kosong.");
            RuleFor(t => t.Kategori).NotEmpty().WithMessage("Kategori transaksi harus diisi.");
            RuleFor(t => t.Tipe)
                .NotEmpty()
                .Must(t => t.Equals("Masuk", StringComparison.OrdinalIgnoreCase) || t.Equals("Keluar", StringComparison.OrdinalIgnoreCase))
                .WithMessage("Tipe transaksi harus 'Masuk' atau 'Keluar'.");
            RuleFor(t => t.Nominal).GreaterThanOrEqualTo(0).WithMessage("Nominal transaksi tidak boleh negatif.");
        }
    }

    public class InvoiceValidator : AbstractValidator<Invoice>
    {
        public InvoiceValidator()
        {
            RuleFor(i => i.Id).NotEmpty().WithMessage("ID Invoice wajib diisi.");
            RuleFor(i => i.NamaKlien).NotEmpty().WithMessage("Nama Klien tidak boleh kosong.");
            RuleFor(i => i.NilaiInvoice).GreaterThan(0).WithMessage("Nilai Invoice harus lebih besar dari 0.");
            RuleFor(i => i.TanggalJatuhTempo)
                .GreaterThanOrEqualTo(i => i.TanggalTagihan)
                .WithMessage("Tanggal jatuh tempo tidak valid (harus >= tanggal tagihan).");
            RuleFor(i => i.StatusPembayaran).NotEmpty();
        }
    }

    public class BudgetValidator : AbstractValidator<Budget>
    {
        public BudgetValidator()
        {
            RuleFor(b => b.Departemen).NotEmpty();
            RuleFor(b => b.Kategori).NotEmpty();
            RuleFor(b => b.AnggaranBulanan).GreaterThan(0);
            RuleFor(b => b.Terpakai).GreaterThanOrEqualTo(0);
        }
    }
}
