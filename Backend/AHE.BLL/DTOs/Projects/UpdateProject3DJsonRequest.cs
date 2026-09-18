using System;
using System.Collections.Generic;
using System.Text;
using System.Text.Json;

namespace AHE.BLL.DTOs.Projects
{
    public class UpdateProject3DJsonRequest
    {
        public JsonDocument Project3DJson { get; set; } = null!;
    }
}
