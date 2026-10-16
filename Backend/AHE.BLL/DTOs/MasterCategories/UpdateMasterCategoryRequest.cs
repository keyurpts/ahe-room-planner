using System;
using System.Collections.Generic;
using System.Text;

namespace AHE.BLL.DTOs.MasterCategories
{
    public class UpdateMasterCategoryRequest
    {
        public string MasterCategoryName { get; set; } = null!;

        public string? Description { get; set; }
    }
}
