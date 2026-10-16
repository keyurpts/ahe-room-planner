using System;
using System.Collections.Generic;
using System.Text;

namespace AHE.BLL.DTOs.MasterCategories
{
    public class MasterCategoryResponse
    {
        public Guid Id { get; set; }

        public string MasterCategoryName { get; set; } = null!;

        public string? Description { get; set; }

        public bool IsActive { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime UpdatedAt { get; set; }
    }
}
