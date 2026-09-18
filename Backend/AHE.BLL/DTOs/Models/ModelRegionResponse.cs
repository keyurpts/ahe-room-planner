using System;
using System.Collections.Generic;
using System.Text;

namespace AHE.BLL.DTOs.Models
{
    public class ModelRegionResponse
    {
        public Guid RegionId { get; set; }

        public decimal Price { get; set; }

        public string? Description { get; set; }
    }
}
