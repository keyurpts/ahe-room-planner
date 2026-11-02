using AHE.BLL.Interfaces;
using AHE.DAL.Entities;
using AHE.DAL.Repositories;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace AHE.BLL.Services
{
    public class JwtTokenService : IJwtTokenService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<JwtTokenService> _logger;

        public JwtTokenService(IConfiguration configuration, ILogger<JwtTokenService> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        public string GenerateAccessToken(User user)
        {
            if (user is null)
            {
                throw new ArgumentNullException(nameof(user));
            }

            if (user.Id == Guid.Empty)
            {
                throw new ArgumentException(
                    "User ID cannot be empty.",
                    nameof(user));
            }

            if (string.IsNullOrWhiteSpace(user.Email))
            {
                throw new ArgumentException(
                    "User email is required.",
                    nameof(user));
            }

            if (string.IsNullOrWhiteSpace(user.Name))
            {
                throw new ArgumentException(
                    "User name is required.",
                    nameof(user));
            }

            if (user.Role is null ||
                string.IsNullOrWhiteSpace(user.Role.Name))
            {
                throw new ArgumentException(
                    "User role is required to generate an access token.",
                    nameof(user));
            }

            try
            {
                var jwtSettings =
                    _configuration.GetSection("Jwt");

                var key = jwtSettings["Key"];

                if (string.IsNullOrWhiteSpace(key))
                {
                    throw new InvalidOperationException(
                        "JWT Key is not configured.");
                }

                var issuer = jwtSettings["Issuer"];

                if (string.IsNullOrWhiteSpace(issuer))
                {
                    throw new InvalidOperationException(
                        "JWT Issuer is not configured.");
                }

                var audience = jwtSettings["Audience"];

                if (string.IsNullOrWhiteSpace(audience))
                {
                    throw new InvalidOperationException(
                        "JWT Audience is not configured.");
                }

                var expirationMinutes = jwtSettings
                    .GetValue<int>("AccessTokenExpirationMinutes");

                if (expirationMinutes <= 0)
                {
                    throw new InvalidOperationException(
                        "JWT access token expiration must be greater than zero.");
                }

                var keyBytes = Encoding.UTF8.GetBytes(key);

                // HS256 requires a sufficiently strong signing key.
                if (keyBytes.Length < 32)
                {
                    throw new InvalidOperationException(
                        "JWT Key must be at least 32 bytes for HS256.");
                }

                var now = DateTime.UtcNow;
                var expiresAt = now.AddMinutes(expirationMinutes);

                var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new(ClaimTypes.Name, user.Name),
            new(ClaimTypes.Role, user.Role.Name)
        };

                var securityKey =
                    new SymmetricSecurityKey(keyBytes);

                var credentials = new SigningCredentials(
                    securityKey,
                    SecurityAlgorithms.HmacSha256);

                var token = new JwtSecurityToken(
                    issuer: issuer,
                    audience: audience,
                    claims: claims,
                    notBefore: now,
                    expires: expiresAt,
                    signingCredentials: credentials);

                var tokenString =
                    new JwtSecurityTokenHandler().WriteToken(token);

                _logger.LogDebug(
                    "Access token generated for user {UserId}. Expiration: {ExpiresAt}.",
                    user.Id,
                    expiresAt);

                return tokenString;
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "An error occurred while generating an access token for user {UserId}.",
                    user.Id);

                throw;
            }
        }

        public DateTime GetAccessTokenExpiration()
        {
            try
            {
                var jwtSettings =
                    _configuration.GetSection("Jwt");

                var expirationMinutes =
                    jwtSettings.GetValue<int>(
                        "AccessTokenExpirationMinutes");

                if (expirationMinutes <= 0)
                {
                    throw new InvalidOperationException(
                        "JWT access token expiration must be greater than zero.");
                }

                var expiresAt =
                    DateTime.UtcNow.AddMinutes(expirationMinutes);

                _logger.LogDebug(
                    "Access token expiration calculated for {ExpirationMinutes} minutes.",
                    expirationMinutes);

                return expiresAt;
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "An error occurred while calculating access token expiration.");

                throw;
            }
        }
    }
}
