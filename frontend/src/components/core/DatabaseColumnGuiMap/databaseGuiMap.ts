import { DATABASE_COLUMN_GUI_MAP } from "@/components/DATABASE_COLUMN_GUI_MAP";
import { textRenderer } from "./BasicFieldRenderers";
import { FieldConfig } from "./types";

export const databaseGuiMap = (
    fieldKey: string,
): Required<FieldConfig> => {
    const defaultConfig: Required<FieldConfig> = {
        label: fieldKey,
        fieldRenderer: textRenderer,
        isHidden: false,
        isSortable: true,
    };

    const isProperKey = Object.keys(DATABASE_COLUMN_GUI_MAP).find((regKey) => regKey === fieldKey) !== undefined;

    return isProperKey ?
        { ...defaultConfig, ...DATABASE_COLUMN_GUI_MAP[fieldKey] } :
        defaultConfig;
};
