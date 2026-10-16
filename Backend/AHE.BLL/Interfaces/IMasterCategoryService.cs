using AHE.BLL.DTOs.MasterCategories;
using System;
using System.Collections.Generic;
using System.Text;

namespace AHE.BLL.Interfaces
{
    public interface IMasterCategoryService
    {
        Task<List<MasterCategoryResponse>> GetAllAsync();

        Task<MasterCategoryResponse?> GetByIdAsync(Guid id);

        Task<MasterCategoryResponse> CreateAsync(
            CreateMasterCategoryRequest request);

        Task<MasterCategoryResponse?> UpdateAsync(
            Guid id,
            UpdateMasterCategoryRequest request);

        Task<bool> DeleteAsync(Guid id);
    }
}
