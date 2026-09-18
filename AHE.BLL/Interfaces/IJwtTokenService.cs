using AHE.DAL.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace AHE.BLL.Interfaces
{
    public interface IJwtTokenService
    {
        string GenerateAccessToken(User user);

        DateTime GetAccessTokenExpiration();
    }
}
