using System;
using System.Collections.Generic;
using System.Text;

namespace AHE.BLL.DTOs.Models
{
    public class CreateModelVariantRegionRequest
    {
        public Guid RegionId { get; set; }

        public string ItemNumber { get; set; } = null!;

        public decimal Price { get; set; }
    }
}
