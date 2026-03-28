using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace LedgerAI.Backend.Middleware
{
    public static class ExceptionHandlingExtensions
    {
        public static void ConfigureExceptionHandler(this IApplicationBuilder app, ILogger logger)
        {
            app.UseExceptionHandler(appError =>
            {
                appError.Run(async context =>
                {
                    context.Response.StatusCode = StatusCodes.Status500InternalServerError;
                    context.Response.ContentType = "application/json";

                    var contextFeature = context.Features.Get<IExceptionHandlerFeature>();
                    if (contextFeature != null)
                    {
                        // In production, we don't return the raw exception to avoid leaking
                        // sensitive technical stack traces to the client. We log it instead.
                        logger.LogError($"Something went wrong: {contextFeature.Error}");

                        var problemDetails = new ProblemDetails
                        {
                            Status = StatusCodes.Status500InternalServerError,
                            Title = "Internal Server Error",
                            Detail = "Terjadi kesalahan internal pada server. Tim kami sedang menanganinya."
                        };

                        await context.Response.WriteAsJsonAsync(problemDetails);
                    }
                });
            });
        }
    }
}
