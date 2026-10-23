using AHE.BLL.Interfaces;
using AHE.DAL.Interfaces.Repositories;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Security.Cryptography;
using System.Text;

namespace AHE.BLL.Services
{
    public class RefreshTokenService : IRefreshTokenService
    {

        private readonly ILogger<RefreshTokenService> _logger;

        public RefreshTokenService(
            ILogger<RefreshTokenService> logger)
        {
            _logger = logger;
        }


        public string GenerateRefreshToken()
        {
            try
            {
                var randomBytes =
                    RandomNumberGenerator.GetBytes(64);

                var refreshToken =
                    Convert.ToBase64String(randomBytes);

                _logger.LogDebug(
                    "Refresh token generated successfully.");

                return refreshToken;
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "An error occurred while generating a refresh token.");

                throw;
            }
        }

        public string HashRefreshToken(string refreshToken)
        {
            if (string.IsNullOrWhiteSpace(refreshToken))
            {
                throw new ArgumentException(
                    "Refresh token is required.",
                    nameof(refreshToken));
            }

            try
            {
                var tokenBytes =
                    Encoding.UTF8.GetBytes(refreshToken);

                var hash = SHA256.HashData(tokenBytes);

                var hashedToken =
                    Convert.ToHexString(hash);

                _logger.LogDebug(
                    "Refresh token hashed successfully.");

                return hashedToken;
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "An error occurred while hashing a refresh token.");

                throw;
            }
        }
    }
}
