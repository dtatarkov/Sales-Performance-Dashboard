/**
 * Публичный контракт хука useDisclosure — булево состояние
 * «раскрыто/скрыто» для всплывающих элементов UI (frontend.md, раздел 5,
 * ui/: DateRangePicker в тулбаре, Tooltip).
 */
export interface Disclosure
{
  /** Текущее состояние: true — раскрыто. */
  isOpen: boolean;
  /** Раскрыть. */
  open: () => void;
  /** Скрыть. */
  close: () => void;
  /** Инвертировать состояние. */
  toggle: () => void;
}
