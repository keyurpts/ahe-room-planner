using System;
using System.Collections.Generic;
using System.Text;

namespace AHE.BLL.DTOs.Regions
{
    public class RegionResponse
    {
        public Guid Id { get; set; }

        public string Name { get; set; } = null!;

        public string Code { get; set; } = null!;

        public string? Description { get; set; }
    }
}
