using LedgerAI.Backend.Services;
using LedgerAI.Backend.Middleware;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;
using NLog;
using NLog.Web;

// Early setup of NLog so we can catch startup errors
var logger = NLog.LogManager.Setup().LoadConfigurationFromAppSettings().GetCurrentClassLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);

    // Setup NLog for Dependency Injection
    builder.Logging.ClearProviders();
    builder.Host.UseNLog();

    // Add services to the container.

builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddHttpClient(); // Required for Google Sheets API calls

// Register our custom services
builder.Services.AddScoped<SheetParserService>();
builder.Services.AddScoped<AnalyticsService>();

// Configure basic Rate Limiting to prevent DoS (Denial of Service) attacks
builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("GlobalPolicy", opt =>
    {
        opt.Window = TimeSpan.FromSeconds(10); // Window length 10 seconds
        opt.PermitLimit = 100;                 // Max 100 requests every 10 secs
        opt.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        opt.QueueLimit = 2; // Allow queueing max 2 requests if limit reached
    });
    
    // We return a 429 Too Many Requests status
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
});

// Configure CORS for security 
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontendApp",
        policy =>
        {
            // In production, you would restrict this to only the trusted frontend origin
            policy.AllowAnyOrigin() 
                  .AllowAnyMethod()
                  .AllowAnyHeader();
        });
});

builder.Services.AddMemoryCache();

var app = builder.Build();

var appLogger = app.Services.GetRequiredService<ILogger<Program>>();

// 1. Global Exception Handler (Preventing Stack Trace Leaks)
app.ConfigureExceptionHandler(appLogger);

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// 2. Add Security Headers Middleware
app.Use(async (context, next) =>
{
    // Prevent Clickjacking
    context.Response.Headers.Append("X-Frame-Options", "DENY");
    // Prevent MIME-Type sniffing
    context.Response.Headers.Append("X-Content-Type-Options", "nosniff");
    // Enable XSS Filtering
    context.Response.Headers.Append("X-XSS-Protection", "1; mode=block");
    await next();
});

// 3. Apply Rate Limiting
app.UseRateLimiter();

// 4. Apply CORS Policy
app.UseCors("AllowFrontendApp");

app.UseAuthorization();
app.MapControllers()
   .RequireRateLimiting("GlobalPolicy"); // Apply rate limit to all endpoints

app.Run();

}
catch (Exception ex)
{
    logger.Error(ex, "Stopped program because of exception");
    throw;
}
finally
{
    NLog.LogManager.Shutdown();
}
