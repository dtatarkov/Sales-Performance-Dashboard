import type { CustomerSegment } from "../types/customerSegment";
import type { PeriodPresetType } from "../types/periodPresetType";

/** Дефолтный пресет периода при невалидном/пустом URL (frontend.md, раздел 4). */
export const DEFAULT_PERIOD_PRESET: PeriodPresetType = "30d";

/** Дефолт сегмента при отсутствии `segment` в URL: null — все сегменты. */
export const DEFAULT_SEGMENT = null as CustomerSegment | null;