import { create } from 'zustand';

interface ThemeState {
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
  initTheme: () => void;
}

export const useThemeStore = create<ThemeState>()((set) => ({
  isDark: false,
  
  toggleTheme: () => set((state) => {
    const newIsDark = !state.isDark;
    if (typeof window !== 'undefined') {
      document.documentElement.classList.toggle('dark', newIsDark);
      localStorage.setItem('theme', newIsDark ? 'dark' : 'light');
    }
    return { isDark: newIsDark };
  }),
  
  setTheme: (isDark: boolean) => set(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.classList.toggle('dark', isDark);
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }
    return { isDark };
  }),
  
  initTheme: () => set(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const isDark = saved ? saved === 'dark' : prefersDark;
      document.documentElement.classList.toggle('dark', isDark);
      return { isDark };
    }
    return { isDark: false };
  }),
}));
