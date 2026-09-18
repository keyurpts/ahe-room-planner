using AHE.BLL.Interfaces;
using Microsoft.AspNetCore.Mvc;
using AHE.BLL.DTOs.Authentication;
using AHE.BLL.Interfaces;
using Microsoft.AspNetCore.Mvc;


namespace AHE.PL.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(
            [FromBody] LoginRequest request)
        {
            try
            {
                var response = await _authService.LoginAsync(request);

                return Ok(response);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new
                {
                    message = ex.Message
                });
            }
        }
    }
}
