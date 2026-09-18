using AHE.BLL.DTOs.Authentication;
using System;
using System.Collections.Generic;
using System.Text;

namespace AHE.BLL.Interfaces
{
    public interface IAuthService
    {
        Task<LoginResponse> LoginAsync(LoginRequest request);

        Task<LoginResponse> RefreshTokenAsync(
            RefreshTokenRequest request);
    }
}
