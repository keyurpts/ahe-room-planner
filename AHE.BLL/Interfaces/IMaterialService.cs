using AHE.BLL.DTOs.Materials;
using System;
using System.Collections.Generic;
using System.Text;

namespace AHE.BLL.Interfaces
{
    public interface IMaterialService
    {
        Task<MaterialResponse> CreateAsync(
            CreateMaterialRequest request);

        Task<List<MaterialResponse>> GetAllAsync();

        Task<MaterialResponse?> GetByIdAsync(Guid id);

        Task<MaterialResponse?> UpdateAsync(
            Guid id,
            UpdateMaterialRequest request);

        Task<bool> DeleteAsync(Guid id);
    }
}
