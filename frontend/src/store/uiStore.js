/**
 * UI Store (Zustand)
 * Theme, sidebar, modals
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useUIStore = create(
  persist(
    (set, get) => ({
      theme: 'system',  // 'light' | 'dark' | 'system'
      sidebarOpen: false,
      createPostOpen: false,
      activeModal: null,  // string key of currently open modal
      unreadNotifications: 0,
      unreadMessages: 0,

      setTheme: (theme) => {
        set({ theme });
        const isDark =
          theme === 'dark' ||
          (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        document.documentElement.classList.toggle('dark', isDark);
      },

      initTheme: () => {
        const { theme } = get();
        const isDark =
          theme === 'dark' ||
          (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        document.documentElement.classList.toggle('dark', isDark);
      },

      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      closeSidebar: () => set({ sidebarOpen: false }),

      openCreatePost: () => set({ createPostOpen: true }),
      closeCreatePost: () => set({ createPostOpen: false }),

      openModal: (key) => set({ activeModal: key }),
      closeModal: () => set({ activeModal: null }),

      setUnreadNotifications: (count) => set({ unreadNotifications: count }),
      setUnreadMessages: (count) => set({ unreadMessages: count }),
      incrementNotifications: () => set((s) => ({ unreadNotifications: s.unreadNotifications + 1 })),
    }),
    {
      name: 'teamagi-ui',
      partialize: (state) => ({ theme: state.theme }),
    }
  )
);

export default useUIStore;
