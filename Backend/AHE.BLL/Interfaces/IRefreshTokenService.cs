using System;
using System.Collections.Generic;
using System.Text;

namespace AHE.BLL.Interfaces
{
    public interface IRefreshTokenService
    {
        string GenerateRefreshToken();

        string HashRefreshToken(string refreshToken);
    }
}
