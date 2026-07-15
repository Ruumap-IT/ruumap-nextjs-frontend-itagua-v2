"use client";

import { useState, useRef, useEffect } from "react";
import DownChevronIcon from "@/components/icons/DownChevronIcon";

interface DropdownOption {
  value: string;
  label: string;
}

interface CustomDropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function CustomDropdown({
  options,
  value,
  onChange,
  placeholder = "Seleccionar...",
  className = "",
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<DropdownOption | null>(
    options.find((option) => option.value === value) || null
  );
  const [isMobileLandscape, setIsMobileLandscape] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Detectar si estamos en móvil horizontal
  useEffect(() => {
    const checkMobileLandscape = () => {
      const isMobile = window.innerWidth <= 768;
      const isLandscape = window.innerHeight < window.innerWidth;
      setIsMobileLandscape(isMobile && isLandscape);
    };

    checkMobileLandscape();
    window.addEventListener("resize", checkMobileLandscape);
    window.addEventListener("orientationchange", checkMobileLandscape);

    return () => {
      window.removeEventListener("resize", checkMobileLandscape);
      window.removeEventListener("orientationchange", checkMobileLandscape);
    };
  }, []);

  // Actualizar la opción seleccionada cuando cambie el value
  useEffect(() => {
    const option = options.find((opt) => opt.value === value);
    setSelectedOption(option || null);
  }, [value, options]);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleOptionClick = (option: DropdownOption) => {
    setSelectedOption(option);
    onChange(option.value);
    setIsOpen(false);
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Botón del dropdown */}
      <button
        onClick={toggleDropdown}
        className="bg-[#343330] text-white rounded-full focus:outline-none  transition-all duration-200 flex items-center justify-between shadow-sm w-full"
        style={{
          borderRadius: "999px",
          minWidth: "120px",
          height: "42px",
          paddingTop: "12px",
          paddingBottom: "12px",
          paddingLeft: "20px",
          paddingRight: "20px",
        }}
      >
        <span className="text-base font-medium truncate sm:whitespace-normal">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <DownChevronIcon
          className={`w-4 h-4 ml-2 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Lista de opciones */}
      {isOpen && (
        <div
          className="absolute top-full left-0 mt-1 w-full bg-[#343330] shadow-lg z-50 scrollbar-hide"
          style={{
            borderRadius: "20px",
            maxHeight: "300px",
            overflowY: "auto",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => handleOptionClick(option)}
              className={`w-full text-left px-5 py-2 text-base transition-all ${
                selectedOption?.value === option.value
                  ? "text-white font-medium"
                  : "text-white"
              }`}
              style={{
                borderRadius: "20px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#343330";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
