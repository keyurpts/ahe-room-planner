using System;
using System.Collections.Generic;
using System.Text;

namespace AHE.BLL.DTOs.Categories
{
    public class CategoryResponse
    {
        public Guid Id { get; set; }

        public string CategoryName { get; set; } = null!;

        public string? Description { get; set; }

        public bool IsActive { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime UpdatedAt { get; set; }
    }
}
