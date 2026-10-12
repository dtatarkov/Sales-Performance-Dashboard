"use client";

import { paletteColorOf } from "../../configuration/colorPalette";

/** Свойства AvatarInitials. */
type AvatarInitialsProps = {
  /** Полное имя менеджера (aria-label). */
  name: string;
  /** Инициалы (содержимое плашки, из domain-данных). */
  initials: string;
  /** Размер стороны, px. */
  size: number;
  /** Номер цвета фона (единая палитра, закольцован). */
  colorIndex: number;
};

/**
 * Инициалы аватара: плашка цвета из единой палитры с инициалами. Номер цвета
 * детерминирует фон — одно имя всегда одного цвета.
 *
 * @param props имя (aria-label), инициалы, размер стороны, номер цвета.
 * @returns плашку с инициалами.
 */
export function AvatarInitials({
  name,
  initials,
  size,
  colorIndex,
}: AvatarInitialsProps) {
  const backgroundColor = paletteColorOf(colorIndex);
  const fontSize = Math.max(size * 0.4, 10);

  const style = {
    width: `${size}px`,
    height: `${size}px`,
    backgroundColor,
    fontSize: `${fontSize}px`,
  } as const;

  return (
    <span
      role="img"
      aria-label={name}
      className="inline-flex items-center justify-center rounded-full font-semibold text-white"
      style={style}
    >
      {initials}
    </span>
  );
}
