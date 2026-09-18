using AHE.DAL.Interfaces.Repositories;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Azure.Storage.Sas;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Text;

namespace AHE.DAL.Repositories
{
    public class AzureBlobStorageRepository : IBlobStorageRepository
    {
        private readonly BlobContainerClient _containerClient;

        public AzureBlobStorageRepository(IConfiguration configuration)
        {
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

            return blobClient.Uri.ToString();
        }

        public async Task<Stream?> DownloadAsync(
            string blobName,
            CancellationToken cancellationToken = default)
        {
            var blobClient =
                _containerClient.GetBlobClient(blobName);

            if (!await blobClient.ExistsAsync(cancellationToken))
                return null;

            var response =
                await blobClient.DownloadStreamingAsync(
                    cancellationToken: cancellationToken);

            return response.Value.Content;
        }

        public async Task<bool> DeleteAsync(
            string blobName,
            CancellationToken cancellationToken = default)
        {
            var blobClient =
                _containerClient.GetBlobClient(blobName);

            var response =
                await blobClient.DeleteIfExistsAsync(
                    cancellationToken: cancellationToken);

            return response.Value;
        }

        public Uri GenerateUploadSasUrl(
        string blobPath,
        string contentType,
        int expiryMinutes)
        {
            var blobClient =
                _containerClient.GetBlobClient(blobPath);

            var sasBuilder = new BlobSasBuilder
            {
                BlobContainerName = _containerClient.Name,
                BlobName = blobPath,
                Resource = "b",
                ExpiresOn = DateTimeOffset.UtcNow.AddMinutes(expiryMinutes),
                ContentType = contentType
            };

            sasBuilder.SetPermissions(
                BlobSasPermissions.Create |
                BlobSasPermissions.Write);

            return blobClient.GenerateSasUri(sasBuilder);
        }

        public Uri GenerateDownloadSasUrl(
            string blobPath,
            int expiryMinutes)
        {
            var blobClient =
                _containerClient.GetBlobClient(blobPath);

            var sasBuilder = new BlobSasBuilder
            {
                BlobContainerName = _containerClient.Name,
                BlobName = blobPath,
                Resource = "b",
                ExpiresOn = DateTimeOffset.UtcNow.AddMinutes(expiryMinutes)
            };

            sasBuilder.SetPermissions(
                BlobSasPermissions.Read);

            return blobClient.GenerateSasUri(sasBuilder);
        }
    }
}
