namespace LedgerAI.Backend.Models
{
    public class Invoice
    {
        public string Id { get; set; } = "";
        public string NamaKlien { get; set; } = "";
        public decimal NilaiInvoice { get; set; }
        public DateTime TanggalTagihan { get; set; }
        public DateTime TanggalJatuhTempo { get; set; }
        public string StatusPembayaran { get; set; } = "";
        public string KontakKlien { get; set; } = "";
        public string Keterangan { get; set; } = "";
        public int? _rowIndex { get; set; }
    }
}
