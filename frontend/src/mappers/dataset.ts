import type { DatasetDto } from "../types/dto";
import type { Dataset } from "../types/dataset";

/**
 * Маппинг именованного датасета api.md → app-типа (ui.md, «Тип Dataset»):
 * обвязка одна для всех блоков — имя проходит как есть, элементы маппятся
 * переданной item-функцией (индекс внутри items передаётся вторым
 * аргументом — для сообщений парсеров). Блоковые мапперы описывают только
 * свой item.
 *
 * @param dataset датасет DTO.
 * @param mapItem маппер одной строки: raw → app-тип.
 * @returns Dataset app-типа.
 */
export function mapDataset<TItemRaw, TItem>(
  dataset: DatasetDto<TItemRaw>,
  mapItem: (raw: TItemRaw, index: number) => TItem,
): Dataset<TItem>
{
  return {
    name: dataset.name,
    items: dataset.items.map((item, index) => mapItem(item, index)),
  };
}

