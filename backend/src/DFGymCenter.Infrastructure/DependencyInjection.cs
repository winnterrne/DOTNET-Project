using DFGymCenter.Application.Common.Interfaces;
using DFGymCenter.Domain.Interfaces;
using DFGymCenter.Infrastructure.Persistence.Context;
using DFGymCenter.Infrastructure.Persistence.Seed;
using DFGymCenter.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace DFGymCenter.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection") 
            ?? "Server=(localdb)\\mssqllocaldb;Database=DFGymCenterDb;Trusted_Connection=True;MultipleActiveResultSets=true;TrustServerCertificate=True";

        services.AddDbContext<AppDbContext>(options =>
            options.UseSqlServer(connectionString, b => b.MigrationsAssembly(typeof(AppDbContext).Assembly.FullName)));

        services.AddScoped<IAppDbContext>(provider => provider.GetRequiredService<AppDbContext>());
        services.AddScoped<IApplicationDbContext>(provider => provider.GetRequiredService<AppDbContext>());
        services.AddScoped<AppDbContextInitialiser>();
        services.AddScoped<ITokenService, TokenService>();

        // Đăng ký Unit of Work và Repositories từ tầng Domain
        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IMemberRepository, MemberRepository>();
        services.AddScoped<IMemberCardRepository, MemberCardRepository>();
        services.AddScoped<ITrainerRepository, TrainerRepository>();
        services.AddScoped<IStaffRepository, StaffRepository>();
        services.AddScoped<IBranchRepository, BranchRepository>();
        services.AddScoped<IMembershipPlanRepository, MembershipPlanRepository>();
        services.AddScoped<IMembershipRepository, MembershipRepository>();
        services.AddScoped<IBookingRepository, BookingRepository>();
        services.AddScoped<IGymClassRepository, GymClassRepository>();
        services.AddScoped<ICheckinRepository, CheckinRepository>();
        services.AddScoped<IEquipmentRepository, EquipmentRepository>();
        services.AddScoped<IPaymentRepository, PaymentRepository>();
        services.AddScoped<IReviewRepository, ReviewRepository>();
        services.AddScoped<INotificationRepository, NotificationRepository>();

        // Repositories bổ sung
        services.AddScoped<ISystemSettingRepository, SystemSettingRepository>();
        services.AddScoped<INutritionPlanRepository, NutritionPlanRepository>();
        services.AddScoped<IBodyMeasurementRepository, BodyMeasurementRepository>();
        services.AddScoped<IMetricTypeRepository, MetricTypeRepository>();
        services.AddScoped<IMeasurementValueRepository, MeasurementValueRepository>();
        services.AddScoped<IGymNewsRepository, GymNewsRepository>();

        return services;
    }
}
