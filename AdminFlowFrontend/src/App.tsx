import type { ChangeEvent, FormEvent } from "react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import "./App.css";

const API_BASE_URL = "http://localhost:5217";
// const API_BASE_URL = "http://172.16.17.185:5217";

// ============================================================
// TYPES
// ============================================================

type CategoryResponse = {
  id?: string;
  categoryId?: string;
  categoryName: string;
  description?: string;
};

type RegionResponse = {
  id?: string;
  regionId?: string;
  name: string;
  code?: string;
};

type TextureResponse = {
  id?: string;
  textureId?: string;
  textureName: string;
  thumbnailPath?: string;
  texturePath?: string;
  isActive?: boolean;
};

type CreateTextureResponse = {
  id?: string;
  textureId?: string;
  textureName?: string;
  textureMetadata?: string;
  uploadUrl?: string;
  UploadUrl?: string;
  blobPath?: string;
  BlobPath?: string;
  expiresAt?: string;
  ExpiresAt?: string;
};

type ModelVariantRegionResponse = {
  regionId: string;
  itemNumber: string;
  price: number;
};

type ModelVariantResponse = {
  modelId: string;
  textureId: string;
  skuNumber: string;
  thumbnailPath?: string;
  regions?: ModelVariantRegionResponse[];
};

type ModelResponse = {
  id: string;
  categoryId: string;
  modelName: string;
  modelPath?: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  variants?: ModelVariantResponse[];
};

type UploadUrlResponse = {
  modelId: string;
  blobPath: string;
  uploadUrl: string;
  expiresAt: string;
};

type VariantThumbnailUploadUrlResponse = {
  modelId: string;
  textureId: string;
  blobPath: string;
  uploadUrl: string;
  expiresAt: string;
};

type VariantRegion = {
  regionId: string;
  itemNumber: string;
};

type ModelVariantForm = {
  id: string;
  textureId: string;
  skuNumber: string;
  thumbnailFile: File | null;
  regions: VariantRegion[];
};

// ============================================================
// HELPERS
// ============================================================

function getEntityId(entity: {
  id?: string;
  categoryId?: string;
  regionId?: string;
  textureId?: string;
}): string {
  return (
    entity.id ||
    entity.categoryId ||
    entity.regionId ||
    entity.textureId ||
    ""
  );
}

function getProxiedUploadUrl(uploadUrl: string): string {
  const url = new URL(uploadUrl);
  // return `/azurite${url.pathname}${url.search}`;
  return uploadUrl;
}

function createEmptyVariant(): ModelVariantForm {
  return {
    id: crypto.randomUUID(),
    textureId: "",
    skuNumber: "",
    thumbnailFile: null,
    regions: [],
  };
}

// ============================================================
// APP
// ============================================================

