export enum ToolbarAction {
  Translate = "translate",
  Rotate = "rotate",
  Copy = "copy",
  Delete = "delete",
  ToggleWalls = "toggleWalls",
  SingleMeasurement = "singleMeasurement",
  AllMeasurement = "allMeasurement",
  Replace = "replace",
}

export const KEYBOARD_SHORTCUTS = new Map<string, ToolbarAction>([
  ["Ctrl+KeyC", ToolbarAction.Copy],
  ["Delete", ToolbarAction.Delete],
  //below shortcutes are based on initial asumptions it may get vary after the usage and expereince.
  ["KeyT", ToolbarAction.Translate],
  ["KeyR", ToolbarAction.Rotate],
  ["KeyH", ToolbarAction.ToggleWalls],
  ["KeyM", ToolbarAction.SingleMeasurement],
  ["Shift+KeyM", ToolbarAction.AllMeasurement],
  ["KeyS", ToolbarAction.Replace],
]);

export type TexturePreset = {
  id: string;
  name: string;
  thumbnail: string;
  url: string;
  repeatX?: number;
  repeatY?: number;
};

export type ColorPreset = {
  id: string;
  name: string;
  color: string;
};

export const floorPresets: TexturePreset[] = [
 
  { id: "stone-tile",  name: "Stone Tile", thumbnail: "/WallAndFloorTextureImages/FloorTexture/Thumbnail/sample_floor_texture.jpg",  url: "/WallAndFloorTextureImages/FloorTexture/Images/sample_floor_texture.jpg",  repeatX: 1, repeatY: 1 },
  { id: "BlackStonesTiled", name: "Black Stones Tiled", thumbnail: "/WallAndFloorTextureImages/FloorTexture/Thumbnail/BlackStonesTiled.jpg",  url: "/WallAndFloorTextureImages/FloorTexture/Images/BlackStonesTiled.jpg",  repeatX: 0.5, repeatY: 0.5 },
  { id: "LightWoodenFloor", name: "Light Wooden Floor", thumbnail: "/WallAndFloorTextureImages/FloorTexture/Thumbnail/LightWoodenFloor.jpg",  url: "/WallAndFloorTextureImages/FloorTexture/Images/LightWoodenFloor.jpg",  repeatX: 1, repeatY: 1 },
  { id: "ParquetFloor", name: "Parquet Floor", thumbnail: "/WallAndFloorTextureImages/FloorTexture/Thumbnail/ParquetFloor.jpg",  url: "/WallAndFloorTextureImages/FloorTexture/Images/ParquetFloor.jpg",  repeatX: 0.5, repeatY: 0.5 },
  { id: "GreyWooden", name: "Grey Wooden", thumbnail: "/WallAndFloorTextureImages/FloorTexture/Thumbnail/GreyWooden.jpg",  url: "/WallAndFloorTextureImages/FloorTexture/Images/GreyWooden.jpg",  repeatX: 0.5, repeatY: 0.5 },
  { id: "MediumLinesBrick", name:"Medium Lines Brick", thumbnail:"/WallAndFloorTextureImages/FloorTexture/Thumbnail/MediumLinesBrick.jpg", url:"/WallAndFloorTextureImages/FloorTexture/Images/MediumLinesBrick.jpg", repeatX: 0.5, repeatY: 0.5 },
  { id: "BlueBrickWall", name:"Blue Brick Wall", thumbnail:"/WallAndFloorTextureImages/FloorTexture/Thumbnail/BlueBrickWall.jpg", url:"/WallAndFloorTextureImages/FloorTexture/Images/BlueBrickWall.jpg", repeatX: 0.5, repeatY: 0.5 },
  

];

