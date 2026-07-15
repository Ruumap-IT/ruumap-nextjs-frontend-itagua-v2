"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { useProjectStore } from "@/store/useProjectStore";
import { usePrepareVideos, PreparedVideo } from "@/hooks/usePrepareVideos";
import { Flythrough, ProjectData } from "@/types";
import { getStrapiMedia } from "@/utils/url";
import AdoptedVideo from "../components/AdoptedVideo";

interface VideoPreloadState {
  isReady: boolean;
  progress: number;
  error: string | null;
  
  // Videos preparados
  introVideo: PreparedVideo | null;       // TRANSITION_VIDEO
  floorEntryVideo: PreparedVideo | null;  // TRANSITION_PLANO
  forwardVideos: PreparedVideo[];         // V1, V2, V3, V4
  backwardVideos: PreparedVideo[];        // V5, V6, V7, V8 (O correspondencias)
  
  introReady: boolean; // NEW: Granular ready state for intro
  
  // Datos crudos para lógica de BuildingViewer
  forwardFlythroughs: Flythrough[];
  backwardFlythroughs: (Flythrough | undefined)[];

  // Global Transition System
  isGlobalActive: boolean;
  globalVideo: PreparedVideo | null;
}

interface VideoPreloadContextType extends VideoPreloadState {
  isPreloading: boolean;
  decodeNext: (index: number) => Promise<void>;
  setIsGlobalActive: (active: boolean) => void;
  setGlobalVideo: (v: PreparedVideo | null) => void;
}

const VideoPreloadContext = createContext<VideoPreloadContextType | null>(null);

export function useVideoPreloadContext() {
  const context = useContext(VideoPreloadContext);
  if (!context) {
    throw new Error("useVideoPreloadContext must be used within VideoPreloadProvider");
  }
  return context;
}

/**
 * Lógica para alinear videos Forward (1-4) con sus correspondientes Backward (5-8)
 * Basado en la lógica original de Itagua.
 */
function buildDirectionalOrder(all: Flythrough[]) {
  // Excluir videos de transición del orbital para no romper el orden 1..8
  const orbitals = all.filter(f => 
    f.viewpoint !== "TRANSITION_VIDEO" && 
    f.viewpoint !== "TRANSITION_PLANO"
  );

  const forward = orbitals
    .filter((f) => f.order >= 41 && f.order <= 44)
    .sort((a, b) => a.order - b.order);

  const backward = orbitals
    .filter((f) => f.order >= 45 && f.order <= 48)
    .sort((a, b) => a.order - b.order);

  const backwardOrderMap: Record<number, number> = {
    41: 48, // forward V1 -> backward V8
    42: 45, // forward V2 -> backward V5
    43: 46, // forward V3 -> backward V6
    44: 47, // forward V4 -> backward V7
  };

  const backwardAligned = forward.map((fwd) => {
    const targetOrder = backwardOrderMap[fwd.order];
    return backward.find((b) => b.order === targetOrder);
  });

  return { 
    forward, 
    backwardAligned 
  };
}

