using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Security.Claims;
using System.Text;
using System.Text.Encodings.Web;
using System.Text.Json;
using DFGymCenter.Domain.Enums;
using DFGymCenter.Domain.Exceptions;
using DFGymCenter.Infrastructure.Persistence.Context;
using Microsoft.AspNetCore.Authentication;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace DFGymCenter.API.Middlewares;

/// <summary>
/// Middleware xử lý ngoại lệ tập trung toàn cục & Kiểm tra trạng thái tài khoản LOCKED trên mọi request có JWT.
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

    public async Task InvokeAsync(HttpContext context, AppDbContext dbContext)
    {
        try
        {
            // Kiểm tra Status trong Middleware: Nếu user đang đăng nhập nhưng bị chuyển sang LOCKED -> chặn ngay lập tức
            if (context.User.Identity?.IsAuthenticated == true)
            {
                var userIdStr = context.User.FindFirstValue(ClaimTypes.NameIdentifier)
                    ?? context.User.FindFirstValue(JwtRegisteredClaimNames.Sub);

                if (Guid.TryParse(userIdStr, out var userId))
                {
                    var userStatus = await dbContext.Users
                        .AsNoTracking()
                        .Where(u => u.Id == userId)
                        .Select(u => (UserStatus?)u.Status)
                        .FirstOrDefaultAsync(context.RequestAborted);

                    if (userStatus == UserStatus.Locked)
                    {
                        context.Response.ContentType = "application/json";
                        context.Response.StatusCode = (int)HttpStatusCode.Forbidden;
                        await context.Response.WriteAsync(JsonSerializer.Serialize(new
                        {
                            statusCode = (int)HttpStatusCode.Forbidden,
                            message = "Tài khoản của bạn đã bị khóa (LOCKED). Mọi phiên truy cập đã bị từ chối.",
                            type = "AccountLocked"
                        }));
                        return;
                    }
                }
            }

            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Đã xảy ra lỗi trong hệ thống: {Message}", ex.Message);
            await HandleExceptionAsync(context, ex);
        }
    }

    private static Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";

        var (statusCode, message, type) = exception switch
        {
            NotFoundException notFoundEx => ((int)HttpStatusCode.NotFound, notFoundEx.Message, "NotFound"),
            ValidationException valEx => ((int)HttpStatusCode.BadRequest, valEx.Message, "Validation"),
            DomainException domainEx => ((int)HttpStatusCode.BadRequest, domainEx.Message, "DomainValidation"),
            KeyNotFoundException keyNotFoundEx => ((int)HttpStatusCode.NotFound, keyNotFoundEx.Message, "NotFound"),
            UnauthorizedAccessException unauthEx => ((int)HttpStatusCode.Unauthorized, unauthEx.Message, "Unauthorized"),
            _ => ((int)HttpStatusCode.InternalServerError, "Đã xảy ra lỗi từ phía máy chủ. Vui lòng thử lại sau.", "ServerError")
        };

        context.Response.StatusCode = statusCode;
        return context.Response.WriteAsync(JsonSerializer.Serialize(new
        {
            statusCode,
            message,
            type
        }));
    }
}

/// <summary>
/// Authentication Handler xác thực JWT Bearer Token (không phụ thuộc gói ngoài, giải mã Role & UserId chuẩn).
/// </summary>
public class JwtAuthenticationHandler : AuthenticationHandler<AuthenticationSchemeOptions>
{
    private readonly IConfiguration _configuration;

    public JwtAuthenticationHandler(
        IOptionsMonitor<AuthenticationSchemeOptions> options,
        ILoggerFactory logger,
        UrlEncoder encoder,
        IConfiguration configuration)
        : base(options, logger, encoder)
    {
        _configuration = configuration;
    }

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var authHeader = Request.Headers.Authorization.ToString();
        if (string.IsNullOrWhiteSpace(authHeader) || !authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            return Task.FromResult(AuthenticateResult.NoResult());
        }

        var token = authHeader["Bearer ".Length..].Trim();
        if (string.IsNullOrWhiteSpace(token))
        {
            return Task.FromResult(AuthenticateResult.NoResult());
        }

        try
        {
            var secretKey = _configuration["JwtSettings:Secret"]
                ?? "DFGymCenter_SuperSecretKey_For_JwtAuthentication_2026_CleanArchitecture!";
            var issuer = _configuration["JwtSettings:Issuer"] ?? "DFGymCenter.API";
            var audience = _configuration["JwtSettings:Audience"] ?? "DFGymCenter.Client";

            var tokenHandler = new JwtSecurityTokenHandler();
            var validationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
                ValidateIssuer = true,
                ValidIssuer = issuer,
                ValidateAudience = true,
                ValidAudience = audience,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.FromMinutes(2),
                RoleClaimType = ClaimTypes.Role,
                NameClaimType = ClaimTypes.NameIdentifier
            };

            var principal = tokenHandler.ValidateToken(token, validationParameters, out _);
            var ticket = new AuthenticationTicket(principal, Scheme.Name);
            return Task.FromResult(AuthenticateResult.Success(ticket));
        }
        catch (Exception ex)
        {
            return Task.FromResult(AuthenticateResult.Fail($"JWT không hợp lệ: {ex.Message}"));
        }
    }
}
