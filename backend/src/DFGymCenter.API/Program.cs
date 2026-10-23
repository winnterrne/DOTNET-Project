using DFGymCenter.API.Extensions;
using DFGymCenter.API.Middlewares;
using DFGymCenter.Application;
using DFGymCenter.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

// 1. Đăng ký các tầng kiến trúc Clean Architecture vào IoC Container
builder.Services.AddApplicationServices();
builder.Services.AddInfrastructureServices(builder.Configuration);

// 2. Cấu hình Controllers & OpenAPI
builder.Services.AddControllers();
builder.Services.AddOpenApi();

// 3. Cấu hình CORS cho Frontend React (Vite / Next.js)
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

// 4. Kích hoạt tự động tạo lại Database & Seed dữ liệu (Cứu hộ khi thầy xóa DB)
if (app.Environment.IsDevelopment())
{
    await app.InitialiseDatabaseAsync();
}

// 5. Cấu hình HTTP Request Pipeline
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseMiddleware<ExceptionHandlingMiddleware>();

app.UseHttpsRedirection();

app.UseCors("AllowFrontend");

app.UseAuthorization();

app.MapControllers();

app.Run();
