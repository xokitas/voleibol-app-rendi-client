// useMatchStore.ts
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

// ----------------------------------------------------------------
// 1. Tipos
// ----------------------------------------------------------------

/** Acción individual dentro de un rally */
export interface RallyAction {
  category: string;
  subAction: string;
  playerId: string;
  value?: number;
  origin?: string;
  destination?: string;
  wind?: string;
  timestamp?: string;
  from?: string;
  to?: string;
}

/** Rally completo ya finalizado o en construcción */
export interface RallyEntry {
  winner?: "A" | "B"; // definido solo cuando el rally termina
  scoreAtTheTime: { A: number; B: number }; // foto del marcador al iniciar el rally
  actions: RallyAction[];
}

// Reglas del juego
export interface MatchRules {
  pointsToWinSet: number; // default 21
  pointsToWinLastSet: number; // default 15
  minDifference: number; // default 2
  maxSets: number; // default 3
  switchIntervalNormal: number; // default 7
  switchIntervalLast: number; // default 5
  hasTimeLimit: boolean;
  timeLimitMinutes?: number;
}

/** Configuración que viene de la pantalla de Registro */
export interface MatchConfig {
  tournament: string;
  category: string;
  date: string;
  matchNumber: number;
  gender: "M" | "F";
  eventType: string;
  startTime?: string; // solo oficial
  place?: string; // oficial, interno, externo
  denomination?: string; // oficial
  // Interno / Externo / Entrenamiento
  meso?: string;
  micro?: string;
  weekDay?: string;
  microNumber?: string;
  // Solo entrenamiento
  objective?: string;
  // Equipos
  teamA: { name: string; players: { number: string; fullName: string }[] };
  teamB: { name: string; players: { number: string; fullName: string }[] };
  platform?: "web" | "mobile";
  rules?: MatchRules;
}

/** El objeto Match completo */
export interface Match {
  id: string;
  status: "in_progress" | "partial" | "finished";
  config: MatchConfig;
  score: {
    setsA: number;
    setsB: number;
    pointsA: number;
    pointsB: number;
    currentSet: number;
  };
  history: {
    set: number;
    rallies: RallyEntry[];
  }[];
  totalTimeSeconds?: number;
  realTimeSeconds?: number;
}

// ----------------------------------------------------------------
// 2. Interfaz del Store
// ----------------------------------------------------------------
export interface MatchStore {
  // Estado
  currentMatch: Match | null;
  savedMatches: Match[];

  // Configuración
  setInitialMatchData: (config: MatchConfig) => string; // devuelve el id creado
  clearCurrentMatch: () => void;

  // Marcador
  incrementPointsA: () => void;
  incrementPointsB: () => void;
  setPointsA: (points: number) => void;
  setPointsB: (points: number) => void;
  incrementSetsA: () => void;
  incrementSetsB: () => void;
  setCurrentSet: (set: number) => void;

  // Rally
  addRallyAction: (action: RallyAction, index?: number) => void;
  finishRally: (winner: "A" | "B") => void; // cierra el rally y asigna punto
  clearCurrentRally: () => void; // elimina el rally en curso

  // Gestión de partidos guardados
  saveCurrentMatch: (status: "partial" | "finished") => void;
  loadMatch: (matchId: string) => void;
  deleteMatch: (matchId: string) => void;
}

// ----------------------------------------------------------------
// 3. Implementación del Store con persistencia
// ----------------------------------------------------------------

const generateMatchId = (config: MatchConfig): string => {
  const dateStr = config.date.replace(/-/g, "");
  const gender = config.gender;
  const matchNum = config.matchNumber;
  return `${dateStr}-${gender}${matchNum}-${config.tournament}`.replace(
    /\s/g,
    "-",
  );
};

