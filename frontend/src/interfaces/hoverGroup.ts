/**
 * Публичный контракт хука useHoverGroup — группа взаимной hover-подсветки
 * (frontend-plan.md, этап 5; ui.md, блок 7 «Продажи по категориям»).
 */
export interface HoverGroup
{
  /** id подсвеченного элемента или null. */
  highlightedId: string | null;
  /** Включить подсветку элемента с данным id. */
  highlight: (id: string) => void;
  /** Сбросить подсветку всей группы. */
  clearHighlight: () => void;
}
