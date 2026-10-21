import { useEffect, useId, useRef, useState } from 'react';
import { useAppSelector } from '@/app/store-hooks';
import type { CatalogueProduct } from '@/features/planner/catalogue/catalogue';
import {
  useGetCategoriesQuery,
  useGetTexturesQuery,
  useGetModelsQuery,
  useGetThumbnailQuery,
  useLazyGetModelDownloadUrlQuery,
  useLazyGetTextureDownloadUrlQuery,
  type CatalogueModel,
  type ModelVariant,
} from '@/features/planner/catalogue/catalogue-api';
import placeholder from '@/assets/images/cupboard-placeholder.svg';
import { ConfiguratorEventType, Events, type ConfiguratorCore } from 'wrapper';
import { SidebarChevron } from '@/features/planner/components/SidebarChevron';

interface Props {
  active?: boolean;
  onAdd: (product: CatalogueProduct) => void;
  onSelect: (id: string) => void;
  selected: string | null;
  canCustomise: boolean;
  onCustomise: () => void;
  hidden?: boolean;
}

type ProductHandlers = Pick<Props, 'onAdd' | 'onSelect' | 'selected'> & {
  onModelAdding: (textureId: string) => void;
  onModelAddFailed: () => void;
};

function Retry({ label, retry }: { label: string; retry: () => void }) {
  return (
    <div className="catalogue-empty" role="alert">
      <p>Unable to load {label}.</p>
      <button type="button" className="underline" onClick={retry}>
        Retry {label}
      </button>
    </div>
  );
}
function ColourOptions({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: readonly { id: string; name: string }[];
  selected: string | undefined;
  onChange: (id: string) => void;
}) {
  const name = useId();
  return (
    <fieldset className="catalogue-colour-options">
      <legend className="sr-only">{label}</legend>
      {options.map((option) => (
        <label className="catalogue-colour-option" key={option.id}>
          <input
            className="sr-only"
            type="radio"
            name={name}
            value={option.id}
            checked={selected === option.id}
            onChange={() => {
              onChange(option.id);
            }}
          />
          <span>{option.name}</span>
        </label>
      ))}
    </fieldset>
  );
}
function Product({
  model,
  variant,
  onAdd,
  onSelect,
  selected,
  onModelAdding,
  onModelAddFailed,
}: { model: CatalogueModel; variant: ModelVariant } & ProductHandlers) {
  const [getModelDownloadUrl] = useLazyGetModelDownloadUrlQuery();
  const thumbnail = useGetThumbnailQuery(
    { categoryId: model.categoryId, modelId: model.id, textureId: variant.textureId },
    { skip: !variant.thumbnailPath, refetchOnFocus: false, refetchOnReconnect: false },
  );
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const refetchThumbnail = thumbnail.refetch;

  const configuratorCore = useAppSelector((state) => state.configurator.configuratorCore);
  const downloadUrl = thumbnail.currentData?.downloadUrl;
  const image = downloadUrl && failedUrl !== downloadUrl ? downloadUrl : placeholder;
  const product: CatalogueProduct = {
    id: `${model.id}:${variant.textureId}`,
    name: model.description ?? model.modelName,
    image: placeholder,
    categoryId: model.categoryId,
    modelId: model.id,
    textureId: variant.textureId,
    skuNumber: variant.skuNumber,
    regions: variant.regions,
  };
  async function addProduct() {
    onSelect(product.id);
    onAdd(product);
    try {
      const { downloadUrl } = await getModelDownloadUrl(model.id, true).unwrap();
      console.log('Model download URL:', downloadUrl);

      const modelData = {
        category: product.categoryId,
        name: product.name,
        id: product.modelId,
      };

      const callbacks: NonNullable<Parameters<ConfiguratorCore['loadModel']>[4]> = {
        onModelLoading: (xhr) => {
          const percent = xhr.total > 0 ? Math.round((xhr.loaded / xhr.total) * 100) : 0;
          console.log('model loading:', `${String(percent)}%`);
        },

        onModelLoaded: (model) => {
          console.log('Model successfully loaded:', model);
        },

        onModelError: (error) => {
          console.error('Error while loading model:', error);
          window.alert(error);
        },
      };

      onModelAdding(product.textureId);
      if (!configuratorCore) throw new Error('The configurator is not ready.');
      await configuratorCore.loadModel(
        downloadUrl,
        true,
        undefined,
        undefined,
        callbacks,
        true,
        modelData,
      );
    } catch (error) {
      onModelAddFailed();
      console.error('Unable to get the model download URL.', error);
    }
  }
  return (
    <div className="catalogue-product">
      <button
        type="button"
        className="catalogue-product-preview"
        aria-label={`Select ${product.name}, ${variant.skuNumber}`}
        aria-pressed={selected === product.id}
        onClick={() => {
          onSelect(product.id);
        }}
      >
        <img
          src={image}
          width={48}
          height={50}
          alt=""
          loading="lazy"
          onError={() => {
            if (downloadUrl) setFailedUrl(downloadUrl);
          }}
        />
        <span>{product.name}</span>
      </button>
      <button
        type="button"
        className="catalogue-add"
        aria-label={`Add ${product.name}, ${variant.skuNumber}`}
        onClick={() => {
          void addProduct();
        }}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <circle cx="9" cy="9" r="8" fill="currentColor" />
          <path d="M9 5v8M5 9h8" stroke="white" strokeWidth="1.5" />
        </svg>
      </button>
      {variant.thumbnailPath && (thumbnail.isError || failedUrl === downloadUrl) && (
        <button
          type="button"
          className="catalogue-thumbnail-retry"
          aria-label={`Retry thumbnail for ${product.name}`}
          onClick={() => {
            setFailedUrl(null);
            void refetchThumbnail();
          }}
        >
          Retry image
        </button>
      )}
    </div>
  );
}
function CategoryProducts({
  categoryId,
  textureId,
  ...props
}: { categoryId: string; textureId: string | undefined } & ProductHandlers) {
  const query = useGetModelsQuery(categoryId);
  const regionId = useAppSelector((state) => state.ui.regionId);
  if (query.isLoading)
    return (
      <p className="catalogue-empty" role="status">
        Loading items…
      </p>
    );
  if (query.isError)
    return (
      <Retry
        label="items"
        retry={() => {
          void query.refetch();
        }}
      />
    );
  const products = (query.currentData ?? []).flatMap((model) =>
    model.variants
      .filter(
        (variant) =>
          variant.textureId === textureId &&
          variant.regions.some((region) => region.regionId === regionId),
      )
      .map((variant) => ({ model, variant })),
  );
  return products.length ? (
    products.map(({ model, variant }) => (
      <Product
        key={`${model.id}:${variant.textureId}`}
        model={model}
        variant={variant}
        {...props}
      />
    ))
  ) : (
    <p className="catalogue-empty">No items available for this colour.</p>
  );
}
export function ItemsSidebar({
  onAdd,
  onSelect,
  selected,
  canCustomise,
  onCustomise,
  hidden = false,
  active = true,
}: Props) {
  const categories = useGetCategoriesQuery(undefined, { skip: !active });
  const textures = useGetTexturesQuery(undefined, { skip: !active });
  const [openSections, setOpenSections] = useState<readonly string[]>([
    'cupboard',
    'benchtop',
    'cabinets',
  ]);
  const [category, setCategory] = useState<string | null | undefined>();
  const [texture, setTexture] = useState<string>();
  const [benchtopColour, setBenchtopColour] = useState('white');
  const configuratorCore = useAppSelector((state) => state.configurator.configuratorCore);
  const [getTextureDownloadUrl] = useLazyGetTextureDownloadUrlQuery();
  const pendingTextureId = useRef<string | null>(null);
  const id = useId();
  const activeCategory =
    category === undefined
      ? (
          categories.data?.find((item) => item.categoryName === 'Floor Cupboard') ??
          categories.data?.[0]
        )?.id
      : category;
  const activeTexture =
    textures.data?.find((item) => item.id === texture)?.id ?? textures.data?.[0]?.id;
  useEffect(() => {
    if (!active || !configuratorCore || !activeTexture) return;
    void getTextureDownloadUrl({ textureId: activeTexture }, true).unwrap()
      .then((response) => {
        if (response?.downloadUrl) {
          return configuratorCore.preloadTexture(response.downloadUrl, activeTexture);
        }
      })
      .catch((error: unknown) => {
        console.error('Unable to preload the selected cupboard texture.', error);
      });
  }, [active, activeTexture, configuratorCore, getTextureDownloadUrl]);
  useEffect(() => {
    if (!configuratorCore) return;
    const handleModelPlaced = (metadata: unknown) => {
      const textureId = pendingTextureId.current;
      if (!metadata || !textureId) return;
      pendingTextureId.current = null;
      const placedModelId = configuratorCore.getModelId();
      console.log('selected texture', textureId);

      void getTextureDownloadUrl({ textureId }, true)
        .unwrap()
        .then((response) => {
          const downloadUrl = response?.downloadUrl;
          if (!downloadUrl) {
            console.warn('The selected cupboard texture has no download URL.');
            return;
          }
          console.log('Cupboard texture download URL:', downloadUrl);
          if (configuratorCore.getModelId() === placedModelId) {
            configuratorCore.applyTextureToModel(downloadUrl, textureId);
          }
        })
        .catch((error: unknown) => {
          console.error('Unable to get the cupboard texture download URL.', error);
        });
    };
    const handlePreviewCancelled = () => {
      pendingTextureId.current = null;
    };
    Events.on(ConfiguratorEventType.MODEL_SELECTED, handleModelPlaced);
    Events.on(ConfiguratorEventType.PREVIEW_CANCELLED, handlePreviewCancelled);
    return () => {
      Events.off(ConfiguratorEventType.MODEL_SELECTED, handleModelPlaced);
      Events.off(ConfiguratorEventType.PREVIEW_CANCELLED, handlePreviewCancelled);
    };
  }, [configuratorCore, getTextureDownloadUrl]);
  function toggle(section: string) {
    setOpenSections((current) =>
      current.includes(section)
        ? current.filter((value) => value !== section)
        : [...current, section],
    );
  }
  return (
    <aside className="items-sidebar" aria-label="Product catalogue" hidden={hidden}>
      <div className="items-sidebar-content">
        <section className="catalogue-section">
          <h2>
            <button
              type="button"
              className="catalogue-section-toggle"
              aria-expanded={openSections.includes('cupboard')}
              aria-controls={`${id}-cupboard`}
              onClick={() => {
                toggle('cupboard');
              }}
            >
              Cupboard colour
              <SidebarChevron expanded={openSections.includes('cupboard')} />
            </button>
          </h2>
          <div
            id={`${id}-cupboard`}
            hidden={!openSections.includes('cupboard')}
            className="catalogue-colour-panel"
          >
            {textures.isLoading ? (
              <p role="status">Loading colours…</p>
            ) : textures.isError ? (
              <Retry
                label="colours"
                retry={() => {
                  void textures.refetch();
                }}
              />
            ) : textures.data?.length ? (
              <ColourOptions
                label="Cupboard colour"
                options={textures.data.map((item) => ({ id: item.id, name: item.textureName }))}
                selected={activeTexture}
                onChange={setTexture}
              />
            ) : (
              <p>No colours available.</p>
            )}
          </div>
        </section>
        <section className="catalogue-section">
          <h2>
            <button
              type="button"
              className="catalogue-section-toggle"
              aria-expanded={openSections.includes('benchtop')}
              aria-controls={`${id}-benchtop`}
              onClick={() => {
                toggle('benchtop');
              }}
            >
              Benchtop colour
              <SidebarChevron expanded={openSections.includes('benchtop')} />
            </button>
          </h2>
          <div
            id={`${id}-benchtop`}
            className="catalogue-colour-panel"
            hidden={!openSections.includes('benchtop')}
          >
            <ColourOptions
              label="Benchtop colour"
              options={[
                { id: 'white', name: 'White' },
                { id: 'grey', name: 'Grey' },
              ]}
              selected={benchtopColour}
              onChange={setBenchtopColour}
            />
          </div>
        </section>
        <section className="catalogue-section">
          <h2>
            <button
              type="button"
              className="catalogue-section-toggle"
              aria-expanded={openSections.includes('cabinets')}
              aria-controls={`${id}-cabinets`}
              onClick={() => {
                toggle('cabinets');
              }}
            >
              Cabinets
              <SidebarChevron expanded={openSections.includes('cabinets')} />
            </button>
          </h2>
          <div
            id={`${id}-cabinets`}
            hidden={!openSections.includes('cabinets')}
            className="cabinet-categories"
          >
            {categories.isLoading ? (
              <p className="catalogue-empty" role="status">
                Loading categories…
              </p>
            ) : categories.isError ? (
              <Retry
                label="categories"
                retry={() => {
                  void categories.refetch();
                }}
              />
            ) : !categories.data?.length ? (
              <p className="catalogue-empty">No categories available.</p>
            ) : (
              categories.data.map((group) => (
                <section key={group.id}>
                  <h3>
                    <button
                      type="button"
                      className="catalogue-category-toggle"
                      aria-expanded={activeCategory === group.id}
                      aria-controls={`${id}-${group.id}`}
                      onClick={() => {
                        setCategory(activeCategory === group.id ? null : group.id);
                      }}
                    >
                      {group.categoryName}
                      <SidebarChevron
                        expanded={activeCategory === group.id}
                        closedDirection="right"
                      />
                    </button>
                  </h3>
                  <div id={`${id}-${group.id}`} hidden={activeCategory !== group.id}>
                    {active && activeCategory === group.id && activeTexture && (
                      <CategoryProducts
                        categoryId={group.id}
                        textureId={activeTexture}
                        onAdd={onAdd}
                        onSelect={onSelect}
                        selected={selected}
                        onModelAdding={(textureId) => {
                          pendingTextureId.current = textureId;
                        }}
                        onModelAddFailed={() => {
                          pendingTextureId.current = null;
                        }}
                      />
                    )}
                  </div>
                </section>
              ))
            )}
          </div>
        </section>
      </div>
      {canCustomise && (
        <button
          type="button"
          id="catalogue-customise"
          className="catalogue-customise brand-outline-control"
          onClick={onCustomise}
        >
          Customise
          <svg width="28" height="20" viewBox="0 0 28 20" fill="none" aria-hidden="true">
            <path d="M2 10h24m0 0-7-7m7 7-7 7" stroke="currentColor" strokeWidth="1.8" />
          </svg>
        </button>
      )}
    </aside>
  );
}
