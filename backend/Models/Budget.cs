namespace LedgerAI.Backend.Models
{
    public class Budget
    {
        public string Departemen { get; set; } = "";
        public string Kategori { get; set; } = "";
        public decimal AnggaranBulanan { get; set; }
        public decimal Terpakai { get; set; }
        public string PersentaseTerpakai { get; set; } = "";
        public string Keterangan { get; set; } = "";
        public int? _rowIndex { get; set; }
    }
}
