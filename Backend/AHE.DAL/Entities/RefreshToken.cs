using System;
using System.Collections.Generic;
using System.Net;
using System.Text;

namespace AHE.DAL.Entities
{
    public class RefreshToken
    {
        public Guid Id { get; set; }

        public Guid UserId { get; set; }

        public string TokenHash { get; set; } = null!;

        public DateTime ExpiresAt { get; set; }

        public DateTime? RevokedAt { get; set; }

        public DateTime CreatedAt { get; set; }

        public IPAddress? CreatedByIp { get; set; }

        // Navigation
        public User User { get; set; } = null!;
    }
}
