using AHE.BLL.Interfaces;
using System;
using System.Collections.Generic;
using System.Security.Cryptography;
using System.Text;

namespace AHE.BLL.Services
{
    public class RefreshTokenService : IRefreshTokenService
    {
        public string GenerateRefreshToken()
        {
            var randomBytes = RandomNumberGenerator.GetBytes(64);

            return Convert.ToBase64String(randomBytes);
        }

        public string HashRefreshToken(string refreshToken)
        {
            var hash = SHA256.HashData(
                Encoding.UTF8.GetBytes(refreshToken));

            return Convert.ToHexString(hash);
        }
    }
}
