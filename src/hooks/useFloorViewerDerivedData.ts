// import { useMemo } from "react";
// import { getAllFloors, getUnitsByFloor } from "@/lib/graphql/mappers";
// import { ENV } from "@/constants/env";
// import type { ProjectData, UnitsData } from "@/types";

// export const useFloorImage = (
//   project: ProjectData | null,
//   displayedFloor: string
// ): string | null => {
//   return useMemo(() => {
//     if (!project || !displayedFloor) return null;
//     const floors = getAllFloors(project);
//     const currentFloorObj = floors.find((f) => f.title === displayedFloor);

//     if (currentFloorObj?.image?.url) {
//       const url = currentFloorObj.image.url;
//       return url.startsWith("http") ? url : `${ENV.CDN_URL}${url}`;
//     }

//     return null;
//   }, [project, displayedFloor]);
// };

// export const useUnitsForFloor = (
//   project: ProjectData | null,
//   displayedFloor: string
// ): UnitData[] => {
//   return useMemo(() => {
//     if (!project || !displayedFloor) return [];
//     const floors = getAllFloors(project);
//     const currentFloorObj = floors.find((f) => f.title === displayedFloor);
//     if (!currentFloorObj) return [];
//     return getUnitsByFloor(project, currentFloorObj.level);
//   }, [project, displayedFloor]);
// };

// export const useAvailableFloors = (project: Project | null): string[] => {
//   return useMemo(() => {
//     if (!project) return [];
//     return getAllFloors(project).map((f) => f.title);
//   }, [project]);
// };

// export const useCurrentFloorLevel = (
//   project: Project | null,
//   displayedFloor: string
// ): number | null => {
//   return useMemo(() => {
//     if (!project || !displayedFloor) return null;
//     const floors = getAllFloors(project);
//     const currentFloorObj = floors.find((f) => f.title === displayedFloor);
//     return currentFloorObj ? currentFloorObj.level : null;
//   }, [project, displayedFloor]);
// };

// export const useShouldShowAmenitiesButton = (
//   currentFloorLevel: number | null
// ): boolean => {
//   return useMemo(
//     () => currentFloorLevel === 1 || currentFloorLevel === 12,
//     [currentFloorLevel]
//   );
// };

// export interface FloorViewBox {
//   viewBox: string;
//   width: number;
//   height: number;
// }

// export const useFloorViewBox = (units: Unit[]): FloorViewBox => {
//   return useMemo(() => {
//     if (units.length > 0) {
//       const viewBox = units[0].shape_viewbox?.viewbox;
//       if (viewBox) {
//         const allSame = units.every(
//           (u) => u.shape_viewbox?.viewbox === viewBox
//         );

//         const parts = viewBox.trim().split(/\s+/);
//         if (parts.length >= 4) {
//           const width = parseFloat(parts[2]);
//           const height = parseFloat(parts[3]);

//           if (isFinite(width) && isFinite(height)) {
//             return { viewBox, width, height };
//           }
//         }
//       }
//     }

//     return {
//       viewBox: "0 0 3840 2160",
//       width: 3840,
//       height: 2160,
//     };
//   }, [units]);
// };

// export interface AmenitiesButtonPosition {
//   x: number;
//   y: number;
// }

// export const useAmenitiesButtonPosition = (
//   currentFloorLevel: number | null,
//   floorViewBox: FloorViewBox
// ): AmenitiesButtonPosition | null => {
//   return useMemo(() => {
//     if (!floorViewBox) return null;

//     const centerX = floorViewBox.width / 2;

//     if (currentFloorLevel === 12) {
//       return {
//         x: centerX,
//         y: floorViewBox.height * 0.7,
//       };
//     }

//     if (currentFloorLevel === 1) {
//       return {
//         x: floorViewBox.width * 0.4,
//         y: floorViewBox.height * 0.28,
//       };
//     }

//     return null;
//   }, [currentFloorLevel, floorViewBox]);
// };
