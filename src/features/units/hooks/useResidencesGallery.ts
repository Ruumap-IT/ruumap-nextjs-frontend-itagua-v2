import { useState, useMemo, useEffect, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useProjectStore } from "@/store/useProjectStore";
import { normalizeUnitTitle } from "@/utils/string";
import { useGalleryNavigation } from "@/hooks/useGalleryNavigation";

export type ViewMode = "gallery" | "2d" | "3d" | "tour" | "video" | "panoramic";

/**
 * Hook Centralizado para la Galería de Residencias (Itaguav3 Edition)
 * Utiliza un modelo híbrido: Prioriza la URL (Rutas Dinámicas) y usa Zustand como memoria.
 * Se ha eliminado la lógica de PB/PA (plantas) por no usarse en este proyecto.
 */
export function useResidencesGallery() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { 
    data: project, 
    lastSelectedModel, 
    setNavigationState 
  } = useProjectStore();

  // El modelo activo viene de la URL o del Store como fallback
  const modelFromUrl = params?.model as string;
  const activeModelTitle = useMemo(() => {
    if (modelFromUrl) return normalizeUnitTitle(decodeURIComponent(modelFromUrl));
    return lastSelectedModel || "";
  }, [modelFromUrl, lastSelectedModel]);

  // Persistencia de la vista (2D/3D/Galería) vía Query Params
  const viewFromUrl = searchParams.get("view") as ViewMode;
  const [viewMode, setViewMode] = useState<ViewMode>(viewFromUrl || "gallery");
  const [hasSeenMode, setHasSeenMode] = useState<Record<string, boolean>>({});

  // Sincronizar estado local si la URL cambia (ej. botón "atrás")
  useEffect(() => {
    if (viewFromUrl) {
      setViewMode((prev) => (prev !== viewFromUrl ? viewFromUrl : prev));
    }
  }, [viewFromUrl]);

  const unitTypes = project?.unit_types || [];

  // 1. Identificar modelos "fantasma" para herencia
  const interiorsModel = useMemo(() => {
    return unitTypes.find(ut => 
      normalizeUnitTitle(ut.title).toUpperCase() === "AMENITIES - INTERIORES"
    );
  }, [unitTypes]);

  // 2. Mapeo de modelos de departamento (Excluyendo todo lo que empiece por AMENITIES)
  const modelsMap = useMemo(() => {
    const map: Record<string, typeof unitTypes[0]> = {};
    unitTypes.forEach(ut => {
      const baseTitle = normalizeUnitTitle(ut.title);
      // Excluir cualquier modelo que sea de amenidades
      if (baseTitle.toUpperCase().startsWith("AMENITIES")) return;
      map[baseTitle] = ut;
    });
    return map;
  }, [unitTypes]);

  const modelOptions = useMemo(() => {
    return Object.keys(modelsMap)
      .sort((a, b) => {
        const partsA = a.split('-');
        const partsB = b.split('-');

        if (partsA.length >= 2 && partsB.length >= 2) {
          const levelA = partsA.slice(1).join('-');
          const levelB = partsB.slice(1).join('-');
          
          const levelCompare = levelA.localeCompare(levelB, undefined, { numeric: true, sensitivity: 'base' });
          
          if (levelCompare !== 0) {
            return levelCompare;
          }
          
          return partsA[0].localeCompare(partsB[0], undefined, { numeric: true, sensitivity: 'base' });
        }

        return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
      })
      .map(title => ({ value: title, label: title }));
  }, [modelsMap]);

  // Sincronización: Si la URL cambia, actualizamos la "memoria" del Store
  useEffect(() => {
    if (modelFromUrl && normalizeUnitTitle(modelFromUrl) !== lastSelectedModel) {
      setNavigationState({ lastSelectedModel: normalizeUnitTitle(modelFromUrl) });
    }
  }, [modelFromUrl, lastSelectedModel, setNavigationState]);

  // Selección automática del primer modelo si no hay nada seleccionado
  useEffect(() => {
    if (Object.keys(modelsMap).length > 0 && !activeModelTitle) {
      const firstModel = Object.keys(modelsMap)[0];
      setNavigationState({ lastSelectedModel: firstModel });
    }
  }, [modelsMap, activeModelTitle, setNavigationState]);

  const unitType = useMemo(() => {
    return modelsMap[activeModelTitle] || null;
  }, [modelsMap, activeModelTitle]);

  // Resolución de Galería con Herencia Selectiva
  const gallery = useMemo(() => {
    if (!unitType) return [];
    // Si tiene fotos propias, úsalas. Si no, usa las de Interiores de respaldo.
    if (unitType.gallery && unitType.gallery.length > 0) return unitType.gallery;
    return interiorsModel?.gallery || [];
  }, [unitType, interiorsModel]);

  // Navegación de la galería (mismo hook compartido)
  const {
    index: galleryIndex,
    setIndex: setGalleryIndex,
    direction,
    setDirection,
    goNext,
    goPrev,
  } = useGalleryNavigation({
    totalItems: gallery.length,
    initialIndex: 0,
    enabled: viewMode === "gallery",
  });

  // Smart Preloading (Modelo Actual + Siguiente en la lista)
  useEffect(() => {
    if (!unitType || !modelsMap) return;
    
    // 1. Carga Crítica
    const currentModelUrls = [
      unitType.floorplan_2d?.url,
      unitType.floorplan_3d?.url,
      unitType.panoramic_view?.url,
      ...gallery.slice(0, 2).map(img => img.url)
    ].filter(Boolean) as string[];

    currentModelUrls.forEach(url => {
      const img = new Image();
      img.src = url;
    });

    // 2. Carga Inteligente (Siguiente modelo en el dropdown)
    const titles = Object.keys(modelsMap);
    const currentIndex = titles.indexOf(activeModelTitle);
    const nextTitle = titles[(currentIndex + 1) % titles.length];
    
    if (nextTitle && nextTitle !== activeModelTitle) {
      const nextModel = modelsMap[nextTitle];
      const nextModelUrls = [
        nextModel?.floorplan_2d?.url,
        nextModel?.floorplan_3d?.url,
      ].filter(Boolean) as string[];

      const schedulePreload = (window as any).requestIdleCallback || ((cb: any) => setTimeout(cb, 2000));
      schedulePreload(() => {
        nextModelUrls.forEach(url => {
          const img = new Image();
          img.src = url;
        });
      });
    }
  }, [unitType, gallery, modelsMap, activeModelTitle]);

  // Cuando cambias de modelo, reseteamos el índice de la galería
  useEffect(() => {
    setGalleryIndex(0);
    setDirection(0);
  }, [activeModelTitle, setGalleryIndex, setDirection]);

  const handleModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    if (!hasSeenMode[mode]) {
      setHasSeenMode(prev => ({ ...prev, [mode]: true }));
    }
    
    // Actualizar URL con la nueva vista (sin añadir entrada al historial si es solo vista)
    const currentPath = window.location.pathname;
    router.replace(`${currentPath}?view=${mode}`);
  }, [hasSeenMode, router]);

  // Función para cambiar de modelo vía navegación (Rutas Dinámicas)
  const changeModel = useCallback((newModel: string) => {
    // Si estamos en una vista especial (2d/3d), intentamos mantenerla al cambiar de modelo
    const viewQuery = viewMode !== "gallery" ? `?view=${viewMode}` : "";
    router.push(`/departments/${encodeURIComponent(newModel)}${viewQuery}`);
  }, [router, viewMode]);

  return {
    project,
    unitType,
    gallery,
    modelOptions,
    selectedModelTitle: activeModelTitle,
    setSelectedModelTitle: changeModel, 
    viewMode,
    setViewMode: handleModeChange,
    galleryIndex,
    direction,
    goNext,
    goPrev,
    selectedFloorIndex: 0, // Mantenemos por compatibilidad de props, pero siempre es 0
  };
}
