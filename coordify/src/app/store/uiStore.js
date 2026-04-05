import { create } from 'zustand'

export const useUiStore = create((set) => ({
  sidebarOpen: false,
  globalSearch: '',
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setGlobalSearch: (globalSearch) => set({ globalSearch }),
}))
