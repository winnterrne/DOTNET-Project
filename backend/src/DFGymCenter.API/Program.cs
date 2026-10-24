using DFGymCenter.API.Extensions;
using DFGymCenter.API.Middlewares;
using DFGymCenter.Application;
using DFGymCenter.Infrastructure;
using Microsoft.AspNetCore.Authentication;

var builder = WebApplication.CreateBuilder(args);

// 1. Đăng ký các tầng kiến trúc Clean Architecture vào IoC Container
builder.Services.AddApplicationServices();
builder.Services.AddInfrastructureServices(builder.Configuration);

// 2. Cấu hình JWT Authentication & Role-based Authorization
builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = "Bearer";
        options.DefaultChallengeScheme = "Bearer";
    })
    .AddScheme<AuthenticationSchemeOptions, JwtAuthenticationHandler>("Bearer", null);

builder.Services.AddAuthorization();

// 3. Cấu hình Controllers & OpenAPI
builder.Services.AddControllers();
builder.Services.AddOpenApi();

// 4. Cấu hình CORS cho Frontend React (Vite / Next.js)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

// 5. Kích hoạt tự động tạo lại Database (28 bảng Fluent API) & Seed dữ liệu 1-A (Cứu hộ khi thầy xóa DB)
await app.InitialiseDatabaseAsync();

// 6. Cấu hình HTTP Request Pipeline
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseCors("AllowFrontend");

app.UseAuthentication();

// Middleware kiểm tra tài khoản LOCKED & xử lý ngoại lệ tập trung
app.UseMiddleware<ExceptionHandlingMiddleware>();

app.UseAuthorization();

app.MapControllers();

app.Run();
