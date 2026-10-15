import { createApi } from '@reduxjs/toolkit/query/react';
import { apiClient } from '@/services/api/client';

export interface Category {
  id: string;
  categoryName: string;
  description: string | null;
  isActive: boolean;
}
export interface Texture {
  id: string;
  textureName: string;
  isActive: boolean;
}
export interface ModelVariant {
  textureId: string;
  skuNumber: string;
  thumbnailPath: string | null;
  regions: { regionId: string; itemNumber: string; price: number }[];
}
export interface CatalogueModel {
  id: string;
  categoryId: string;
  modelName: string;
  description: string | null;
  modelPath: string | null;
  isActive: boolean;
  variants: ModelVariant[];
}
interface Thumbnail {
  downloadUrl: string;
  expiresAt: string;
}
interface DownloadUrl {
  downloadUrl: string;
}
interface TextureDownloadUrl {
  downloadUrl: string | null;
}
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Invalid catalogue response.');
  return value as Record<string, unknown>;
}
function string(value: unknown): string {
  if (typeof value !== 'string') throw new Error('Invalid catalogue text field.');
  return value;
}
function nullable(value: unknown): string | null {
  return value == null ? null : string(value);
}
function boolean(value: unknown): boolean {
  if (typeof value !== 'boolean') throw new Error('Invalid catalogue active field.');
  return value;
}
function array<T>(value: unknown, parse: (item: Record<string, unknown>) => T): T[] {
  if (!Array.isArray(value)) throw new Error('Invalid catalogue list.');
  return value.map((item: unknown) => parse(object(item)));
}
const categories = (value: unknown) =>
  array(value, (item): Category => ({
    id: string(item.id),
    categoryName: string(item.categoryName),
    description: nullable(item.description),
    isActive: boolean(item.isActive),
  })).filter((item) => item.isActive);
const textures = (value: unknown) =>
  array(value, (item): Texture => ({
    id: string(item.id),
    textureName: string(item.textureName),
    isActive: boolean(item.isActive),
  })).filter((item) => item.isActive);
const models = (value: unknown) =>
  array(value, (item): CatalogueModel => ({
    id: string(item.id),
    categoryId: string(item.categoryId),
    modelName: string(item.modelName),
    description: nullable(item.description),
    modelPath: nullable(item.modelPath),
    isActive: boolean(item.isActive),
    variants: array(item.variants, (variant): ModelVariant => ({
      textureId: string(variant.textureId),
      skuNumber: string(variant.skuNumber),
      thumbnailPath: nullable(variant.thumbnailPath),
      regions: array(variant.regions, (region) => {
        if (typeof region.price !== 'number' || !Number.isFinite(region.price) || region.price < 0)
          throw new Error('Invalid catalogue price.');
        return {
          regionId: string(region.regionId),
          itemNumber: string(region.itemNumber),
          price: region.price,
        };
      }),
    })),
  })).filter((item) => item.isActive);
function parseDownloadUrl(value: unknown): DownloadUrl {
  const item = object(value);
  const valueUrl = string(item.downloadUrl);
  const url = new URL(valueUrl);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password)
    throw new Error('Invalid thumbnail download URL.');
  return { downloadUrl: valueUrl };
}
function parseTextureDownloadUrl(value: unknown): TextureDownloadUrl {
  const item = object(value);
  if (item.downloadUrl === null) return { downloadUrl: null };
  return parseDownloadUrl(value);
}
function thumbnail(value: unknown): Thumbnail {
  const item = object(value);
  const { downloadUrl } = parseDownloadUrl(value);
  const expiresAt = string(item.expiresAt);
  if (!Number.isFinite(Date.parse(expiresAt))) throw new Error('Invalid thumbnail expiry date.');
  return { downloadUrl, expiresAt };
}
const thumbnailObjectUrls = new Map<string, string>();
const thumbnailKey = (arg: { categoryId: string; modelId: string; textureId: string }) =>
  JSON.stringify([arg.categoryId, arg.modelId, arg.textureId]);

export const catalogueApi = createApi({
  reducerPath: 'catalogueApi',
  baseQuery: async (
    { path, parse }: { path: string; parse: (value: unknown) => unknown },
    { signal },
  ) => {
    try {
      return { data: await apiClient.request(path, { parse, signal }) };
    } catch (error) {
      return {
        error: { message: error instanceof Error ? error.message : 'Catalogue request failed.' },
      };
    }
  },
  refetchOnFocus: true,
  refetchOnReconnect: true,
  endpoints: (builder) => ({
    getCategories: builder.query<Category[], undefined>({
      query: () => ({ path: '/Categories', parse: categories }),
    }),
    getTextures: builder.query<Texture[], undefined>({
      query: () => ({ path: '/Textures', parse: textures }),
    }),
    getModels: builder.query<CatalogueModel[], string>({
      query: (categoryId) => ({
        path: `/Models/category/${encodeURIComponent(categoryId)}`,
        parse: models,
      }),
    }),
    getThumbnail: builder.query<
      Thumbnail,
      { categoryId: string; modelId: string; textureId: string }
    >({
      async queryFn({ categoryId, modelId, textureId }, { signal }) {
        try {
          const signed = await apiClient.request(
            `/storage/thumbnails/${encodeURIComponent(categoryId)}/${encodeURIComponent(modelId)}/${encodeURIComponent(textureId)}/download-url`,
            { parse: thumbnail, signal },
          );
          const response = await fetch(signed.downloadUrl, { signal });
          if (!response.ok) throw new Error('Unable to download thumbnail.');
          const blob = await response.blob();
          const key = thumbnailKey({ categoryId, modelId, textureId });
          const previous = thumbnailObjectUrls.get(key);
          const downloadUrl = URL.createObjectURL(blob);
          thumbnailObjectUrls.set(key, downloadUrl);
          if (previous) URL.revokeObjectURL(previous);
          return { data: { ...signed, downloadUrl } };
        } catch (error) {
          return { error: { message: error instanceof Error ? error.message : 'Thumbnail request failed.' } };
        }
      },
      // Cache the downloaded image per category/model/texture, including across colour switches.
      keepUnusedDataFor: 30 * 60,
      async onCacheEntryAdded(arg, { cacheEntryRemoved }) {
        await cacheEntryRemoved;
        const key = thumbnailKey(arg);
        const url = thumbnailObjectUrls.get(key);
        if (url) URL.revokeObjectURL(url);
        thumbnailObjectUrls.delete(key);
      },
    }),
    getModelDownloadUrl: builder.query<DownloadUrl, string>({
      query: (modelId) => ({
        path: `/storage/${encodeURIComponent(modelId)}/download-url`,
        parse: parseDownloadUrl,
      }),
      keepUnusedDataFor: 60,
    }),
    getTextureDownloadUrl: builder.query<TextureDownloadUrl, { textureId: string }>({
      query: ({ textureId }) => ({
        path: `/storage/${encodeURIComponent(textureId)}/texture/download-url`,
        parse: parseTextureDownloadUrl,
      }),
      keepUnusedDataFor: 60,
    }),
  }),
});
export const {
  useGetCategoriesQuery,
  useGetTexturesQuery,
  useGetModelsQuery,
  useGetThumbnailQuery,
  useGetModelDownloadUrlQuery,
  useLazyGetModelDownloadUrlQuery,
  useGetTextureDownloadUrlQuery,
  useLazyGetTextureDownloadUrlQuery,
} = catalogueApi;
