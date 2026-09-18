using System;
using System.Collections.Generic;
using System.Text;

namespace AHE.BLL.DTOs.Users
{
    public class CreateUserDto { 
        public string Name { get; set; } = null!; 
        public string Email { get; set; } = null!; 
        public string Password { get; set; } = null!; 
        public string RoleName { get; set; } = null!; 
        public string RegionCode { get; set; } = null!;
    }

}
