using AHE.BLL.DTOs.Authentication;
using AHE.BLL.Interfaces;
using AHE.DAL.Entities;
using AHE.DAL.Interfaces.Repositories;
using System;
using System.Collections.Generic;
using System.Text;

namespace AHE.BLL.Services
{
    public class AuthService : IAuthService
    {
        private readonly IUserRepository _userRepository;
        private readonly IRefreshTokenRepository _refreshTokenRepository;
        private readonly IPasswordHasher _passwordHasher;
        private readonly IJwtTokenService _jwtTokenService;
        private readonly IRefreshTokenService _refreshTokenService;

        public AuthService(
            IUserRepository userRepository,
            IRefreshTokenRepository refreshTokenRepository,
            IPasswordHasher passwordHasher,
            IJwtTokenService jwtTokenService,
            IRefreshTokenService refreshTokenService)
        {
            _userRepository = userRepository;
            _refreshTokenRepository = refreshTokenRepository;
            _passwordHasher = passwordHasher;
            _jwtTokenService = jwtTokenService;
            _refreshTokenService = refreshTokenService;
        }

        public async Task<LoginResponse> LoginAsync(
            LoginRequest request)
        {
            var normalizedEmail =
                request.Email.Trim().ToUpperInvariant();

            var user = await _userRepository
                .GetByEmailAsync(normalizedEmail);

            if (user is null)
            {
                throw new UnauthorizedAccessException(
                    "Invalid email or password.");
            }

            if (!user.IsActive)
            {
                throw new UnauthorizedAccessException(
                    "User account is inactive.");
            }

            if (!user.EmailVerified)
            {
                throw new UnauthorizedAccessException(
                    "Email address is not verified.");
            }

            var passwordValid = _passwordHasher.VerifyPassword(
                request.Password,
                user.PasswordHash);

            if (!passwordValid)
            {
                throw new UnauthorizedAccessException(
                    "Invalid email or password.");
            }

            var accessToken =
                _jwtTokenService.GenerateAccessToken(user);

            var accessTokenExpiresAt =
                _jwtTokenService.GetAccessTokenExpiration();

            var refreshToken =
                _refreshTokenService.GenerateRefreshToken();

            var refreshTokenHash =
                _refreshTokenService.HashRefreshToken(
                    refreshToken);

            var refreshTokenEntity = new RefreshToken
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                TokenHash = refreshTokenHash,
                ExpiresAt = DateTime.UtcNow.AddDays(7),
                CreatedAt = DateTime.UtcNow
            };

            await _refreshTokenRepository.AddAsync(
                refreshTokenEntity);

            // TO DO : Currently this LastLoginAt is not persisted in the DB
            user.LastLoginAt = DateTime.UtcNow;

            return new LoginResponse
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                AccessTokenExpiresAt = accessTokenExpiresAt
            };
        }

        public async Task<LoginResponse> RefreshTokenAsync(
            RefreshTokenRequest request)
        {
            throw new NotImplementedException();
        }
    }
}
