using System;
using System.Collections.Generic;
using System.Text;

namespace AHE.BLL.DTOs.Authentication
{
    public class LoginResponse
    {
        public string AccessToken { get; set; } = string.Empty;

        public string RefreshToken { get; set; } = string.Empty;

        public DateTime AccessTokenExpiresAt { get; set; }
    }
}
