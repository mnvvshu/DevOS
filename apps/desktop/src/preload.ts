import { contextBridge, ipcRenderer } from 'electron';

// Expose a safe API to the renderer
contextBridge.exposeInMainWorld('devos', {
  platform: process.platform,
  
  getVersion: () => ipcRenderer.invoke('get-version'),
  getPlatform: () => ipcRenderer.invoke('get-platform'),
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
  
  // File dialog (for opening projects)
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
});

// Type declaration for the exposed API
declare global {
  interface Window {
    devos: {
      platform: string;
      getVersion: () => Promise<string>;
      getPlatform: () => Promise<string>;
      openExternal: (url: string) => Promise<void>;
      selectDirectory: () => Promise<string | null>;
    };
  }
}
