using AHE.BLL.Interfaces;
using AHE.DAL.Entities;
using Microsoft.Extensions.Configuration;
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

        public JwtTokenService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public string GenerateAccessToken(User user)
        {
            var jwtSettings = _configuration.GetSection("Jwt");

            var key = jwtSettings["Key"]
                ?? throw new InvalidOperationException(
                    "JWT Key is not configured.");

            var issuer = jwtSettings["Issuer"]
                ?? throw new InvalidOperationException(
                    "JWT Issuer is not configured.");

            var audience = jwtSettings["Audience"]
                ?? throw new InvalidOperationException(
                    "JWT Audience is not configured.");

            var expirationMinutes = jwtSettings
                .GetValue<int>("AccessTokenExpirationMinutes");

            var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),

            new(
                JwtRegisteredClaimNames.Email,
                user.Email),

            new(
                ClaimTypes.Name,
                user.Name),

            new(
                ClaimTypes.Role,
                user.Role.Name)
        };

            var securityKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(key));

            var credentials = new SigningCredentials(
                securityKey,
                SecurityAlgorithms.HmacSha256);

            var expiresAt = DateTime.UtcNow.AddMinutes(
                expirationMinutes);

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: expiresAt,
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler()
                .WriteToken(token);
        }

        public DateTime GetAccessTokenExpiration()
        {
            var expirationMinutes = _configuration
                .GetSection("Jwt")
                .GetValue<int>("AccessTokenExpirationMinutes");

            return DateTime.UtcNow.AddMinutes(
                expirationMinutes);
        }
    }
}
