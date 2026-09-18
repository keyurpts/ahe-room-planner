type ConfigPart = {
    id: string;
    name: string;
    uri: string;
    previewImage: string;
    format: string;
};
type ConfigMaterial = {
    id: string;
    name: string;
    color: string;
    metalness: number;
    roughness: number;
    side: string;
    texture: string;
};
export type Texture = {
    id: string;
    name: string;
    previewImage: string;
    wrapS: string;
    wrapT: string;
    repeat: [number, number];
};
type ConfigOption = {
    basePart: string;
    name: string;
    partVariants: string[];
    materialOptions: string[];
    textureOptions: string[];
};
export type ExpandedConfigOption = {
    targetPartId: string;
    name: string;
    partVariants: ConfigPart[];
    materialOptions: ConfigMaterial[];
    textureOptions: Texture[];
};
type ConfigData = {
    configParts: ConfigPart[];
    configMaterials: ConfigMaterial[];
    textures: Texture[];
    configOptions: ConfigOption[];
};
export declare class ProjectFileReader {
    constructor();
    parseJSONFile(file: File): Promise<any>;
    expandConfigOptions(data: ConfigData): Record<string, ExpandedConfigOption>;
    private ConfigPartSchema;
    private ConfigMaterialSchema;
    private TextureSchema;
    private ConfigOptionSchema;
    private ToolTipSchema;
    private MetaSchema;
    private ConfigDataSchema;
    private validateConfigData;
}
export {};
