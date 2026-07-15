import { Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useProjectStore } from "@/store/useProjectStore";
import { iconRegistry } from "@/components/icons/iconRegistry";
import { NAVIGATION_CONFIG } from "@/config/navigation";
import { isActiveRoute } from "@/lib/navigation/isActiveRoute";
import { DownloadLink } from "@/components/ui/DownloadLink";

interface SidebarItemsProps {
  onItemClick: () => void;
}

export default function SidebarItems({ onItemClick }: SidebarItemsProps) {
  const pathname = usePathname();
  const project = useProjectStore((state) => state.data);

  // En el futuro, este 'es' podría venir de un hook de i18n (useLocale, etc.)
  const locale = "es";

  return (
    <nav className="px-0">
      <div className="space-y-1 mt-4">

        {NAVIGATION_CONFIG.map((item) => {
          const IconComponent = iconRegistry[item.icon] || iconRegistry.home;
          const label = item.label[locale] || item.label["es"];

          let isActive = false;
          if (item.type === "route" || item.type === "external") {
            isActive = isActiveRoute(pathname, item.href);
          }

          const commonClasses = `flex items-center gap-3 sm:gap-4 mx-2 px-2 sm:px-3 lg:px-3 h-11 sm:h-12 lg:h-12 box-border rounded-xl transition-all duration-200 group text-left active:scale-95 transition-transform duration-75 ${isActive && item.type !== "download"
            ? "bg-[#73737318] text-gray-900"
            : "text-gray-600 hover:bg-[#73737315] hover:text-gray-900"
            }`;

          // CASE: DOWNLOAD (e.g. Brochure)
          if (item.type === "download") {
            return (
              <DownloadLink
                key={`${item.type}-${item.label.es}`}
                fileUrl={project?.brochure?.url}
                fileName={label}
                className={commonClasses}
                onItemClick={onItemClick}
                icon={<IconComponent className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />}
              >
                <span className="font-normal text-sm sm:text-base lg:text-[17px]">
                  {label}
                </span>
              </DownloadLink>
            );
          }

          // CASE: EXTERNAL
          if (item.type === "external") {
            return (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onItemClick}
                className={commonClasses}
              >
                <IconComponent className="w-5 h-5 text-gray-400 group-hover:text-gray-600 shrink-0" />
                <span className="font-normal text-sm sm:text-base lg:text-[17px]">
                  {label}
                </span>
              </a>
            );
          }

          // CASE: ROUTE
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              onClick={onItemClick}
              className={commonClasses}
            >
              <IconComponent
                className={`w-5 h-5 shrink-0 ${isActive ? "text-gray-900" : "text-gray-900"
                  }`}
              />
              <span className="font-normal text-sm sm:text-base lg:text-[17px]">
                {label}
              </span>
              {isActive && (
                <div className="ml-auto w-2 h-2 bg-gray-900 rounded-full shrink-0" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