export const wallPresets: TexturePreset[] = [
  { id: "plain",       name: "Plain",      thumbnail: "/WallAndFloorTextureImages/WallTexture/Thumbnail/background-concrete-wall.jpg",        url: "/WallAndFloorTextureImages/WallTexture/Images/background-concrete-wall.jpg",        repeatX: 2, repeatY: 2 },
  { id: "soft-stone",  name: "Soft Stone", thumbnail: "/WallAndFloorTextureImages/WallTexture/Thumbnail/image.jpg",                           url: "/WallAndFloorTextureImages/WallTexture/Images/image.jpg",  repeatX: 1, repeatY: 1 },
  { id: "Concrete",    name: "Concrete",   thumbnail: "/WallAndFloorTextureImages/WallTexture/Thumbnail/Concrete.jpg",                      url: "/WallAndFloorTextureImages/WallTexture/Images/Concrete.jpg",  repeatX: 2, repeatY: 2 },
  { id: "Stucco",      name: "Stucco",     thumbnail: "/WallAndFloorTextureImages/WallTexture/Thumbnail/Stucco.jpg",                    url: "/WallAndFloorTextureImages/WallTexture/Images/Stucco.jpg",  repeatX: 0.5, repeatY: 0.5 },
  { id: "Cement",      name: "Cement",     thumbnail: "/WallAndFloorTextureImages/WallTexture/Thumbnail/Cement.jpg",                    url: "/WallAndFloorTextureImages/WallTexture/Images/Cement.jpg",  repeatX: 2, repeatY: 2 },
  { id: "LoftCement",  name: "LoftCement", thumbnail: "/WallAndFloorTextureImages/WallTexture/Thumbnail/LoftCement.jpg",                    url: "/WallAndFloorTextureImages/WallTexture/Images/LoftCement.jpg",  repeatX: 1, repeatY: 1 },
  { id: "GreyWall",    name: "GreyWall",   thumbnail: "/WallAndFloorTextureImages/WallTexture/Thumbnail/GreyWall.jpg",                    url: "/WallAndFloorTextureImages/WallTexture/Images/GreyWall.jpg",  repeatX: 1, repeatY: 1 },
  { id: "Dust",        name: "Dust",       thumbnail: "/WallAndFloorTextureImages/WallTexture/Thumbnail/Dust.jpg",                          url: "/WallAndFloorTextureImages/WallTexture/Images/Dust.jpg",  repeatX: 1, repeatY:  1},
  { id: "TiledStones", name: "TiledStones", thumbnail: "/WallAndFloorTextureImages/WallTexture/Thumbnail/TiledStones.jpg",                   url: "/WallAndFloorTextureImages/WallTexture/Images/TiledStones.jpg",  repeatX: 1, repeatY:1 },
  { id: "GrungeClean", name: "GrungeClean", thumbnail: "/WallAndFloorTextureImages/WallTexture/Thumbnail/GrungeClean.jpg",                   url: "/WallAndFloorTextureImages/WallTexture/Images/GrungeClean.jpg",  repeatX: 2, repeatY: 2 },
  { id: "BlueConcrete", name: "BlueConcrete", thumbnail: "/WallAndFloorTextureImages/WallTexture/Thumbnail/BlueConcrete.jpg",                    url: "/WallAndFloorTextureImages/WallTexture/Images/BlueConcrete.jpg",  repeatX: 0.5, repeatY: 0.5 },
];

export const colorPresets: ColorPreset[] = [
  { id: "white",       name: "White",        color: "#FFFFFF" },
  { id: "cream",       name: "Cream",        color: "#FFF5E1" },
  { id: "beige",       name: "Warm Beige",   color: "#F5F5DC" },
  { id: "light-gray",  name: "Light Gray",   color: "#E5E7EB" },
  { id: "cool-gray",   name: "Cool Gray",    color: "#9CA3AF" },
  { id: "charcoal",    name: "Charcoal",     color: "#374151" },
  { id: "tan",         name: "Warm Tan",     color: "#D4A574" },
  { id: "terracotta",  name: "Terracotta",   color: "#C97864" },
  { id: "sage",        name: "Sage",         color: "#9CAF88" },
  { id: "olive",       name: "Olive",        color: "#708238" },
  { id: "navy",        name: "Navy",         color: "#1F3A5F" },
  { id: "powder-blue", name: "Powder Blue",  color: "#B0E0E6" },
  { id: "blush",       name: "Blush",        color: "#FADADD" },
  { id: "lavender",    name: "Lavender",     color: "#E6E6FA" },
  { id: "mint",        name: "Mint",         color: "#98FF98" },
  { id: "mustard",     name: "Mustard",      color: "#E1AD01" },

];
