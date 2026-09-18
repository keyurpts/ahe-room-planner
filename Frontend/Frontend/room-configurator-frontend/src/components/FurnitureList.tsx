import { Tabs, Tab, Spinner } from "@heroui/react";
import { Icon } from "@iconify/react";
import Icons from "../icons";
import { FC, useEffect, useState } from "react";
import { CATEGORIES_API } from "./Constants";
import { getAccessToken } from "../utils/auth";

export interface CategoryItem {
  id: string;
  category?: string;
  name?: string;
  title?: string;
  icon?: string;
  items?: any[];
  [key: string]: any;
}

interface FurnitureListProps {
  setSelectedItem: (key: any) => void;
  roomConfig?: any;
}

const FurnitureList: FC<FurnitureListProps> = ({
  setSelectedItem,
  roomConfig,
}) => {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    const fetchCategories = async () => {
      setIsLoading(true);
      try {
        const token = getAccessToken();
        const headers: Record<string, string> = {
          Accept: "*/*",
        };
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const res = await fetch(CATEGORIES_API, {
          method: "GET",
          headers,
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch categories (${res.status})`);
        }

        const data = await res.json();
        let items: CategoryItem[] = [];

        if (Array.isArray(data)) {
          items = data;
        } else if (data && Array.isArray(data.items)) {
          items = data.items;
        } else if (data && Array.isArray(data.data)) {
          items = data.data;
        }

        if (isMounted) {
          if (items.length > 0) {
            setCategories(items);
            // Default select the first category if available
            const firstId = items[0].id || items[0].category || items[0].name;
            if (firstId) setSelectedItem(firstId);
          } else if (roomConfig?.configModels) {
            setCategories(roomConfig.configModels);
          }
        }
      } catch (err) {
        console.warn("Could not fetch categories from API, falling back to roomConfig:", err);
        if (isMounted && roomConfig?.configModels) {
          setCategories(roomConfig.configModels);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchCategories();

    return () => {
      isMounted = false;
    };
  }, [roomConfig]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-2 mb-4 text-xs text-default-400">
        <Spinner size="sm" color="warning" />
        <span>Loading categories...</span>
      </div>
    );
  }

  if (!categories || categories.length === 0) return null;

  return (
    <>
      <div className="overflow-x-auto whitespace-nowrap overflow-y-hidden" style={{ minHeight: "fit-content" }}>
        <Tabs
          aria-label="Furniture categories"
          className="inline-flex space-x-4 mb-4"
          classNames={{
            tabWrapper: "overflow-y-hidden overflow-x-scroll",
          }}
          onSelectionChange={setSelectedItem}
        >
          {categories.map((cat: CategoryItem, idx: number) => {
            const catId = cat.id || cat.category || cat.name || `category-${idx}`;
            console.log(cat);
            const catTitle = cat.categoryName || cat.id || "Category";

            return (
              <Tab
                key={catId}
                title={
                  <div className="flex items-center space-x-2">
                    <Icon icon={Icons.twotoneTableBar} />
                    <span>{catTitle}</span>
                  </div>
                }
              />
            );
          })}
        </Tabs>
      </div>
    </>
  );
};

export default FurnitureList;

