import React from "react";

interface DownChevronIconProps {
  className?: string;
}

export default function DownChevronIcon({
  className = "",
}: DownChevronIconProps) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 9l-7 7-7-7"
      />
    </svg>
  );
}

