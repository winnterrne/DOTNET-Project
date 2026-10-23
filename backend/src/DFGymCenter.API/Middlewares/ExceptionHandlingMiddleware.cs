using System.Net;
using System.Text.Json;
using DFGymCenter.Domain.Exceptions;

namespace DFGymCenter.API.Middlewares;

/// <summary>
/// Middleware xử lý ngoại lệ tập trung toàn cục (Global Exception Handler).
/// Bắt mọi lỗi phát sinh từ Service / Infrastructure và trả về format JSON chuẩn xác.
/// </summary>
public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Đã xảy ra lỗi chưa xử lý trong hệ thống: {Message}", ex.Message);
            await HandleExceptionAsync(context, ex);
        }
    }

    private static Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";

        var response = exception switch
        {
            DomainException domainEx => new
            {
                StatusCode = (int)HttpStatusCode.BadRequest,
                Message = domainEx.Message,
                Type = "DomainValidation"
            },
            KeyNotFoundException notFoundEx => new
            {
                StatusCode = (int)HttpStatusCode.NotFound,
                Message = notFoundEx.Message,
                Type = "NotFound"
            },
            _ => new
            {
                StatusCode = (int)HttpStatusCode.InternalServerError,
                Message = "Đã xảy ra lỗi từ phía máy chủ. Vui lòng thử lại sau.",
                Type = "ServerError"
            }
        };

        context.Response.StatusCode = response.StatusCode;
        return context.Response.WriteAsync(JsonSerializer.Serialize(response));
    }
}
