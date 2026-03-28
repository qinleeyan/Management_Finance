using Microsoft.Extensions.Caching.Memory;
using LedgerAI.Backend.Models;
using System.Globalization;
using System.Text.Json;

namespace LedgerAI.Backend.Services
{
    /// <summary>
    /// Service to fetch data from Google Sheets via Apps Script Web App API.
    /// NO CSV FALLBACK — data comes exclusively from Google Sheets.
    /// </summary>
    public class SheetParserService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<SheetParserService> _logger;
        private readonly IMemoryCache _cache;

        // USER MUST SET THIS to their deployed Apps Script Web App URL
        private const string SHEETS_API_URL = "https://script.google.com/macros/s/AKfycbx_jknYHASzCySSghMhlCqMOjjSokju1OotS2QWVT_rdSCP9r3kewqNMJKXLpHCIzQfLQ/exec";

        public SheetParserService(HttpClient httpClient, ILogger<SheetParserService> logger, IMemoryCache cache)
        {
            _httpClient = httpClient;
            _logger = logger;
            _cache = cache;
            _httpClient.Timeout = TimeSpan.FromSeconds(15);
        }

        // ==================== PUBLIC GETTERS ====================

        public async Task<List<Transaction>> GetTransactionsAsync()
        {
            var json = await FetchFromSheetsApiAsync("Transaksi_Kas");
            if (json.HasValue)
                return ParseTransactionsFromJson(json.Value);

            _logger.LogWarning("Failed to fetch Transaksi_Kas from Google Sheets. Returning empty list.");
            return new List<Transaction>();
        }

        public async Task<List<Invoice>> GetInvoicesAsync()
        {
            var json = await FetchFromSheetsApiAsync("Piutang_Klien");
            if (json.HasValue)
                return ParseInvoicesFromJson(json.Value);

            _logger.LogWarning("Failed to fetch Piutang_Klien from Google Sheets. Returning empty list.");
            return new List<Invoice>();
        }

        public async Task<List<Budget>> GetBudgetsAsync()
        {
            var json = await FetchFromSheetsApiAsync("Budget_Dept");
            if (json.HasValue)
                return ParseBudgetsFromJson(json.Value);

            _logger.LogWarning("Failed to fetch Budget_Dept from Google Sheets. Returning empty list.");
            return new List<Budget>();
        }

        // ==================== GOOGLE SHEETS API FETCHER ====================

        private async Task<JsonElement?> FetchFromSheetsApiAsync(string sheetName)
        {
            string cacheKey = $"Sheet_{sheetName}";
            
            // Check cache first
            if (_cache.TryGetValue(cacheKey, out JsonElement cachedData))
            {
                _logger.LogInformation("Returning CACHED data for {Sheet}", sheetName);
                return cachedData;
            }

            if (SHEETS_API_URL == "REPLACE_WITH_APPS_SCRIPT_URL")
            {
                _logger.LogError("SHEETS_API_URL belum dikonfigurasi! Set URL Apps Script Web App.");
                return null;
            }

            try
            {
                var url = $"{SHEETS_API_URL}?action=read&sheet={sheetName}";
                _logger.LogInformation("Fetching REAL data from Google Sheets: {Sheet}", sheetName);

                var response = await _httpClient.GetAsync(url);
                response.EnsureSuccessStatusCode();

                var content = await response.Content.ReadAsStringAsync();
                var doc = JsonDocument.Parse(content);
                var root = doc.RootElement;

                if (root.TryGetProperty("status", out var status) && status.GetString() == "success")
                {
                    if (root.TryGetProperty("data", out var data))
                    {
                        int count = root.TryGetProperty("count", out var cnt) ? cnt.GetInt32() : -1;
                        _logger.LogInformation("Successfully fetched {Sheet} ({Count} rows)", sheetName, count);
                        
                        // Set in cache for 30 seconds
                        _cache.Set(cacheKey, data, TimeSpan.FromSeconds(30));
                        return data;
                    }
                }

                _logger.LogWarning("Google Sheets API returned non-success for {Sheet}: {Content}", sheetName, content);
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching {Sheet} from Google Sheets API", sheetName);
                return null;
            }
        }

        // ==================== GOOGLE SHEETS API MUTATION ====================

