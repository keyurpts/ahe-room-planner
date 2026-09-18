using AHE.BLL.DTOs.Textures;
using System;
using System.Collections.Generic;
using System.Text;

namespace AHE.BLL.Interfaces
{
    public interface ITextureService
    {
        Task<TextureResponse> CreateAsync(
            CreateTextureRequest request);

        Task<List<TextureResponse>> GetAllAsync();

        Task<TextureResponse?> GetByIdAsync(Guid id);

        Task<TextureResponse?> UpdateAsync(
            Guid id,
            UpdateTextureRequest request);

        Task<bool> DeleteAsync(Guid id);
    }
}
