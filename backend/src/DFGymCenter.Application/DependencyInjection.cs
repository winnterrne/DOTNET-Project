using DFGymCenter.Application.Services.Implementations;
using DFGymCenter.Application.Services.Interfaces;
using Microsoft.Extensions.DependencyInjection;

namespace DFGymCenter.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        services.AddScoped<IBranchService, BranchService>();
        services.AddScoped<IAuthService, AuthService>();

        return services;
    }
}
