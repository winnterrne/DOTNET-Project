using DFGymCenter.Infrastructure.Persistence.Seed;

namespace DFGymCenter.API.Extensions;

/// <summary>
/// Extension methods phục vụ khởi tạo và tự động tái tạo Database.
/// Giải quyết trực tiếp kịch bản khi bảo vệ đồ án: Thầy cô xóa sạch DB,
/// khi restart API hệ thống tự động sinh lại DB và nạp sẵn dữ liệu test.
/// </summary>
public static class DatabaseExtensions
{
    public static async Task InitialiseDatabaseAsync(this WebApplication app)
    {
        using var scope = app.Services.CreateScope();

        var initialiser = scope.ServiceProvider.GetRequiredService<ApplicationDbContextInitialiser>();

        // Tự động kiểm tra / tạo mới cấu trúc bảng nếu database bị xóa
        await initialiser.InitialiseAsync();

        // Tự động nạp dữ liệu mẫu ban đầu (Chi nhánh, Admin, v.v.)
        await initialiser.SeedAsync();
    }
}
