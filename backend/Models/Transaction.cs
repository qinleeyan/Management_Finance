namespace LedgerAI.Backend.Models
{
    public class Transaction
    {
        public DateTime Tanggal { get; set; }
        public string Keterangan { get; set; } = "";
        public string Kategori { get; set; } = "";
        public string Tipe { get; set; } = "";
        public decimal Nominal { get; set; }
        public int? _rowIndex { get; set; }
    }
}
