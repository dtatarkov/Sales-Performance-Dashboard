"use client";

import { AvatarImage } from "./AvatarImage";
import { AvatarInitials } from "./AvatarInitials";

/**
 * Тип props примитива Avatar — аватар менеджера с фолбэком на инициалы
 * (frontend-plan.md, этап 6).
 */
type AvatarProps = {
  /** Полное имя менеджера (для alt и вычисления инициалов). */
  name: string;
  /** Инициалы (fallback-содержимое, из domain-данных). */
  initials: string;
  /** URL аватара или null — тогда инициалы. */
  avatar: string | null;
  /** Размер стороны, px. */
  size?: number;
  /** Номер цвета фона инициалов (палитра series-1..3). */
  colorIndex?: number;
};

/**
 * Примитив Avatar: композиция AvatarImage (картинка, если есть) и
 * AvatarInitials (плашка с инициалами в цвет палитры).
 *
 * @param props имя, инициалы, аватар, размер, номер цвета.
 * @returns аватар.
 */
export function Avatar({
  name,
  initials,
  avatar,
  size = 32,
  colorIndex = 0,
}: AvatarProps) {
  if (avatar !== null) {
    const avatarImage = <AvatarImage avatar={avatar} name={name} size={size} />;

    return avatarImage;
  }

  const initialsBadge = (
    <AvatarInitials
      name={name}
      initials={initials}
      size={size}
      colorIndex={colorIndex}
    />
  );

  return initialsBadge;
}
