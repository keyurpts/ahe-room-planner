using AHE.BLL.Interfaces;
using AHE.BLL.Services;
using AHE.DAL;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace AHE.BLL;

public static class DependencyInjection
{
    public static IServiceCollection AddBusinessServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddDataAccess(configuration);

        // Register BLL services here
        // services.AddScoped<IUserService, UserService>();
        services.AddScoped<IPasswordHasher, PasswordHasher>();
        services.AddScoped<IJwtTokenService, JwtTokenService>();
        services.AddScoped<IRefreshTokenService, RefreshTokenService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IInitialAdminService, InitialAdminService>();
        services.AddScoped<IProjectService, ProjectService>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<ICategoryService, CategoryService>();
        services.AddScoped<IModelService, ModelService>();
        services.AddScoped<IRegionService, RegionService>();
        services.AddScoped<ITextureService, TextureService>();
        services.AddScoped<IMaterialService, MaterialService>();
        services.AddScoped<IStorageService, StorageService>();

        return services;
    }
}