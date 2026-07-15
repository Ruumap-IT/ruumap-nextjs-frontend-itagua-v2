// src/store/useProjectStore.ts
import { create } from 'zustand';
import { ProjectData } from '@/types';

interface ProjectState {
  data: ProjectData | null;
  loading: boolean;
  error: string | null;
  
  // Persistencia de navegación
  lastSelectedModel: string | null;
  lastOverviewIndex: number;
  lastOverviewCategory: string | null;
  lastResidencesIndex: number;
  projectCurrentIndex: number;
  introSeen: boolean;

  // Acciones
  setProjectData: (data: ProjectData) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (errorMsg: string) => void;
   
  // Navegación de secciones para guardar estado en sessionStorage
  setNavigationState: (state: Partial<Pick<ProjectState, 'lastSelectedModel' | 'lastOverviewIndex' | 'lastOverviewCategory' | 'lastResidencesIndex' | 'projectCurrentIndex' | 'introSeen'>>) => void;
  
  // Opcional para resetear el estado si fuese necesario
  reset: () => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
      data: null,
      loading: true,
      error: null,
      
      lastSelectedModel: null,
      lastOverviewIndex: 0,
      lastOverviewCategory: null,
      lastResidencesIndex: 0,
      projectCurrentIndex: 0,
      introSeen: false,

      setProjectData: (data) => set({ data, loading: false, error: null }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error, loading: false }),
      
      setNavigationState: (newState) => set((state) => ({ ...state, ...newState })),
      
      reset: () => set({ 
        data: null, 
        loading: false, 
        error: null,
        lastSelectedModel: null,
        lastOverviewIndex: 0,
        lastOverviewCategory: null,
        lastResidencesIndex: 0,
        projectCurrentIndex: 0,
        introSeen: false
      }),
}));
