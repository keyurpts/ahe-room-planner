using AHE.DAL.Interfaces.Repositories;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Azure.Storage.Sas;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Text;

namespace AHE.DAL.Repositories
{
    public class AzureBlobStorageRepository : IBlobStorageRepository
    {
        private readonly BlobContainerClient _containerClient;
        private readonly ILogger<AzureBlobStorageRepository> _logger;

        public AzureBlobStorageRepository(IConfiguration configuration, ILogger<AzureBlobStorageRepository> logger)
        {
            _logger = logger;

            var connectionString =
                configuration["AzureStorage:ConnectionString"]
                ?? throw new InvalidOperationException(
                    "Azure Storage connection string is not configured.");

            var containerName =
                configuration["AzureStorage:ContainerName"]
                ?? throw new InvalidOperationException(
                    "Azure Storage container name is not configured.");

            var blobServiceClient =
                new BlobServiceClient(connectionString);

            _containerClient =
                blobServiceClient.GetBlobContainerClient(containerName);
        }

        public async Task<bool> TestConnectionAsync(
            CancellationToken cancellationToken = default)
        {
            await _containerClient.CreateIfNotExistsAsync(
                cancellationToken: cancellationToken);

            return await _containerClient.ExistsAsync(
                cancellationToken);
        }

        public async Task<string> UploadAsync(
            Stream stream,
            string blobName,
            string contentType,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(blobName))
            {
                throw new ArgumentException(
                    "Blob name is required.",
                    nameof(blobName));
            }

            if (stream is null)
            {
                throw new ArgumentNullException(nameof(stream));
            }

            if (!stream.CanRead)
            {
                throw new ArgumentException(
                    "The stream must be readable.",
                    nameof(stream));
            }

            if (string.IsNullOrWhiteSpace(contentType))
            {
                throw new ArgumentException(
                    "Content type is required.",
                    nameof(contentType));
            }

            try
            {
                await _containerClient.CreateIfNotExistsAsync(
                    cancellationToken: cancellationToken);

                var blobClient =
                    _containerClient.GetBlobClient(blobName);

                await blobClient.UploadAsync(
                    stream,
                    new BlobUploadOptions
                    {
                        HttpHeaders = new BlobHttpHeaders
                        {
                            ContentType = contentType
                        }
                    },
                    cancellationToken);

                var blobUri = blobClient.Uri.ToString();

                _logger.LogInformation(
                    "Blob uploaded successfully. BlobName: {BlobName}.",
                    blobName);

                return blobUri;
            }
            catch (OperationCanceledException)
                when (cancellationToken.IsCancellationRequested)
            {
                _logger.LogDebug(
                    "Blob upload was canceled. BlobName: {BlobName}.",
                    blobName);

                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "An error occurred while uploading blob {BlobName}.",
                    blobName);

