using DFGymCenter.Application.Services.Implementations;
using DFGymCenter.Application.Services.Interfaces;
using Microsoft.Extensions.DependencyInjection;

namespace DFGymCenter.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        // Đăng ký Business Services (IoC Container)
        services.AddScoped<IBranchService, BranchService>();

        return services;
    }
}
