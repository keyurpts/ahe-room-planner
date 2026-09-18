using AHE.BLL.DTOs.Categories;
using System;
using System.Collections.Generic;
using System.Text;

namespace AHE.BLL.Interfaces
{
    public interface ICategoryService
    {
        Task<List<CategoryResponse>> GetAllAsync();

        Task<CategoryResponse?> GetByIdAsync(Guid id);

        Task<CategoryResponse> CreateAsync(
            CreateCategoryRequest request);

        Task<CategoryResponse?> UpdateAsync(
            Guid id,
            UpdateCategoryRequest request);

        Task<bool> DeleteAsync(Guid id);
    }
}
