using System;
using System.Collections.Generic;
using System.Text;
using System.Text.Json;

namespace AHE.BLL.DTOs.BenchtopColour
{
    public class BenchtopColourResponse
    {
        public Guid Id { get; set; }

        public string BenchtopColourName { get; set; } = null!;

        public string AssetPath { get; set; } = null!;

        public JsonDocument? BenchtopColourMetadata { get; set; }
    }
}
