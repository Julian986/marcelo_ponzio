import type { ImgHTMLAttributes } from "react";

/** Logo en /public (usar en preload del layout). */
export const BRAND_LOGO_SRC = "/logo_marce.png";

const sizeClass = {
  splash: "h-52 w-52 max-h-[min(56vw,280px)] max-w-[min(56vw,280px)] sm:h-[15rem] sm:w-[15rem] sm:max-h-[300px] sm:max-w-[300px]",
  header: "h-[7.25rem] w-[7.25rem]",
  /** Cabeceras de página secundarias */
  page: "h-28 w-28",
  compact: "h-24 w-24",
} as const;

export type BrandLogoSize = keyof typeof sizeClass;

type BrandLogoProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt"> & {
  size?: BrandLogoSize;
  alt?: string;
};

export function BrandLogo({
  size = "header",
  className = "",
  alt = "Marcelo Ponzio Estilista",
  ...rest
}: BrandLogoProps) {
  return (
    <img
      src={BRAND_LOGO_SRC}
      alt={alt}
      width={512}
      height={512}
      decoding="async"
      className={`object-contain ${sizeClass[size]} ${className}`.trim()}
      {...rest}
    />
  );
}
