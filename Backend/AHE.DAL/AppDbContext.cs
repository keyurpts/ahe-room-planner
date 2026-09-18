using AHE.DAL.Entities;
using Microsoft.EntityFrameworkCore;

namespace AHE.DAL;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<Region> Regions => Set<Region>();
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Model> Models => Set<Model>();
    public DbSet<Material> Materials => Set<Material>();
    public DbSet<Texture> Textures => Set<Texture>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.ApplyConfigurationsFromAssembly(
            typeof(AppDbContext).Assembly);
    }
}
