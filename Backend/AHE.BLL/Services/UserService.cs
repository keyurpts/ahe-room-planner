using AHE.BLL.DTOs.Authentication;
using AHE.BLL.DTOs.Users;
using AHE.BLL.Interfaces;
using AHE.DAL.Entities;
using AHE.DAL.Interfaces.Repositories;
using AHE.DAL.Repositories;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Text;

namespace AHE.BLL.Services
{
    public class UserService : IUserService
    {
        private readonly IUserRepository _userRepository;
        private readonly IRoleRepository _roleRepository;
        private readonly IRegionRepository _regionRepository;
        private readonly IPasswordHasher _passwordHasher;
        private readonly ILogger<UserService> _logger;

        public UserService(
            IUserRepository userRepository,
            IRoleRepository roleRepository,
            IRegionRepository regionRepository,
            IPasswordHasher passwordHasher,
            ILogger<UserService> logger)
        {
            _userRepository = userRepository;
            _roleRepository = roleRepository;
            _regionRepository = regionRepository;
            _passwordHasher = passwordHasher;
            _logger = logger;
        }

        public async Task<UserDto> CreateUserAsync(CreateUserDto request)
        {
            if (request is null)
            {
                throw new ArgumentNullException(nameof(request));
            }

            if (string.IsNullOrWhiteSpace(request.Name))
                throw new ArgumentException("Name is required.", nameof(request.Name));

            if (string.IsNullOrWhiteSpace(request.Email))
                throw new ArgumentException("Email is required.", nameof(request.Email));

            if (string.IsNullOrWhiteSpace(request.Password))
                throw new ArgumentException("Password is required.", nameof(request.Password));

            if (string.IsNullOrWhiteSpace(request.RoleName))
                throw new ArgumentException("Role name is required.", nameof(request.RoleName));

            if (string.IsNullOrWhiteSpace(request.RegionCode))
                throw new ArgumentException("Region code is required.", nameof(request.RegionCode));

            var email = request.Email.Trim();
            var emailNormalized = email.ToUpperInvariant();
            var roleName = request.RoleName.Trim();
            var regionCode = request.RegionCode.Trim();

            try
            {
                // Check whether the user already exists.
                var existingUser =
                    await _userRepository.GetByEmailAsync(emailNormalized);

                if (existingUser is not null)
                {
                    throw new InvalidOperationException(
                        "A user with this email already exists.");
                }

                // Get role.
                var role =
                    await _roleRepository.GetByNameAsync(roleName);

                if (role is null)
                {
                    throw new ArgumentException(
                        $"Role '{roleName}' was not found.",
                        nameof(request.RoleName));
                }

                // Get region.
                var region =
                    await _regionRepository.GetByCodeAsync(regionCode);

                if (region is null)
                {
                    throw new ArgumentException(
                        $"Region '{regionCode}' was not found.",
                        nameof(request.RegionCode));
                }

                // Hash password.
                var passwordHash =
                    _passwordHasher.HashPassword(request.Password);

                var now = DateTime.UtcNow;

                var user = new User
                {
                    Id = Guid.NewGuid(),

                    RoleId = role.Id,
                    RegionId = region.Id,

                    Name = request.Name.Trim(),
                    Email = email,
                    EmailNormalized = emailNormalized,

                    PasswordHash = passwordHash,

                    IsActive = true,
                    EmailVerified = true,

                    LastLoginAt = null,

                    CreatedAt = now,
                    UpdatedAt = now,

                    DeletedAt = null
                };

                await _userRepository.AddAsync(user);

                _logger.LogInformation(
                    "User created successfully. UserId: {UserId}, RoleId: {RoleId}, RegionId: {RegionId}.",
                    user.Id,
                    user.RoleId,
                    user.RegionId);

                return new UserDto
                {
                    Id = user.Id,
                    RoleId = user.RoleId,
                    RegionId = user.RegionId,
                    Name = user.Name,
                    Email = user.Email,
                    IsActive = user.IsActive,
                    LastLoginAt = user.LastLoginAt,
                    CreatedAt = user.CreatedAt,
                    UpdatedAt = user.UpdatedAt
                };
            }
            catch (ArgumentException)
            {
                throw;
            }
            catch (InvalidOperationException)
            {
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "An unexpected error occurred while creating a user.");

                throw new InvalidOperationException(
                    "An unexpected error occurred while creating the user.",
                    ex);
            }
        }
    }

}