        public async Task<string> MutateSheetAsync(object payload)
        {
            if (SHEETS_API_URL == "REPLACE_WITH_APPS_SCRIPT_URL")
            {
                throw new InvalidOperationException("SHEETS_API_URL belum dikonfigurasi!");
            }

            try
            {
                var content = new StringContent(JsonSerializer.Serialize(payload), System.Text.Encoding.UTF8, "text/plain");
                var response = await _httpClient.PostAsync(SHEETS_API_URL, content);
                response.EnsureSuccessStatusCode();

                var resultString = await response.Content.ReadAsStringAsync();
                
                // Clear cache so fresh data is fetched
                _cache.Remove("Sheet_Transaksi_Kas");
                _cache.Remove("Sheet_Piutang_Klien");
                _cache.Remove("Sheet_Budget_Dept");
                
                return resultString;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error mutating Google Sheets API");
                throw;
            }
        }

        // ==================== JSON PARSERS ====================

        private List<Transaction> ParseTransactionsFromJson(JsonElement data)
        {
            var results = new List<Transaction>();
            int rowIndex = 2; // Assuming row 1 is header
            foreach (var item in data.EnumerateArray())
            {
                try
                {
                    var tx = new Transaction
                    {
                        Tanggal = ParseDate(item, "Tanggal"),
                        Keterangan = GetStr(item, "Keterangan"),
                        Kategori = GetStr(item, "Kategori"),
                        Tipe = GetStr(item, "Tipe"),
                        Nominal = GetDecimal(item, "Nominal"),
                        _rowIndex = rowIndex++
                    };
                    if (!string.IsNullOrEmpty(tx.Keterangan)) results.Add(tx);
                }
                catch { rowIndex++; continue; }
            }
            _logger.LogInformation("Parsed {Count} transactions from Sheets", results.Count);
            return results;
        }

        private List<Invoice> ParseInvoicesFromJson(JsonElement data)
        {
            var results = new List<Invoice>();
            int rowIndex = 2;
            foreach (var item in data.EnumerateArray())
            {
                try
                {
                    var inv = new Invoice
                    {
                        Id = GetStr(item, "ID"),
                        NamaKlien = GetStr(item, "NamaKlien"),
                        NilaiInvoice = GetDecimal(item, "NilaiInvoice"),
                        TanggalTagihan = ParseDate(item, "TanggalTagihan"),
                        TanggalJatuhTempo = ParseDate(item, "TanggalJatuhTempo"),
                        StatusPembayaran = GetStr(item, "StatusPembayaran"),
                        KontakKlien = GetStr(item, "Kontak Klien"),
                        Keterangan = GetStr(item, "Keterangan"),
                        _rowIndex = rowIndex++
                    };
                    if (!string.IsNullOrEmpty(inv.NamaKlien)) results.Add(inv);
                }
                catch { rowIndex++; continue; }
            }
            _logger.LogInformation("Parsed {Count} invoices from Sheets", results.Count);
            return results;
        }

        private List<Budget> ParseBudgetsFromJson(JsonElement data)
        {
            var results = new List<Budget>();
            int rowIndex = 2;
            foreach (var item in data.EnumerateArray())
            {
                try
                {
                    var budget = new Budget
                    {
                        Departemen = GetStr(item, "Departemen"),
                        Kategori = GetStr(item, "Kategori"),
                        AnggaranBulanan = GetDecimal(item, "AnggaranBulanan"),
                        Terpakai = GetDecimal(item, "Terpakai"),
                        PersentaseTerpakai = GetStr(item, "PersentaseTerpakai"),
                        Keterangan = GetStr(item, "Keterangan"),
                        _rowIndex = rowIndex++
                    };
                    if (!string.IsNullOrEmpty(budget.Departemen)) results.Add(budget);
                }
                catch { rowIndex++; continue; }
            }
            _logger.LogInformation("Parsed {Count} budgets from Sheets", results.Count);
            return results;
        }

        // ==================== PARSING HELPERS ====================

        private static string GetStr(JsonElement item, string key)
        {
            if (item.TryGetProperty(key, out var val))
            {
                if (val.ValueKind == JsonValueKind.String) return val.GetString() ?? "";
                if (val.ValueKind == JsonValueKind.Number) return val.ToString();
                return val.ToString();
            }
            return "";
        }

        private static decimal GetDecimal(JsonElement item, string key)
        {
            if (item.TryGetProperty(key, out var val))
            {
                if (val.ValueKind == JsonValueKind.Number) return val.GetDecimal();
                if (val.ValueKind == JsonValueKind.String)
                {
                    var str = val.GetString()?.Replace(",", "").Replace(".", "").Trim() ?? "0";
                    decimal.TryParse(str, NumberStyles.Any, CultureInfo.InvariantCulture, out var result);
                    return result;
                }
            }
            return 0;
        }

        private static DateTime ParseDate(JsonElement item, string key)
        {
            if (item.TryGetProperty(key, out var val))
            {
                var str = val.ToString();
                if (DateTime.TryParse(str, out var date)) return date;
            }
            return DateTime.MinValue;
        }
    }
}
