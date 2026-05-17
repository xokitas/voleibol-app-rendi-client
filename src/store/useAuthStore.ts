// src/store/useAuthStore.ts
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface User {
  id: number;
  email: string;
  role: "admin" | "coach";
  // otros campos que devuelva tu backend...
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  // Opcional: checkAuth para validar token al iniciar la app
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          // Simulación: en producción reemplaza esto por fetch a tu API
          const fakeUser: User = {
            id: 1,
            email,
            role: "coach",
          };
          const fakeToken = "fake-jwt-token";

          // Simulamos un pequeño retardo
          await new Promise((resolve) => setTimeout(resolve, 1000));

          set({
            user: fakeUser,
            token: fakeToken,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error; // lo capturará la pantalla de login para mostrar error
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage), // o AsyncStorage
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
