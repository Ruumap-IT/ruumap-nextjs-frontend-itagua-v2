"use client";
import { useEffect, useRef, useState } from "react";
import { useAssetResolver } from "@/hooks/useAssetResolver";

interface Props {
  src: string;
  poster?: string;
  className?: string;
  children?: React.ReactNode;
}

export default function VideoBackground({
  src,
  poster,
  className,
  children,
}: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const isImage = src.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  
  const resolvedSrc = useAssetResolver(src);
  const resolvedPoster = useAssetResolver(poster);

  useEffect(() => {
    if (isImage) return;

    const v = videoRef.current;
    if (!v) return;

    const handleCanPlay = async () => {
      setIsVideoLoaded(true);
      try {
        await v.play();
      } catch (_) {}
    };

    v.addEventListener("canplay", handleCanPlay, { once: true });
    return () => v.removeEventListener("canplay", handleCanPlay);
  }, [src, isImage]);

  if (isImage) {
    return (
      <div className={`fixed inset-0 overflow-hidden ${className ?? ""}`}>
        <img
          src={resolvedSrc || src}
          alt="Background"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="relative z-10 h-full w-full">{children}</div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 overflow-hidden bg-black ${className ?? ""}`}>
      {/* Fondo negro mientras carga el video */}
      {!isVideoLoaded && (
        <div className="absolute inset-0 bg-black z-0" />
      )}
      
      <video
        ref={videoRef}
        key={src}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
          isVideoLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        src={resolvedSrc || src}
        poster={resolvedPoster || poster}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      />
      
      {/* Fallback de imagen (poster) mientras carga el video */}
      {!isVideoLoaded && poster && (
        <img 
          src={resolvedPoster || poster} 
          alt="Poster" 
          className="absolute inset-0 w-full h-full object-cover z-1"
        />
      )}
      <div className="relative z-10 h-full w-full">{children}</div>
    </div>
  );
}
