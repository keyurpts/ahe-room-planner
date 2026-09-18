using System;
using System.Collections.Generic;
using System.Text;
using System.Text.Json;

namespace AHE.BLL.DTOs.Projects
{
    public class UpdateProject2DJsonRequest
    {
        public JsonDocument Project2DJson { get; set; } = null!;
    }
}
