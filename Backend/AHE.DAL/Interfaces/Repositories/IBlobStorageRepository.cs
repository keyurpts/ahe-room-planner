using System;
using System.Collections.Generic;
using System.Text;

namespace AHE.DAL.Interfaces.Repositories
{
    public interface IBlobStorageRepository
    {
        Task<bool> TestConnectionAsync(
            CancellationToken cancellationToken = default);

        Task<string> UploadAsync(
            Stream stream,
            string blobName,
            string contentType,
            CancellationToken cancellationToken = default);

        Task<Stream?> DownloadAsync(
            string blobName,
            CancellationToken cancellationToken = default);

        Task<bool> DeleteAsync(
            string blobName,
            CancellationToken cancellationToken = default);

        Uri GenerateUploadSasUrl(
            string blobPath,
            string contentType,
            int expiryMinutes);

        Uri GenerateDownloadSasUrl(
            string blobPath,
            int expiryMinutes);
    }
}
