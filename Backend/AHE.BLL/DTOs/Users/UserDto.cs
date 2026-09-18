using System;
using System.Collections.Generic;
using System.Text;

namespace AHE.BLL.DTOs.Users
{
    public class UserDto { 
        public Guid Id { get; set; } 
        public Guid RoleId { get; set; } 
        public Guid RegionId { get; set; } 
        public string Name { get; set; } = null!; 
        public string Email { get; set; } = null!; 
        public bool IsActive { get; set; } 
        public DateTime? LastLoginAt { get; set; } 
        public DateTime CreatedAt { get; set; } 
        public DateTime UpdatedAt { get; set; }
    }
}
