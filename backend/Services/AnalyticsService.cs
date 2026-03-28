using LedgerAI.Backend.Models;

namespace LedgerAI.Backend.Services
{
    public class AnalyticsService
    {
        private readonly SheetParserService _parser;

        public AnalyticsService(SheetParserService parser)
        {
            _parser = parser;
        }

        public async Task<object> GetDashboardSummaryAsync()
        {
            var txs = await _parser.GetTransactionsAsync();
            var invoices = await _parser.GetInvoicesAsync();
            var budgets = await _parser.GetBudgetsAsync();

            // 1. Total Cash Saldo (Saldo Awal + Masuk - Keluar)
            // Asumsi "Saldo Awal" diklasifikasikan sebagai Pemasukan juga di data CSV kita.
            var cashIn = txs.Where(t => t.Tipe.Equals("Masuk", StringComparison.OrdinalIgnoreCase)).Sum(t => t.Nominal);
            var cashOut = txs.Where(t => t.Tipe.Equals("Keluar", StringComparison.OrdinalIgnoreCase)).Sum(t => t.Nominal);
            var currentCash = cashIn - cashOut;

            // 2. AR Outstanding (Piutang Belum Lunas)
            var outstandingAR = invoices
                .Where(i => i.StatusPembayaran.Equals("Belum Lunas", StringComparison.OrdinalIgnoreCase))
                .Sum(i => i.NilaiInvoice);
            var arClientCount = invoices.Count(i => i.StatusPembayaran.Equals("Belum Lunas", StringComparison.OrdinalIgnoreCase));

            // 3. Burn Rate (Rata-rata pengeluaran bulanan) -> Simple calculation for demo
            var monthlyExpenses = txs
                .Where(t => t.Tipe.Equals("Keluar", StringComparison.OrdinalIgnoreCase))
                .GroupBy(t => new { t.Tanggal.Year, t.Tanggal.Month })
                .Select(g => g.Sum(t => t.Nominal))
                .ToList();

            decimal averageBurnRate = monthlyExpenses.Any() ? monthlyExpenses.Average() : 0;
            decimal runwayMonths = averageBurnRate > 0 ? (currentCash / averageBurnRate) : 0;

            // 4. Budget Status
            var totalBudget = budgets.Sum(b => b.AnggaranBulanan);
            var totalUsed = budgets.Sum(b => b.Terpakai);
            var budgetUsedPercentage = totalBudget > 0 ? (totalUsed / totalBudget) * 100 : 0;

            return new
            {
                TotalCash = currentCash,
                TotalReceivables = outstandingAR,
                ARClientCount = arClientCount,
                BurnRate = averageBurnRate,
                CashRunwayMonths = Math.Round(runwayMonths, 1),
                BudgetUsedPercentage = Math.Round(budgetUsedPercentage, 1)
            };
        }
    }
}