function App() {
  const [accessToken, setAccessToken] = useState("");

  // ============================================================
  // CATEGORY STATE
  // ============================================================

  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [createdCategory, setCreatedCategory] = useState<CategoryResponse | null>(null);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");

  // ============================================================
  // TEXTURE CREATION STATE
  // ============================================================

  const [newTextureName, setNewTextureName] = useState("");
  const [newTextureMetadata, setNewTextureMetadata] = useState("");
  const [textureFile, setTextureFile] = useState<File | null>(null);
  const [isCreatingTexture, setIsCreatingTexture] = useState(false);
  const [createdTexture, setCreatedTexture] = useState<CreateTextureResponse | null>(null);

  // ============================================================
  // REGION STATE
  // ============================================================

  const [regions, setRegions] = useState<RegionResponse[]>([]);

  // ============================================================
  // TEXTURE STATE
  // ============================================================

  const [textures, setTextures] = useState<TextureResponse[]>([]);

  // ============================================================
  // MODEL STATE
  // ============================================================

  // const [modelCode, setModelCode] = useState("");
  const [modelName, setModelName] = useState("");
  const [description, setDescription] = useState("");
  const [assetFile, setAssetFile] = useState<File | null>(null);
  const [variants, setVariants] = useState<ModelVariantForm[]>([createEmptyVariant()]);

  // ============================================================
  // RESULT STATE
  // ============================================================

  const [createdModel, setCreatedModel] = useState<ModelResponse | null>(null);
  const [uploadInfo, setUploadInfo] = useState<UploadUrlResponse | null>(null);
  const [thumbnailUploads, setThumbnailUploads] = useState<
    VariantThumbnailUploadUrlResponse[]
  >([]);
  const [status, setStatus] = useState("");
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [isCreatingModel, setIsCreatingModel] = useState(false);

  // ============================================================
  // GENERIC API REQUEST
  // ============================================================

  async function apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    console.log("API Request:", options.method || "GET", url);

    const response = await fetch(url, {
      ...options,
      headers: {
        ...(accessToken
          ? {
            Authorization: `Bearer ${accessToken}`,
          }
          : {}),
        ...(options.headers || {}),
      },
    });

    console.log("API Response:", response.status, response.statusText, url);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Error:", {
        url,
        status: response.status,
        statusText: response.statusText,
        response: errorText,
      });

      throw new Error(
        `${response.status} ${response.statusText}: ${errorText}`
      );
    }

    return response.json();
  }

  // ============================================================
  // LOAD CATEGORIES
  // ============================================================

  async function loadCategories() {
    try {
      const response = await apiRequest<CategoryResponse[]>("/api/Categories", {
        method: "GET",
      });
      setCategories(response);
    } catch (error) {
      console.error("Unable to load categories:", error);
      setStatus(
        error instanceof Error ? error.message : "Unable to load categories."
      );
    }
  }

  // ============================================================
  // LOAD REGIONS
  // ============================================================

  async function loadRegions() {
    try {
      const response = await apiRequest<RegionResponse[]>("/api/Regions", {
        method: "GET",
      });
      setRegions(response);
    } catch (error) {
      console.error("Unable to load regions:", error);
      setStatus(
        error instanceof Error ? error.message : "Unable to load regions."
      );
    }
  }

  // ============================================================
  // LOAD TEXTURES
  // ============================================================

  async function loadTextures() {
    try {
      const response = await apiRequest<TextureResponse[]>("/api/Textures", {
        method: "GET",
      });
      setTextures(response.filter((texture) => texture.isActive !== false));
    } catch (error) {
      console.error("Unable to load textures:", error);
      setStatus(
        error instanceof Error ? error.message : "Unable to load textures."
      );
    }
  }

  // ============================================================
  // LOAD DROPDOWN DATA WHEN JWT IS AVAILABLE
  // ============================================================

  useEffect(() => {
    if (!accessToken.trim()) {
      setCategories([]);
      setRegions([]);
      setTextures([]);
      setSelectedCategoryId("");
      return;
    }

    loadCategories();
    loadRegions();
    loadTextures();
  }, [accessToken]);

  // ============================================================
  // CREATE CATEGORY
  // ============================================================

  async function handleCreateCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!accessToken.trim()) {
      setStatus("Please enter your JWT access token.");
      return;
    }

    if (!categoryName.trim()) {
      setStatus("Please enter a category name.");
      return;
    }

    setIsCreatingCategory(true);
    setStatus("");

    try {
      const response = await apiRequest<CategoryResponse>("/api/Categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          categoryName: categoryName.trim(),
          description: categoryDescription.trim(),
        }),
      });

      setCreatedCategory(response);
      await loadCategories();
      setStatus("Category created successfully.");
      setCategoryName("");
      setCategoryDescription("");
    } catch (error) {
      console.error("Create category error:", error);
      setStatus(
        error instanceof Error ? error.message : "Unable to create category."
      );
    } finally {
      setIsCreatingCategory(false);
    }
  }

  // ============================================================
  // CREATE TEXTURE & UPLOAD IMAGE
  // ============================================================

  function handleTextureFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] || null;

    if (file && !file.type.startsWith("image/")) {
      setStatus("Please select a valid image file for the texture.");
      setTextureFile(null);
      return;
    }

    setTextureFile(file);
  }

  async function handleCreateTexture(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!accessToken.trim()) {
      setStatus("Please enter your JWT access token.");
      return;
    }

    if (!newTextureName.trim()) {
      setStatus("Please enter a texture name.");
      return;
    }

    if (!textureFile) {
      setStatus("Please select a texture image to upload.");
      return;
    }

    setIsCreatingTexture(true);
    setStatus("Creating texture in database...");
    setCreatedTexture(null);

    try {
      // 1. Call POST /api/Textures
      const payload = {
        textureName: newTextureName.trim(),
        textureMetadata: newTextureMetadata.trim(),
      };

      const response = await apiRequest<CreateTextureResponse>("/api/Textures", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      setCreatedTexture(response);

      // 2. Upload the texture image to storage using UploadUrl
      const uploadUrl = response.uploadUrl || response.UploadUrl;

      if (uploadUrl) {
        setStatus("Uploading texture image to storage service...");
        const proxiedUploadUrl = getProxiedUploadUrl(uploadUrl);

        console.log("Original Texture SAS URL:", uploadUrl);
        console.log("Proxied Texture upload URL:", proxiedUploadUrl);

        const uploadResponse = await fetch(proxiedUploadUrl, {
          method: "PUT",
          headers: {
            "x-ms-blob-type": "BlockBlob",
            "Content-Type": textureFile.type || "image/png",
          },
          body: textureFile,
        });

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          throw new Error(
            `Texture image upload failed: ${uploadResponse.status} ${errorText}`
          );
        }
      }

      await loadTextures();
      setStatus("Texture created and image uploaded successfully.");
      setNewTextureName("");
      setNewTextureMetadata("");
      setTextureFile(null);
    } catch (error) {
      console.error("Create texture error:", error);
      setStatus(
        error instanceof Error
          ? error.message
          : "Unable to create texture or upload image."
      );
    } finally {
      setIsCreatingTexture(false);
    }
  }

  // ============================================================
  // VARIANT HELPERS
  // ============================================================

  function updateVariant(variantId: string, updates: Partial<ModelVariantForm>) {
    setVariants((previous) =>
      previous.map((variant) =>
        variant.id === variantId ? { ...variant, ...updates } : variant
      )
    );
  }

  function updateVariantRegion(
    variantId: string,
    regionId: string,
    updates: Partial<VariantRegion>
  ) {
    setVariants((previous) =>
      previous.map((variant) => {
        if (variant.id !== variantId) {
          return variant;
        }

        return {
          ...variant,
          regions: variant.regions.map((region) =>
            region.regionId === regionId ? { ...region, ...updates } : region
          ),
        };
      })
    );
  }

  function toggleVariantRegion(
    variantId: string,
    regionId: string,
    checked: boolean
  ) {
    setVariants((previous) =>
      previous.map((variant) => {
        if (variant.id !== variantId) {
          return variant;
        }

        if (checked) {
          if (variant.regions.some((region) => region.regionId === regionId)) {
            return variant;
          }

          return {
            ...variant,
            regions: [
              ...variant.regions,
              {
                regionId,
                itemNumber: "",
              },
            ],
          };
        }

        return {
          ...variant,
          regions: variant.regions.filter(
            (region) => region.regionId !== regionId
          ),
        };
      })
    );
  }

  function addVariant() {
    if (variants.length >= textures.length) {
      setStatus("You cannot add more variants than the available textures.");
      return;
    }

    setVariants((previous) => [...previous, createEmptyVariant()]);
    setStatus("");
  }

  function removeVariant(variantId: string) {
    if (variants.length === 1) {
      setStatus("At least one variant is required.");
      return;
    }

    setVariants((previous) =>
      previous.filter((variant) => variant.id !== variantId)
    );
  }

  // ============================================================
  // TEXTURE SELECTION
  // ============================================================

  const selectedTextureIds = useMemo(
    () =>
      new Set(
        variants
          .map((variant) => variant.textureId)
          .filter(Boolean)
      ),
    [variants]
  );

  function getAvailableTextures(currentVariantId: string) {
    const currentVariant = variants.find(
      (variant) => variant.id === currentVariantId
    );

    return textures.filter((texture) => {
      const textureId = getEntityId(texture);
      return (
        textureId === currentVariant?.textureId ||
        !selectedTextureIds.has(textureId)
      );
    });
  }

  // ============================================================
  // FILE CHANGE HANDLERS
  // ============================================================

  function handleAssetFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] || null;

    if (file && !file.name.toLowerCase().endsWith(".glb")) {
      setStatus("Please select a valid .glb file.");
      setAssetFile(null);
      return;
    }

    setAssetFile(file);
  }

  function handleThumbnailChange(
    variantId: string,
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0] || null;

    if (file && !file.type.startsWith("image/")) {
      setStatus("Please select a valid thumbnail image.");
      return;
    }

    updateVariant(variantId, {
      thumbnailFile: file,
    });
  }

  // ============================================================
  // VALIDATE FORM
  // ============================================================

  function validateModelForm(): string | null {
    if (!accessToken.trim()) {
      return "Please enter your JWT access token.";
    }

    if (!selectedCategoryId) {
      return "Please select a category.";
    }

    // if (!modelCode.trim()) {
    //   return "Please enter a model code.";
    // }

    if (!modelName.trim()) {
      return "Please enter a model name.";
    }

    if (!description.trim()) {
      return "Please enter a model description.";
    }

    if (!assetFile) {
      return "Please select a GLB 3D asset file.";
    }

    if (variants.length === 0) {
      return "At least one variant is required.";
    }

    if (variants.length > textures.length) {
      return "The number of variants cannot exceed the number of available textures.";
    }

    const textureIds = new Set<string>();

    for (let i = 0; i < variants.length; i++) {
      const variant = variants[i];

      if (!variant.textureId) {
        return `Please select a texture for Variant ${i + 1}.`;
      }

      if (textureIds.has(variant.textureId)) {
        return `Texture cannot be repeated in Variant ${i + 1}.`;
      }

      textureIds.add(variant.textureId);

      if (!variant.skuNumber.trim()) {
        return `Please enter a SKU number for Variant ${i + 1}.`;
      }

      if (variant.regions.length === 0) {
        return `Please select at least one region for Variant ${i + 1}.`;
      }

      for (const region of variant.regions) {
        if (!region.itemNumber.trim()) {
          const regionName =
            regions.find(
              (item) => getEntityId(item) === region.regionId
            )?.name || region.regionId;

          return `Please enter an item number for ${regionName} in Variant ${i + 1}.`;
        }
      }
    }

    return null;
  }

  // ============================================================
  // CREATE MODEL AND UPLOAD ASSET
  // ============================================================

  async function handleCreateModelAndUpload(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const validationError = validateModelForm();
    if (validationError) {
      setStatus(validationError);
      return;
    }

    if (!assetFile) {
      return;
    }

    setIsCreatingModel(true);
    setStatus("");
    setCreatedModel(null);
    setUploadInfo(null);
    setThumbnailUploads([]);

    try {
      // --------------------------------------------------------
      // 1. CREATE MODEL WITH VARIANTS
      // --------------------------------------------------------
      setStatus("Creating model and variants in database...");

      const requestPayload = {
        // modelId: modelCode.trim(),
        categoryId: selectedCategoryId,
        modelName: modelName.trim(),
        modelPath: "pending",
        description: description.trim(),
        variants: variants.map((variant) => ({
          textureId: variant.textureId,
          skuNumber: variant.skuNumber.trim(),
          thumbnailPath: variant.thumbnailFile?.name || "thumbnail.webp",
          regions: variant.regions.map((region) => ({
            regionId: region.regionId,
            itemNumber: region.itemNumber.trim(),
            price: 0,
          })),
        })),
      };

      console.log("Create Model Payload:", requestPayload);

      const modelResponse = await apiRequest<ModelResponse>("/api/Models", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestPayload),
      });

      setCreatedModel(modelResponse);

      // --------------------------------------------------------
      // 2. UPLOAD VARIANT THUMBNAILS (thumbnails/categoryId/modelId/textureId/thumbnail.ext)
      // --------------------------------------------------------
      const uploadedThumbnailInfoList: VariantThumbnailUploadUrlResponse[] = [];

      for (let i = 0; i < variants.length; i++) {
        const variant = variants[i];

        if (variant.thumbnailFile) {
          setStatus(
            `Requesting thumbnail upload SAS URL for Variant ${i + 1}...`
          );

          const fileExt =
            variant.thumbnailFile.name.split(".").pop() || "webp";

          const thumbnailSasResponse =
            await apiRequest<VariantThumbnailUploadUrlResponse>(
              `/api/storage/${modelResponse.id}/textures/${variant.textureId}/upload-url?extension=${fileExt}`,
              {
                method: "GET",
              }
            );

          uploadedThumbnailInfoList.push(thumbnailSasResponse);

          setStatus(
            `Uploading thumbnail for Variant ${i + 1} (${thumbnailSasResponse.blobPath})...`
          );

          const proxiedThumbnailUrl = getProxiedUploadUrl(
            thumbnailSasResponse.uploadUrl
          );

          const thumbnailUploadRes = await fetch(proxiedThumbnailUrl, {
            method: "PUT",
            headers: {
              "x-ms-blob-type": "BlockBlob",
              "Content-Type": variant.thumbnailFile.type || "image/webp",
            },
            body: variant.thumbnailFile,
          });

          if (!thumbnailUploadRes.ok) {
            const errorText = await thumbnailUploadRes.text();
            throw new Error(
              `Thumbnail upload for Variant ${i + 1} failed: ${thumbnailUploadRes.status} ${errorText}`
            );
          }
        }
      }

      setThumbnailUploads(uploadedThumbnailInfoList);

      // --------------------------------------------------------
      // 3. REQUEST MODEL GLB UPLOAD SAS URL (models/categoryId/modelId/modelName/model.glb)
      // --------------------------------------------------------
      setStatus("Requesting GLB upload SAS URL...");

      const uploadUrlResponse = await apiRequest<UploadUrlResponse>(
        `/api/storage/${modelResponse.id}/upload-url`,
        {
          method: "GET",
        }
      );

      setUploadInfo(uploadUrlResponse);

      // --------------------------------------------------------
      // 4. UPLOAD GLB ASSET TO AZURITE BLOB STORAGE
      // --------------------------------------------------------
      setStatus("Uploading GLB 3D asset...");

      const proxiedUploadUrl = getProxiedUploadUrl(
        uploadUrlResponse.uploadUrl
      );

      console.log("Original SAS URL:", uploadUrlResponse.uploadUrl);
      console.log("Proxied upload URL:", proxiedUploadUrl);

      const uploadResponse = await fetch(proxiedUploadUrl, {
        method: "PUT",
        headers: {
          "x-ms-blob-type": "BlockBlob",
          "Content-Type": assetFile.type || "model/gltf-binary",
        },
        body: assetFile,
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(
          `Asset upload failed: ${uploadResponse.status} ${errorText}`
        );
      }

      setStatus(
        `Model created successfully! Uploaded ${uploadedThumbnailInfoList.length} variant thumbnail(s) and the GLB 3D model asset.`
      );
    } catch (error) {
      console.error("Create model/upload error:", error);
      setStatus(
        error instanceof Error
          ? error.message
          : "Unable to create model or upload asset."
      );
    } finally {
      setIsCreatingModel(false);
    }
  }

  // ============================================================
  // UI
  // ============================================================

  return (
    <main className="page">
      <div className="container">
        <h1>AHE Model & Asset Management</h1>
        <p className="app-subtitle">Upload 3D assets, manage variants, texture configurations, and regional item mappings.</p>

        {/* ====================================================
            JWT ACCESS TOKEN
        ==================================================== */}

        <section className="section">
          <h2><span className="section-icon">&#x1F511;</span> JWT Authentication</h2>
          <label>
            Access Token
            <textarea
              value={accessToken}
              onChange={(event) => setAccessToken(event.target.value)}
              placeholder="Paste JWT access token"
              rows={4}
            />
          </label>
        </section>

        {/* ====================================================
            CREATE CATEGORY
        ==================================================== */}

        <section className="section">
          <h2><span className="section-icon">1</span> Create New Category</h2>
          <form className="form" onSubmit={handleCreateCategory}>
            <label>
              Category Name
              <input
                value={categoryName}
                onChange={(event) => setCategoryName(event.target.value)}
                placeholder="Furniture"
                required
              />
            </label>

            <label>
              Category Description
              <input
                value={categoryDescription}
                onChange={(event) => setCategoryDescription(event.target.value)}
                placeholder="Base and tall units"
              />
            </label>

            <button
              type="submit"
              disabled={isCreatingCategory || !categoryName.trim()}
            >
              {isCreatingCategory ? "Creating Category..." : "Create Category"}
            </button>
          </form>

          {createdCategory && (
            <div className="result">
              <h3>Created Category</h3>
              <pre>{JSON.stringify(createdCategory, null, 2)}</pre>
            </div>
          )}
        </section>

        {/* ====================================================
            CREATE TEXTURE
        ==================================================== */}

        <section className="section">
          <h2><span className="section-icon">2</span> Create New Texture</h2>
          <form className="form" onSubmit={handleCreateTexture}>
            <label>
              Texture Name
              <input
                value={newTextureName}
                onChange={(event) => setNewTextureName(event.target.value)}
                placeholder="Oak Wood Finish"
                required
                disabled={isCreatingTexture}
              />
            </label>

            <label>
              Texture Metadata
              <input
                value={newTextureMetadata}
                onChange={(event) => setNewTextureMetadata(event.target.value)}
                placeholder="Wood grain texture with matte varnish"
                disabled={isCreatingTexture}
              />
            </label>

            <label>
              Texture Image
              <input
                key={textureFile ? "texture-file-selected" : "texture-file-empty"}
                type="file"
                accept="image/*"
                onChange={handleTextureFileChange}
                required
                disabled={isCreatingTexture}
              />
            </label>

            {textureFile && (
              <p className="file-info">Selected Texture Image: {textureFile.name}</p>
            )}

            <button
              type="submit"
              disabled={isCreatingTexture || !newTextureName.trim() || !textureFile}
            >
              {isCreatingTexture ? "Creating & Uploading Texture..." : "Create Texture"}
            </button>
          </form>

          {createdTexture && (
            <div className="result">
              <h3>Created Texture & Upload Details</h3>
              <pre>{JSON.stringify(createdTexture, null, 2)}</pre>
            </div>
          )}
        </section>

        {/* ====================================================
            CREATE MODEL & UPLOAD ASSETS
        ==================================================== */}

        <section className="section">
          <h2><span className="section-icon">3</span> Create Model & Upload Assets</h2>

          <form className="form" onSubmit={handleCreateModelAndUpload}>
            {/* CATEGORY DROPDOWN */}
            <label>
              Select Category
              <select
                value={selectedCategoryId}
                onChange={(event) => {
                  setSelectedCategoryId(event.target.value);
                  setVariants([createEmptyVariant()]);
                }}
                required
                disabled={isCreatingModel}
              >
                <option value="">Select a category</option>
                {categories.map((category) => {
                  const categoryId = getEntityId(category);
                  return (
                    <option key={categoryId} value={categoryId}>
                      {category.categoryName}
                    </option>
                  );
                })}
              </select>
            </label>

            {/* MODEL CODE */}
            {/* <label>
              Model Code / ID
              <input
                value={modelCode}
                onChange={(event) => setModelCode(event.target.value)}
                placeholder="UT-300"
                required
                disabled={isCreatingModel}
              />
            </label> */}

            {/* MODEL NAME */}
            <label>
              Model Name
              <input
                value={modelName}
                onChange={(event) => setModelName(event.target.value)}
                placeholder="UT 300 base"
                required
                disabled={isCreatingModel}
              />
            </label>

            {/* DESCRIPTION */}
            <label>
              Model Description
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="300mm Floor Cupboard"
                rows={3}
                required
                disabled={isCreatingModel}
              />
            </label>

            {/* GLB FILE */}
            <label>
              3D Model Asset (.glb)
              <input
                type="file"
                accept=".glb"
                onChange={handleAssetFileChange}
                required
                disabled={isCreatingModel}
              />
            </label>

            {assetFile && (
              <p className="file-info">Selected 3D Asset: {assetFile.name}</p>
            )}

            <hr />

            {/* VARIANTS */}
            <div className="variants-section">
              <div className="variants-header">
                <h3>Model Variants</h3>
                <span className="badge">
                  {variants.length} / {textures.length} Variants
                </span>
              </div>

              {variants.map((variant, index) => (
                <div className="variant-card" key={variant.id}>
                  <div className="variant-card-header">
                    <h4>Variant {index + 1}</h4>
                    {variants.length > 1 && (
                      <button
                        type="button"
                        className="remove-variant-button"
                        onClick={() => removeVariant(variant.id)}
                        disabled={isCreatingModel}
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  {/* TEXTURE DROPDOWN */}
                  <label>
                    Texture
                    <select
                      value={variant.textureId}
                      onChange={(event) =>
                        updateVariant(variant.id, {
                          textureId: event.target.value,
                        })
                      }
                      required
                      disabled={!selectedCategoryId || isCreatingModel}
                    >
                      <option value="">Select a texture</option>
                      {getAvailableTextures(variant.id).map((texture) => {
                        const textureId = getEntityId(texture);
                        return (
                          <option key={textureId} value={textureId}>
                            {texture.textureName}
                          </option>
                        );
                      })}
                    </select>
                  </label>

                  {/* SKU */}
                  <label>
                    SKU Number
                    <input
                      value={variant.skuNumber}
                      onChange={(event) =>
                        updateVariant(variant.id, {
                          skuNumber: event.target.value,
                        })
                      }
                      placeholder="W-56017"
                      required
                      disabled={isCreatingModel}
                    />
                  </label>

                  {/* THUMBNAIL */}
                  <label>
                    Variant Thumbnail (Image)
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) =>
                        handleThumbnailChange(variant.id, event)
                      }
                      disabled={isCreatingModel}
                    />
                  </label>

                  {variant.thumbnailFile && (
                    <p className="file-info">
                      Selected thumbnail: {variant.thumbnailFile.name}
                    </p>
                  )}

                  {/* REGIONS */}
                  <div className="variant-regions">
                    <h5>Regional Configurations</h5>
                    <div className="regions-grid">
                      {regions.map((region) => {
                        const regionId = getEntityId(region);
                        const selectedRegion = variant.regions.find(
                          (item) => item.regionId === regionId
                        );
                        const isSelected = Boolean(selectedRegion);

                        return (
                          <div className="region-row" key={regionId}>
                            <label className="region-checkbox">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(event) =>
                                  toggleVariantRegion(
                                    variant.id,
                                    regionId,
                                    event.target.checked
                                  )
                                }
                                disabled={isCreatingModel}
                              />
                              <span>{region.code || region.name}</span>
                            </label>

                            {isSelected && (
                              <div className="region-input-wrapper">
                                <input
                                  value={selectedRegion?.itemNumber || ""}
                                  onChange={(event) =>
                                    updateVariantRegion(variant.id, regionId, {
                                      itemNumber: event.target.value,
                                    })
                                  }
                                  placeholder="Item # (e.g. 10001)"
                                  required
                                  disabled={isCreatingModel}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {regions.length === 0 && (
                      <p className="hint">No regions available.</p>
                    )}
                  </div>
                </div>
              ))}

              {/* ADD VARIANT BUTTON */}
              <button
                type="button"
                className="add-variant-button"
                onClick={addVariant}
                disabled={
                  isCreatingModel ||
                  textures.length === 0 ||
                  variants.length >= textures.length
                }
              >
                + Add Variant
              </button>

              {variants.length >= textures.length && textures.length > 0 && (
                <p className="hint">
                  All available textures have been assigned. No more variants
                  can be added.
                </p>
              )}
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              className="submit-button"
              disabled={
                !selectedCategoryId ||
                isCreatingModel ||
                textures.length === 0
              }
            >
              {isCreatingModel
                ? "Creating Model and Uploading..."
                : "Create Model"}
            </button>
          </form>

          {/* ====================================================
              CREATED MODEL RESULT
          ==================================================== */}

          {createdModel && (
            <div className="result">
              <h3>Created Model</h3>
              <pre>{JSON.stringify(createdModel, null, 2)}</pre>
            </div>
          )}

          {/* ====================================================
              THUMBNAIL UPLOAD DETAILS
          ==================================================== */}

          {thumbnailUploads.length > 0 && (
            <div className="result">
              <h3>Thumbnail Upload Details</h3>
              <pre>
                {JSON.stringify(
                  thumbnailUploads.map((t) => ({
                    textureId: t.textureId,
                    blobPath: t.blobPath,
                    expiresAt: t.expiresAt,
                  })),
                  null,
                  2
                )}
              </pre>
            </div>
          )}

          {/* ====================================================
              GLB UPLOAD DETAILS RESULT
          ==================================================== */}

          {uploadInfo && (
            <div className="result">
              <h3>GLB 3D Asset Upload Details</h3>
              <pre>
                {JSON.stringify(
                  {
                    blobPath: uploadInfo.blobPath,
                    expiresAt: uploadInfo.expiresAt,
                  },
                  null,
                  2
                )}
              </pre>
            </div>
          )}
        </section>

        {/* ====================================================
            STATUS DISPLAY
        ==================================================== */}

        {status && (
          <div className="status">
            <strong>Status</strong>
            <p>{status}</p>
          </div>
        )}
      </div>
    </main>
  );
}

export default App;


