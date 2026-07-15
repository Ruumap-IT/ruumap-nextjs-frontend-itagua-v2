import React from "react";

interface OfflineFallbackProps {
  title?: string;
  message?: string;
  className?: string;
  icon?: React.ReactNode;
}

export default function OfflineFallback({
  title = "Sin conexión",
  message = "Esta sección requiere conexión a internet para cargar el contenido.",
  className = "",
  icon,
}: OfflineFallbackProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center w-full h-full bg-neutral-900 text-white p-4 ${className}`}
    >
      {icon ? (
        icon
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="64"
          height="64"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mb-6 opacity-40"
        >
          <line x1="1" y1="1" x2="23" y2="23" />
          <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
          <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
          <path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
          <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
          <line x1="12" y1="20" x2="12.01" y2="20" />
        </svg>
      )}
      <h3 className="text-2xl font-bold mb-3">{title}</h3>
      <p className="text-gray-400 text-center max-w-md text-lg">{message}</p>
    </div>
  );
}
