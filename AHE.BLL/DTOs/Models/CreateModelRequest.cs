using System;
using System.Collections.Generic;
using System.Text.Json;

namespace AHE.BLL.DTOs.Models;

public class CreateModelRequest
{
    //public string? ModelId { get; set; }

    public Guid CategoryId { get; set; }

    public string ModelName { get; set; } = null!;

    public string? ModelPath { get; set; }

    public string? Description { get; set; }

    public JsonDocument? ModelMetadata { get; set; }

    public List<CreateModelVariantRequest> Variants { get; set; }
        = new();
}

