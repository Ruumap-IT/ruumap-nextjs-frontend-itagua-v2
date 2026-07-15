import { SVGProps } from "react";

interface CircularIconButtonProps {
  icon?: React.ComponentType<SVGProps<SVGSVGElement>>;
  text?: string;
  onClick: () => void;
  ariaLabel?: string;
  title?: string;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "dark" | "light" | "glass";
}

export default function CircularIconButton({
  icon: Icon,
  text,
  onClick,
  ariaLabel,
  title,
  className = "",
  size = "md",
  variant = "dark",
}: CircularIconButtonProps) {
  const sizes = {
    sm: {
      button: text ? "min-w-[60px] h-[36px] px-3" : "w-[36px] h-[36px]",
      icon: "w-[14px] h-[14px]",
      text: "text-xs",
    },
    md: {
      button: text ? "min-w-[80px] h-[42px] px-4" : "w-[42px] h-[42px]",
      icon: "w-[18px] h-[18px]",
      text: "text-sm",
    },
    lg: {
      button: text ? "min-w-[100px] h-[48px] px-5" : "w-[48px] h-[48px]",
      icon: "w-[22px] h-[22px]",
      text: "text-base",
    },
    xl: {
      button: text ? "min-w-[120px] h-[54px] px-6" : "w-[54px] h-[54px]",
      icon: "w-[26px] h-[26px]",
      text: "text-lg",
    },
  };

  const variants = {
    dark: "bg-[#343330] text-[#FFFFFF] ",
    light: "bg-[#FFFFFF] text-[#303030] hover:bg-gray-50",
    glass:
      "bg-white/10 backdrop-blur border border-white/20 text-white hover:bg-white/20",
  };

  const sizeClasses = sizes[size];
  const variantClasses = variants[variant];

  if (!Icon && !text) {
    console.warn("CircularIconButton: Debes proporcionar un icono o texto");
    return null;
  }

  return (
    <button
      onClick={onClick}
      type="button"
      className={`
        ${sizeClasses.button} 
        ${text ? "rounded-full" : "rounded-full"}
        ${variantClasses}
        flex items-center justify-center 
        transition-all duration-200 
        hover:scale-105 
        font-medium
        ${className}
      `}
      aria-label={ariaLabel}
      title={title || ariaLabel}
    >
      {Icon && (
        <Icon
          className={`${sizeClasses.icon} ${
            variant === "light" ? "text-[#303030]" : ""
          }`}
        />
      )}
      {text && (
        <span className={`${sizeClasses.text} whitespace-nowrap`}>{text}</span>
      )}
    </button>
  );
}