export function VideoPreloadProvider({ 
  children,
  initialProject
}: { 
  children: React.ReactNode;
  initialProject?: ProjectData | null;
}) {
  const storeProject = useProjectStore((state: { data: ProjectData | null }) => state.data);
  const project = initialProject || storeProject;

  const [state, setState] = useState<VideoPreloadState>({
    isReady: false,
    progress: 0,
    error: null,
    introVideo: null,
    floorEntryVideo: null,
    forwardVideos: [],
    backwardVideos: [],
    forwardFlythroughs: [],
    backwardFlythroughs: [],
    introReady: false,
    isGlobalActive: false,
    globalVideo: null,
  });
  
  const [isPreloading, setIsPreloading] = useState(false);
  const hasStartedRef = useRef(false);

  // 1. Identificar URLs de videos de transición directamente desde Strapi
  const getUrlForViewpoint = useCallback((viewpoint: string) => {
    const fly = project?.flythroughs?.find((f: Flythrough) => f.viewpoint === viewpoint);
    return fly?.video?.url || "";
  }, [project]);

  const introUrl = useMemo(() => getUrlForViewpoint("TRANSITION_VIDEO"), [getUrlForViewpoint]);
  const floorEntryUrl = useMemo(() => getUrlForViewpoint("TRANSITION_PLANO"), [getUrlForViewpoint]);

  // 2. Preparar videos de transición
  const buildUrl = useCallback((u: string) => {
    if (!u) return "";
    return getStrapiMedia(u);
  }, []);

  const { prepared: preparedTransitions, allReady: transitionsReady } = usePrepareVideos(
    [introUrl, floorEntryUrl],
    { concurrency: 2, buildUrl }
  );

  // 3. Preparar videos orbitales (si el proyecto ya cargó)
  const directional = useMemo(() => {
    if (!project) return { forward: [], backwardAligned: [] };
    return buildDirectionalOrder(project.flythroughs);
  }, [project]);

  const forwardUrls = useMemo(() => 
    directional.forward
      .filter((f): f is Flythrough => !!f)
      .map(f => f.video?.url || ""), 
  [directional]);
  
  const backwardUrls = useMemo(() => 
    directional.backwardAligned
      .filter((b): b is Flythrough => !!b)
      .map(b => b.video?.url || ""), 
  [directional]);

  const { prepared: preparedForward, allReady: forwardReady, decodeNext: decodeForward } = usePrepareVideos(forwardUrls, { concurrency: 2, buildUrl });
  const { prepared: preparedBackward, allReady: backwardReady } = usePrepareVideos(backwardUrls, { concurrency: 2, buildUrl });

  const decodeNext = useCallback(async (index: number) => {
    await decodeForward?.(index);
  }, [decodeForward]);

  // 4. Orquestar el estado Ready
  useEffect(() => {
    if (!project) return;

    const totalVideos = (2 + forwardUrls.length + backwardUrls.length) || 1;
    const readyCount = (preparedTransitions.filter(v => v.ready).length) + 
                       (preparedForward.filter(v => v.ready).length) + 
                       (preparedBackward.filter(v => v.ready).length);
    
    const progressTotal = Math.round((readyCount / totalVideos) * 100);

    // RE-ALINEACIÓN CRÍTICA: Volver a poner los videos en sus índices (0-3 o 0-1)
    // porque usePrepareVideos los devuelve en un arreglo compacto.
    const alignPrepared = (originals: (Flythrough | undefined)[], prepared: PreparedVideo[]) => {
      let pIdx = 0;
      return originals.map(orig => {
        if (!orig) return undefined;
        return prepared[pIdx++];
      });
    };

    const finalForward = alignPrepared(directional.forward, preparedForward) as PreparedVideo[];
    const finalBackward = alignPrepared(directional.backwardAligned, preparedBackward) as PreparedVideo[];

    setState(prev => ({
      ...prev,
      progress: progressTotal,
      introVideo: preparedTransitions[0] || null,
      floorEntryVideo: preparedTransitions[1] || null,
      forwardVideos: finalForward,
      backwardVideos: finalBackward,
      forwardFlythroughs: directional.forward as Flythrough[],
      backwardFlythroughs: directional.backwardAligned,
      introReady: preparedTransitions[0]?.ready || false,
      // isReady true si el intro está listo O si la mayoría de los orbitales están (70%+)
      isReady: (preparedTransitions[0]?.ready) || (progressTotal >= 70),
    }));

    // Quitamos el preloading si el intro está listo, permitiendo entrar "directo"
    if (preparedTransitions[0]?.ready) {
      setIsPreloading(false);
    }
  }, [
    project, 
    preparedTransitions, transitionsReady, 
    preparedForward, forwardReady, 
    preparedBackward, backwardReady,
    directional, forwardUrls.length, backwardUrls.length
  ]);

  const contextValue = useMemo(() => ({
    ...state,
    isPreloading,
    decodeNext,
    setIsGlobalActive: (active: boolean) => setState(prev => {
      if (!active && prev.globalVideo?.el) {
        const el = prev.globalVideo.el;
        // Retrasamos el reseteo 50ms para asegurar que React ya desmontó el video del DOM.
        // Si lo hacemos sincrónicamente, el navegador puede alcanzar a pintar el fotograma 0 
        // antes de que desaparezca de la pantalla, causando un "flicker".
        setTimeout(() => {
          try {
            el.pause();
            el.currentTime = 0;
          } catch (e) {}
        }, 50);
      }
      return { ...prev, isGlobalActive: active };
    }),
    setGlobalVideo: (v: PreparedVideo | null) => setState(prev => ({ ...prev, globalVideo: v })),
  }), [state, isPreloading, decodeNext]);

  return (
    <VideoPreloadContext.Provider value={contextValue}>
      {children}
      
      {state.isGlobalActive && state.globalVideo && (
        <div className="fixed inset-0 z-9999 pointer-events-none">
          <AdoptedVideo 
            el={state.globalVideo.el} 
            active={state.isGlobalActive} 
            play={true} 
          />
        </div>
      )}
    </VideoPreloadContext.Provider>
  );
}