                throw;
            }
        }

        public async Task<Stream?> DownloadAsync(
            string blobName,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(blobName))
            {
                throw new ArgumentException(
                    "Blob name is required.",
                    nameof(blobName));
            }

            try
            {
                var blobClient =
                    _containerClient.GetBlobClient(blobName);

                var exists = await blobClient.ExistsAsync(
                    cancellationToken);

                if (!exists.Value)
                {
                    _logger.LogWarning(
                        "Blob {BlobName} was not found.",
                        blobName);

                    return null;
                }

                var response =
                    await blobClient.DownloadStreamingAsync(
                        cancellationToken: cancellationToken);

                _logger.LogDebug(
                    "Blob {BlobName} downloaded successfully.",
                    blobName);

                return response.Value.Content;
            }
            catch (OperationCanceledException)
                when (cancellationToken.IsCancellationRequested)
            {
                _logger.LogDebug(
                    "Blob download was canceled. BlobName: {BlobName}.",
                    blobName);

                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "An error occurred while downloading blob {BlobName}.",
                    blobName);

                throw;
            }
        }

        public async Task<bool> DeleteAsync(
            string blobName,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(blobName))
            {
                throw new ArgumentException(
                    "Blob name is required.",
                    nameof(blobName));
            }

            try
            {
                var blobClient =
                    _containerClient.GetBlobClient(blobName);

                var response =
                    await blobClient.DeleteIfExistsAsync(
                        cancellationToken: cancellationToken);

                if (response.Value)
                {
                    _logger.LogInformation(
                        "Blob {BlobName} deleted successfully.",
                        blobName);
                }
                else
                {
                    _logger.LogDebug(
                        "Blob {BlobName} did not exist; no deletion was performed.",
                        blobName);
                }

                return response.Value;
            }
            catch (OperationCanceledException)
                when (cancellationToken.IsCancellationRequested)
            {
                _logger.LogDebug(
                    "Blob deletion was canceled. BlobName: {BlobName}.",
                    blobName);

                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "An error occurred while deleting blob {BlobName}.",
                    blobName);

                throw;
            }
        }

        public Uri GenerateUploadSasUrl(
        string blobPath,
        string contentType,
        int expiryMinutes)
        {
            if (string.IsNullOrWhiteSpace(blobPath))
            {
                throw new ArgumentException(
                    "Blob path is required.",
                    nameof(blobPath));
            }

            if (string.IsNullOrWhiteSpace(contentType))
            {
                throw new ArgumentException(
                    "Content type is required.",
                    nameof(contentType));
            }

            if (expiryMinutes <= 0)
            {
                throw new ArgumentOutOfRangeException(
                    nameof(expiryMinutes),
                    "Expiry duration must be greater than zero.");
            }

            try
            {
                var blobClient =
                    _containerClient.GetBlobClient(blobPath);

                var sasBuilder = new BlobSasBuilder
                {
                    BlobContainerName = _containerClient.Name,
                    BlobName = blobPath,
                    Resource = "b",
                    ExpiresOn = DateTimeOffset.UtcNow.AddMinutes(
                        expiryMinutes),
                    ContentType = contentType
                };

                sasBuilder.SetPermissions(
                    BlobSasPermissions.Create |
                    BlobSasPermissions.Write);

                var sasUri =
                    blobClient.GenerateSasUri(sasBuilder);

                _logger.LogInformation(
                    "Upload SAS URL generated for blob {BlobPath}. Expires in {ExpiryMinutes} minutes.",
                    blobPath,
                    expiryMinutes);

                return sasUri;
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "An error occurred while generating an upload SAS URL for blob {BlobPath}.",
                    blobPath);

                throw;
            }
        }

        public Uri GenerateDownloadSasUrl(
            string blobPath,
            int expiryMinutes)
        {
            if (string.IsNullOrWhiteSpace(blobPath))
            {
                throw new ArgumentException(
                    "Blob path is required.",
                    nameof(blobPath));
            }

            if (expiryMinutes <= 0)
            {
                throw new ArgumentOutOfRangeException(
                    nameof(expiryMinutes),
                    "Expiry duration must be greater than zero.");
            }

            try
            {
                var blobClient =
                    _containerClient.GetBlobClient(blobPath);

                var sasBuilder = new BlobSasBuilder
                {
                    BlobContainerName = _containerClient.Name,
                    BlobName = blobPath,
                    Resource = "b",
                    ExpiresOn = DateTimeOffset.UtcNow.AddMinutes(
                        expiryMinutes)
                };

                sasBuilder.SetPermissions(
                    BlobSasPermissions.Read);

                var sasUri =
                    blobClient.GenerateSasUri(sasBuilder);

                _logger.LogInformation(
                    "Read-only SAS URL generated for blob {BlobPath}. Expires in {ExpiryMinutes} minutes.",
                    blobPath,
                    expiryMinutes);

                return sasUri;
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "An error occurred while generating a read-only SAS URL for blob {BlobPath}.",
                    blobPath);

                throw;
            }
        }
    }
}
