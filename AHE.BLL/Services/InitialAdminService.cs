using AHE.BLL.Interfaces;
using AHE.DAL.Entities;
using AHE.DAL.Interfaces.Repositories;
using Microsoft.Extensions.Configuration;

namespace AHE.BLL.Services;

public class InitialAdminService : IInitialAdminService
{
    private readonly IUserRepository _userRepository;
    private readonly IRoleRepository _roleRepository;
    private readonly IRegionRepository _regionRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IConfiguration _configuration;

    public InitialAdminService(
        IUserRepository userRepository,
        IRoleRepository roleRepository,
        IRegionRepository regionRepository,
        IPasswordHasher passwordHasher,
        IConfiguration configuration)
    {
        _userRepository = userRepository;
        _roleRepository = roleRepository;
        _regionRepository = regionRepository;
        _passwordHasher = passwordHasher;
        _configuration = configuration;
    }

    public async Task CreateInitialAdminAsync()
    {
        var name = _configuration["InitialAdmin:Name"];
        var email = _configuration["InitialAdmin:Email"];
        var password = _configuration["InitialAdmin:Password"];
        var roleName = _configuration["InitialAdmin:RoleName"];
        var regionCode = _configuration["InitialAdmin:RegionCode"];

        if (string.IsNullOrWhiteSpace(name))
            throw new Exception("Initial admin name is not configured.");

        if (string.IsNullOrWhiteSpace(email))
            throw new Exception("Initial admin email is not configured.");

        if (string.IsNullOrWhiteSpace(password))
            throw new Exception("Initial admin password is not configured.");

        if (string.IsNullOrWhiteSpace(roleName))
            throw new Exception("Initial admin role is not configured.");

        if (string.IsNullOrWhiteSpace(regionCode))
            throw new Exception("Initial admin region is not configured.");

        var emailNormalized = email.Trim().ToUpperInvariant();

        // Check whether initial admin already exists
        var existingUser =
            await _userRepository.GetByEmailAsync(emailNormalized);

        if (existingUser != null)
        {
            return;
        }

        // Get Admin role
        var role =
            await _roleRepository.GetByNameAsync(roleName);

        if (role == null)
        {
            throw new Exception(
                $"Role '{roleName}' was not found.");
        }

        // Get region
        var region =
            await _regionRepository.GetByCodeAsync(regionCode);

        if (region == null)
        {
            throw new Exception(
                $"Region '{regionCode}' was not found.");
        }

        // Hash password
        var passwordHash =
            _passwordHasher.HashPassword(password);

        var admin = new User
        {
            Id = Guid.NewGuid(),

            RoleId = role.Id,
            RegionId = region.Id,

            Name = name.Trim(),
            Email = email.Trim(),
            EmailNormalized = emailNormalized,

            PasswordHash = passwordHash,

            IsActive = true,
            EmailVerified = true,

            LastLoginAt = null,

            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,

            DeletedAt = null
        };

        await _userRepository.AddAsync(admin);
    }
}