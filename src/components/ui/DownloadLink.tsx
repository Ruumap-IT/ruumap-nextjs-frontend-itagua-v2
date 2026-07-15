import React, { AnchorHTMLAttributes } from "react";
import { useAssetResolver } from "@/hooks/useAssetResolver";

interface DownloadLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  fileUrl: string | undefined;
  fileName: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  onItemClick?: () => void;
}

export const DownloadLink: React.FC<DownloadLinkProps> = ({
  fileUrl,
  fileName,
  icon,
  children,
  className = "",
  onItemClick,
  ...props
}) => {
  const resolvedUrl = useAssetResolver(fileUrl);
  
  if (!fileUrl) return null;

  return (
    <a
      href={resolvedUrl || fileUrl}
      target="_blank"
      rel="noopener noreferrer"
      download={fileName}
      title={`Descargar ${fileName}`}
      className={className}
      onClick={onItemClick}
      {...props}
    >
      {icon && (
        <span className="inline-flex items-center justify-center shrink-0">
          {icon}
        </span>
      )}
      {children}
    </a>
  );
};
