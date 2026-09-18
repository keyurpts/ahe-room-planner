using AHE.BLL.DTOs.Models;
using System;
using System.Collections.Generic;
using System.Text;

namespace AHE.BLL.Interfaces
{
    public interface IModelService
    {
        Task<List<ModelResponse>> GetAllAsync();

        Task<List<ModelResponse>> GetByCategoryIdAsync(
            Guid categoryId);

        Task<ModelResponse?> GetByIdAsync(Guid id);

        Task<ModelResponse> CreateAsync(
            CreateModelRequest request);

        Task<ModelResponse?> UpdateAsync(
            Guid id,
            UpdateModelRequest request);

        Task<bool> DeleteAsync(Guid id);

        Task<List<ModelResponse>> GetByCategoryForUserAsync(
          Guid userId,
          Guid categoryId);
    }
}
