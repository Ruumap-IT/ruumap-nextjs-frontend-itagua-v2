import { HomeIcon } from "./HomeIcon";
import { BuildingIcon } from "./BuildingIcon";
import { FloorIcon } from "./FloorIcon";
import { DepartmentIcon } from "./DepartmentIcon";
import { VideoIcon } from "./VideoIcon";
import { LocationIcon } from "./LocationIcon";
import { ContactIcon } from "./ContactIcon";
import { BrochureIcon } from "./BrochureIcon";
import { GeneralViewIcon } from "./GeneralViewIcon";
import { AmenitiesIcon } from "./AmenitiesIcon";
import { Person360Icon } from "./Person360Icon";

export const iconRegistry = {
  home: HomeIcon,
  building: BuildingIcon,
  floor: FloorIcon,
  department: DepartmentIcon,
  general: GeneralViewIcon,
  amenities: AmenitiesIcon,
  brochure: BrochureIcon,
  video: VideoIcon,
  location: LocationIcon,
  contact: ContactIcon,
  vr: Person360Icon,
} as const;

export type IconName = keyof typeof iconRegistry;
