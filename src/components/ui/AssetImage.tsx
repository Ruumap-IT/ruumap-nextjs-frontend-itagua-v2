import React from "react";
import { useAssetResolver } from "@/hooks/useAssetResolver";

interface Props extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
}

export function AssetImage({ src, alt, ...props }: Props) {
  const resolvedSrc = useAssetResolver(src);
  
  return <img src={resolvedSrc || src} alt={alt} {...props} />;
}
