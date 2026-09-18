using AHE.BLL.DTOs.Authentication;
using AHE.BLL.DTOs.Users;
using AHE.BLL.Interfaces;
using AHE.DAL.Entities;
using AHE.DAL.Interfaces.Repositories;
using AHE.DAL.Repositories;
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

        public UserService(
            IUserRepository userRepository,
            IRoleRepository roleRepository,
            IRegionRepository regionRepository,
            IPasswordHasher passwordHasher)
        {
            _userRepository = userRepository;
            _roleRepository = roleRepository;
            _regionRepository = regionRepository;
            _passwordHasher = passwordHasher;
        }

        public async Task<UserDto> CreateUserAsync(CreateUserDto request)
        {
            if (string.IsNullOrWhiteSpace(request.Name))
                throw new ArgumentException("Name is required.");

            if (string.IsNullOrWhiteSpace(request.Email))
                throw new ArgumentException("Email is required.");

            if (string.IsNullOrWhiteSpace(request.Password))
                throw new ArgumentException("Password is required.");

            if (string.IsNullOrWhiteSpace(request.RoleName))
                throw new ArgumentException("Role name is required.");

            if (string.IsNullOrWhiteSpace(request.RegionCode))
                throw new ArgumentException("Region code is required.");

            var email = request.Email.Trim();
            var emailNormalized = email.ToUpperInvariant();

            // Check whether user already exists
            var existingUser =
                await _userRepository.GetByEmailAsync(emailNormalized);

            if (existingUser != null)
            {
                throw new InvalidOperationException(
                    "A user with this email already exists.");
            }

            // Get role
            var role =
                await _roleRepository.GetByNameAsync(request.RoleName.Trim());

            if (role == null)
            {
                throw new ArgumentException(
                    $"Role '{request.RoleName}' was not found.");
            }

            // Get region
            var region =
                await _regionRepository.GetByCodeAsync(request.RegionCode.Trim());

            if (region == null)
            {
                throw new ArgumentException(
                    $"Region '{request.RegionCode}' was not found.");
            }

            // Hash password
            var passwordHash =
                _passwordHasher.HashPassword(request.Password);

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

                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,

                DeletedAt = null
            };

            await _userRepository.AddAsync(user);

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
    }

}
