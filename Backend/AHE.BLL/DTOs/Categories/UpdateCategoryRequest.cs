using System;
using System.Collections.Generic;
using System.Text;

namespace AHE.BLL.DTOs.Categories
{
    public class UpdateCategoryRequest
    {
        public string CategoryName { get; set; } = null!;

        public string? Description { get; set; }
    }
}
