using AHE.DAL.Interfaces.Repositories;
using AHE.DAL.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace AHE.DAL;

public static class DependencyInjection
{
    public static IServiceCollection AddDataAccess(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(
                configuration.GetConnectionString("DefaultConnection")));

        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();
        services.AddScoped<IRoleRepository, RoleRepository>();
        services.AddScoped<IRegionRepository, RegionRepository>();
        services.AddScoped<IProjectRepository, ProjectRepository>();
        services.AddScoped<ICategoryRepository, CategoryRepository>();
        services.AddScoped<IModelRepository, ModelRepository>();
        services.AddScoped<ITextureRepository, TextureRepository>();
        services.AddScoped<IMaterialRepository, MaterialRepository>();
        services.AddScoped<IBlobStorageRepository, AzureBlobStorageRepository>();


        return services;
    }
}