using LedgerAI.Backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace LedgerAI.Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DashboardController : ControllerBase
    {
        private readonly AnalyticsService _analytics;
        private readonly SheetParserService _parser;

        public DashboardController(AnalyticsService analytics, SheetParserService parser)
        {
            _analytics = analytics;
            _parser = parser;
        }

        /// <summary>GET /api/dashboard/summary — Aggregated KPIs</summary>
        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary()
        {
            try
            {
                var result = await _analytics.GetDashboardSummaryAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error calculating dashboard summary", error = ex.Message });
            }
        }

        /// <summary>GET /api/dashboard/transactions — Raw cash transaction list (from Google Sheets)</summary>
        [HttpGet("transactions")]
        public async Task<IActionResult> GetTransactions()
        {
            try
            {
                var txs = await _parser.GetTransactionsAsync();
                return Ok(txs);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error fetching transactions", error = ex.Message });
            }
        }

        /// <summary>GET /api/dashboard/invoices — Raw invoice/piutang list (from Google Sheets)</summary>
        [HttpGet("invoices")]
        public async Task<IActionResult> GetInvoices()
        {
            try
            {
                var invoices = await _parser.GetInvoicesAsync();
                return Ok(invoices);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error fetching invoices", error = ex.Message });
            }
        }

        /// <summary>GET /api/dashboard/budgets — Raw budget list (from Google Sheets)</summary>
        [HttpGet("budgets")]
        public async Task<IActionResult> GetBudgets()
        {
            try
            {
                var budgets = await _parser.GetBudgetsAsync();
                return Ok(budgets);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error fetching budgets", error = ex.Message });
            }
        }

        /// <summary>POST /api/dashboard/mutate — Proxy CRUD operations to Google Sheets</summary>
        [HttpPost("mutate")]
        public async Task<IActionResult> MutateSheet([FromBody] dynamic payload)
        {
            try
            {
                var result = await _parser.MutateSheetAsync(payload);
                return Content(result, "application/json");
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error mutating data", error = ex.Message });
            }
        }
    }
}
