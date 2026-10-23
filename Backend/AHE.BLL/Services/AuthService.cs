using AHE.BLL.DTOs.Authentication;
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
    public class AuthService : IAuthService
    {
        private readonly IUserRepository _userRepository;
        private readonly IRefreshTokenRepository _refreshTokenRepository;
        private readonly IPasswordHasher _passwordHasher;
        private readonly IJwtTokenService _jwtTokenService;
        private readonly IRefreshTokenService _refreshTokenService;
        private readonly ILogger<AuthService> _logger;

        public AuthService(
            IUserRepository userRepository,
            IRefreshTokenRepository refreshTokenRepository,
            IPasswordHasher passwordHasher,
            IJwtTokenService jwtTokenService,
            IRefreshTokenService refreshTokenService,
            ILogger<AuthService> logger)
        {
            _userRepository = userRepository;
            _refreshTokenRepository = refreshTokenRepository;
            _passwordHasher = passwordHasher;
            _jwtTokenService = jwtTokenService;
            _refreshTokenService = refreshTokenService;
            _logger = logger;
        }

        public async Task<LoginResponse> LoginAsync(
            LoginRequest request)
        {

            if (request is null)
            {
                throw new ArgumentNullException(nameof(request));
            }

            if (string.IsNullOrWhiteSpace(request.Email) ||
                string.IsNullOrWhiteSpace(request.Password))
            {
                throw new ArgumentException(
                    "Email and password are required.");
            }

            try
            {
                var normalizedEmail =
                    request.Email.Trim().ToUpperInvariant();

                var user = await _userRepository
                    .GetByEmailAsync(normalizedEmail);

                // Use the same message for unknown users and invalid passwords.
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

                var now = DateTime.UtcNow;

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
                    ExpiresAt = now.AddDays(7),
                    CreatedAt = now
                };

                // Persist the refresh token before returning credentials.
                await _refreshTokenRepository.AddAsync(
                    refreshTokenEntity);

                // Persist the last login timestamp.
                user.LastLoginAt = now;

                return new LoginResponse
                {
                    AccessToken = accessToken,
                    RefreshToken = refreshToken,
                    AccessTokenExpiresAt = accessTokenExpiresAt
                };
            }
            catch (UnauthorizedAccessException)
            {
                // Expected authentication failure.
                // Do not log passwords, tokens, or sensitive credentials.
                throw;
            }
            catch (ArgumentNullException)
            {
                throw;
            }
            catch (ArgumentException)
            {
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "An unexpected error occurred during login.");

                throw new InvalidOperationException(
                    "Unable to process login at this time.",
                    ex);
            }
        }

        public async Task<LoginResponse> RefreshTokenAsync(
            RefreshTokenRequest request)
        {
            throw new NotImplementedException();
        }
    }
}
