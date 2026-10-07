export interface CatalogueProduct {
  id: string;
  name: string;
  image: string;
  categoryId: string;
  modelId: string;
  textureId: string;
  skuNumber: string;
  regions: readonly { regionId: string; itemNumber: string; price: number }[];
  dimensionLabel?: string;
}
