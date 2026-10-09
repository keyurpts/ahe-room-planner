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
function thumbnail(value: unknown): Thumbnail {
  const item = object(value);
  const downloadUrl = string(item.downloadUrl);
  const url = new URL(downloadUrl);
  const expiresAt = string(item.expiresAt);
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    !Number.isFinite(Date.parse(expiresAt))
  )
    throw new Error('Invalid thumbnail download URL.');
  return { downloadUrl, expiresAt };
}
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
      query: ({ categoryId, modelId, textureId }) => ({
        path: `/storage/thumbnails/${encodeURIComponent(categoryId)}/${encodeURIComponent(modelId)}/${encodeURIComponent(textureId)}/download-url`,
        parse: thumbnail,
      }),
      keepUnusedDataFor: 0,
    }),
    getModelDownloadUrl: builder.query<Thumbnail, string>({
      query: (modelId) => ({
        path: `/api/storage/${encodeURIComponent(modelId)}/download-url`,
        parse: thumbnail,
      }),
      keepUnusedDataFor: 0,
    }),
  }),
});
export const {
  useGetCategoriesQuery,
  useGetTexturesQuery,
  useGetModelsQuery,
  useGetThumbnailQuery,
  useGetModelDownloadUrlQuery,
} = catalogueApi;
