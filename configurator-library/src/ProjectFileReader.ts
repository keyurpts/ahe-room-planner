import { z } from 'zod';
import { ErrorMessages } from './Constants';

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

export class ProjectFileReader {

    constructor() { }

    public async parseJSONFile(file: File): Promise<any> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = () => {
                const result = reader.result;
                if (typeof result === "string") {
                    try {
                        const jsonObject = JSON.parse(result);

                        // validate before returning
                        if (this.validateConfigData(jsonObject)) {
                            resolve(jsonObject);
                        } else {
                            reject(new Error(ErrorMessages.INVALID_CONFIG_STRUCTURE));
                        }
                    } catch (error) {
                        reject(new Error(ErrorMessages.INVALID_JSON_FORMAT));
                    }
                } else {
                    reject(new Error(ErrorMessages.FAILED_READ_FILE_TEXT));
                }
            };

            reader.onerror = () => reject(new Error(ErrorMessages.FILE_READING_ERROR));
            reader.readAsText(file);
        });
    }

    public expandConfigOptions(
        data: ConfigData
    ): Record<string, ExpandedConfigOption> {
        const mapById = <T extends { id: string }>(arr: T[]): Record<string, T> => {
            return arr.reduce((acc, item) => {
                acc[item.id] = item;
                return acc;
            }, {} as Record<string, T>);
        };

        const partsMap = mapById(data.configParts);
        const materialsMap = mapById(data.configMaterials);
        const texturesMap = mapById(data.textures);

        const result: Record<string, ExpandedConfigOption> = {};

        for (const option of data.configOptions) {
            const targetId = option.basePart;
            result[targetId] = {
                targetPartId: targetId,
                name: option.name,
                partVariants: option.partVariants.map(id => partsMap[id]).filter(Boolean),
                materialOptions: option.materialOptions.map(id => materialsMap[id]).filter(Boolean),
                textureOptions: option.textureOptions.map(id => texturesMap[id]).filter(Boolean),
            };
        }

        return result;
    }

    private ConfigPartSchema = z.object({
        id: z.string(),
        name: z.string(),
        uri: z.string(),
        previewImage: z.string(),
        format: z.string(),
    });

    private ConfigMaterialSchema = z.object({
        id: z.string(),
        name: z.string(),
        color: z.string(),
        metalness: z.number(),
        roughness: z.number(),
        side: z.string(),
        texture: z.string(),
    });

    private TextureSchema = z.object({
        id: z.string(),
        name: z.string(),
        previewImage: z.string(), 
        wrapS: z.string(),
        wrapT: z.string(),
        repeat: z.tuple([z.number(), z.number()]),
    });

    private ConfigOptionSchema = z.object({
        basePart: z.string(), 
        name: z.string(),
        partVariants: z.array(z.string()),
        materialOptions: z.array(z.string()),
        textureOptions: z.array(z.string()),
    });

    private ToolTipSchema = z.object({
        basePart: z.string(),
        message: z.string(),
    });

    private MetaSchema = z.object({
        createdBy: z.string(),
        createdAt: z.string(), 
        tags: z.array(z.string()),
    });

    private ConfigDataSchema = z.object({
        projectId: z.string(),
        name: z.string(),
        version: z.string(),
        baseModel: z.object({
            url: z.string(),
            format: z.string(),
            rotation: z.tuple([z.number(), z.number(), z.number()]),
            position: z.tuple([z.number(), z.number(), z.number()]),
        }),
        configParts: z.array(this.ConfigPartSchema),
        configMaterials: z.array(this.ConfigMaterialSchema),
        textures: z.array(this.TextureSchema),
        configOptions: z.array(this.ConfigOptionSchema),
        meta: this.MetaSchema,
        toolTips: z.array(this.ToolTipSchema),
        constraints: z.record(z.unknown()).optional(),
        savedState: z.record(z.unknown()).optional(),
    });

    private validateConfigData(data: unknown): boolean {
        try {
            this.ConfigDataSchema.parse(data);
            return true;
        } catch (error) {
            throw new Error(ErrorMessages.INVALID_CONFIG_STRUCTURE);
        }
    }
}
