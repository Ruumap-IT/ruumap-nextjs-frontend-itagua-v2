import { IconName } from "@/components/icons/iconRegistry";

export type I18nLabel = {
  es: string;
  en?: string;
};

export type NavigationItem =
  | {
      type: "route";
      label: I18nLabel;
      href: string;
      icon: IconName;
    }
  | {
      type: "download";
      label: I18nLabel;
      icon: IconName;
      // Many dynamic files come from the project data, but we can have static ones if needed
    }
  | {
      type: "external";
      label: I18nLabel;
      href: string;
      icon: IconName;
    };
