import { create } from 'zustand';

type DeviceQuality = 'high' | 'medium' | 'low';

interface AppState {
  deviceQuality: DeviceQuality;
  isLoaded: boolean;
  activeSection: string;
  setActiveSection: (section: string) => void;
  setLoaded: (loaded: boolean) => void;
  setQuality: (quality: DeviceQuality) => void;
}

export const useAppStore = create<AppState>((set) => ({
  deviceQuality: 'high',
  isLoaded: false,
  activeSection: 'hero',
  setActiveSection: (section) => set({ activeSection: section }),
  setLoaded: (loaded) => set({ isLoaded: loaded }),
  setQuality: (quality) => set({ deviceQuality: quality }),
}));