export const useMatchStore = create<MatchStore>()(
  persist(
    (set, get) => ({
      currentMatch: null,
      savedMatches: [],

      // --- Configuración ---
      setInitialMatchData: (config) => {
        const id = generateMatchId(config);
        const newMatch: Match = {
          id,
          status: "in_progress",
          config,
          score: {
            setsA: 0,
            setsB: 0,
            pointsA: 0,
            pointsB: 0,
            currentSet: 1,
          },
          history: [],
        };
        set({ currentMatch: newMatch });
        return id;
      },

      clearCurrentMatch: () => set({ currentMatch: null }),

      // --- Puntuación ---
      incrementPointsA: () =>
        set((state) => {
          if (!state.currentMatch) return state;
          return {
            currentMatch: {
              ...state.currentMatch,
              score: {
                ...state.currentMatch.score,
                pointsA: state.currentMatch.score.pointsA + 1,
              },
            },
          };
        }),

      incrementPointsB: () =>
        set((state) => {
          if (!state.currentMatch) return state;
          return {
            currentMatch: {
              ...state.currentMatch,
              score: {
                ...state.currentMatch.score,
                pointsB: state.currentMatch.score.pointsB + 1,
              },
            },
          };
        }),

      setPointsA: (points) =>
        set((state) => {
          if (!state.currentMatch) return state;
          return {
            currentMatch: {
              ...state.currentMatch,
              score: { ...state.currentMatch.score, pointsA: points },
            },
          };
        }),

      setPointsB: (points) =>
        set((state) => {
          if (!state.currentMatch) return state;
          return {
            currentMatch: {
              ...state.currentMatch,
              score: { ...state.currentMatch.score, pointsB: points },
            },
          };
        }),

      incrementSetsA: () =>
        set((state) => {
          if (!state.currentMatch) return state;
          return {
            currentMatch: {
              ...state.currentMatch,
              score: {
                ...state.currentMatch.score,
                setsA: state.currentMatch.score.setsA + 1,
              },
            },
          };
        }),

      incrementSetsB: () =>
        set((state) => {
          if (!state.currentMatch) return state;
          return {
            currentMatch: {
              ...state.currentMatch,
              score: {
                ...state.currentMatch.score,
                setsB: state.currentMatch.score.setsB + 1,
              },
            },
          };
        }),

      setCurrentSet: (setNumber) =>
        set((state) => {
          if (!state.currentMatch) return state;
          return {
            currentMatch: {
              ...state.currentMatch,
              score: { ...state.currentMatch.score, currentSet: setNumber },
            },
          };
        }),

      // --- Rally ---
      addRallyAction: (action, index?) =>
        set((state) => {
          if (!state.currentMatch) return state;
          const history = [...state.currentMatch.history];
          let setEntry = history.find(
            (h) => h.set === state.currentMatch!.score.currentSet,
          );
          if (!setEntry) {
            setEntry = {
              set: state.currentMatch!.score.currentSet,
              rallies: [],
            };
            history.push(setEntry);
          }

          // El rally en curso es el último y sin winner
          let rallies = [...setEntry.rallies];
          let rallyInProgress = rallies[rallies.length - 1];
          if (!rallyInProgress || rallyInProgress.winner) {
            // Crear uno nuevo
            rallyInProgress = {
              winner: undefined,
              scoreAtTheTime: {
                A: state.currentMatch.score.pointsA,
                B: state.currentMatch.score.pointsB,
              },
              actions: [],
            };
            rallies.push(rallyInProgress);
          }

          const newActions = [...rallyInProgress.actions];
          if (index !== undefined) {
            newActions.splice(index, 0, action);
          } else {
            newActions.push(action);
          }
          rallyInProgress.actions = newActions;
          rallies[rallies.length - 1] = rallyInProgress;
          setEntry.rallies = rallies;

          return {
            currentMatch: {
              ...state.currentMatch,
              history: history.map((h) =>
                h.set === setEntry!.set ? { ...h, rallies } : h,
              ),
            },
          };
        }),

      finishRally: (winner) =>
        set((state) => {
          if (!state.currentMatch) return state;
          const history = [...state.currentMatch.history];
          const setEntry = history.find(
            (h) => h.set === state.currentMatch!.score.currentSet,
          );
          if (!setEntry) return state;
          const rallies = [...setEntry.rallies];
          const lastRally = rallies[rallies.length - 1];
          if (!lastRally || lastRally.winner) return state; // ya cerrado o inexistente

          lastRally.winner = winner;
          rallies[rallies.length - 1] = lastRally;

          return {
            currentMatch: {
              ...state.currentMatch,
              score: {
                ...state.currentMatch.score,
                pointsA:
                  winner === "A"
                    ? state.currentMatch.score.pointsA + 1
                    : state.currentMatch.score.pointsA,
                pointsB:
                  winner === "B"
                    ? state.currentMatch.score.pointsB + 1
                    : state.currentMatch.score.pointsB,
              },
              history: history.map((h) =>
                h.set === setEntry!.set ? { ...h, rallies } : h,
              ),
            },
          };
        }),

      clearCurrentRally: () =>
        set((state) => {
          if (!state.currentMatch) return state;
          const history = [...state.currentMatch.history];
          const setEntry = history.find(
            (h) => h.set === state.currentMatch!.score.currentSet,
          );
          if (!setEntry) return state;
          const rallies = [...setEntry.rallies];
          const lastRally = rallies[rallies.length - 1];
          if (lastRally && !lastRally.winner) {
            rallies.pop(); // borra el rally en construcción
          }
          setEntry.rallies = rallies;
          return {
            currentMatch: {
              ...state.currentMatch,
              history: history.map((h) =>
                h.set === setEntry!.set ? { ...h, rallies } : h,
              ),
            },
          };
        }),

      // --- Gestión de partidos guardados ---
      saveCurrentMatch: (status) =>
        set((state) => {
          if (!state.currentMatch) return state;
          const matchToSave: Match = {
            ...state.currentMatch,
            status,
          };
          return {
            savedMatches: [...state.savedMatches, matchToSave],
            currentMatch: null,
          };
        }),

      loadMatch: (matchId) =>
        set((state) => {
          const match = state.savedMatches.find((m) => m.id === matchId);
          if (!match) return state;
          return {
            currentMatch: { ...match, status: "in_progress" },
            savedMatches: state.savedMatches.filter((m) => m.id !== matchId),
          };
        }),

      deleteMatch: (matchId) =>
        set((state) => ({
          savedMatches: state.savedMatches.filter((m) => m.id !== matchId),
        })),
    }),
    {
      name: "match-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        savedMatches: state.savedMatches,
      }),
    },
  ),
);
