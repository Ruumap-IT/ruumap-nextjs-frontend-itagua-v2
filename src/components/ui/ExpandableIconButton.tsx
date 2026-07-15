import { SVGProps, useState } from "react";

interface ExpandableIconButtonProps {
  icon: React.ComponentType<SVGProps<SVGSVGElement>>;
  onClick: () => void;
  ariaLabel: string;
  text?: string;
  size?: "sm" | "md" | "lg";
  variant?: "dark" | "light" | "glass";
  isActive?: boolean;
}

export default function ExpandableIconButton({
  icon: Icon,
  onClick,
  ariaLabel,
  text,
  size = "md",
  variant = "glass",
  isActive = false,
}: ExpandableIconButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Tamaños del botón
  const sizes = {
    sm: { button: "w-[36px] h-[36px]", icon: "w-[14px] h-[14px]" },
    md: { button: "w-[42px] h-[42px]", icon: "w-[18px] h-[18px]" },
    lg: { button: "w-[48px] h-[48px]", icon: "w-[22px] h-[22px]" },
  };

  // Variantes de color
  const variants = {
    dark: "bg-[#343330] text-[#FFFFFF] ",
    light: "bg-[#FFFFFF] text-[#303030] ",
    glass: "bg-white/10 backdrop-blur text-white hover:bg-white/20",
  };

  const sizeClasses = sizes[size];
  const variantClasses = isActive ? variants.dark : variants[variant];

  // Extraer solo la altura para el tooltip
  const heightClass =
    size === "sm" ? "h-[36px]" : size === "md" ? "h-[42px]" : "h-[48px]";

  return (
    <div className="group relative flex items-center justify-end">
      <button
        onClick={onClick}
        type="button"
        className={`
          ${sizeClasses.button} 
          rounded-full 
          ${variantClasses}
          flex items-center justify-center 

          relative z-10
          ${text ? "group-hover:rounded-l-none group-hover:border-l-0" : ""}
        `}
        aria-label={ariaLabel}
      >
        <Icon className={sizeClasses.icon} />
      </button>

      {text && (
        <div
          className={`
          absolute right-full top-0
          ${heightClass}
          flex items-center justify-center px-2 pl-4
          ${variantClasses}
          rounded-l-full
          
          opacity-0 group-hover:opacity-100
          pointer-events-none
          whitespace-nowrap
          z-0
        `}
        >
          <span className="text-sm font-medium">{text}</span>
        </div>
      )}
    </div>
  );
}
