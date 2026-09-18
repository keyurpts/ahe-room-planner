using System;
using System.Collections.Generic;
using System.Text;

namespace AHE.DAL.Entities
{
    public class User
    {
        public Guid Id { get; set; }

        public Guid RoleId { get; set; }

        public Guid RegionId { get; set; }

        public string Name { get; set; } = null!;

        public string Email { get; set; } = null!;

        public string EmailNormalized { get; set; } = null!;

        public string PasswordHash { get; set; } = null!;

        public bool IsActive { get; set; }

        public bool EmailVerified { get; set; }

        public DateTime? LastLoginAt { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime UpdatedAt { get; set; }

        public DateTime? DeletedAt { get; set; }

        // Foreign-key navigation
        public Role Role { get; set; } = null!;

        public Region Region { get; set; } = null!;

        // Collection navigation
        public ICollection<Project> Projects { get; set; } = new List<Project>();

        public ICollection<RefreshToken> RefreshTokens { get; set; } =
            new List<RefreshToken>();
    }
}
