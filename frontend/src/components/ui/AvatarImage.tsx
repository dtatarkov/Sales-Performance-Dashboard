"use client";

/** Свойства AvatarImage. */
type AvatarImageProps = {
  /** URL аватара (data-URI из seed). */
  avatar: string;
  /** Полное имя менеджера (alt). */
  name: string;
  /** Размер стороны, px. */
  size: number;
};

/**
 * Картинка аватара. Размер стороны фиксирован, скругление и cover-кроп
 * через классы.
 *
 * @param props URL аватара, имя (alt), размер стороны.
 * @returns картинку аватара.
 */
export function AvatarImage({ avatar, name, size }: AvatarImageProps) {
  const style = {
    width: `${size}px`,
    height: `${size}px`,
  } as const;

  return (
    // <img> намеренно: аватары приходят data-URI из seed, next/image для
    // них бессмыслен (eslint-disable в файле — правило не отключаем глобально).
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={avatar}
      alt={name}
      width={size}
      height={size}
      className="rounded-full object-cover"
      style={style}
    />
  );
}
