// src/store/useMatchStore.ts
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { useAuthStore } from "./useAuthStore";

// ----------------------------------------------------------------
// 1. Tipos
// ----------------------------------------------------------------

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

export interface RallyEntry {
  winner?: "A" | "B";
  scoreAtTheTime: { A: number; B: number };
  actions: RallyAction[];
}

export interface MatchRules {
  pointsToWinSet: number;
  pointsToWinLastSet: number;
  minDifference: number;
  maxSets: number;
  switchIntervalNormal: number;
  switchIntervalLast: number;
  hasTimeLimit: boolean;
  timeLimitMinutes?: number;
}

export interface MatchConfig {
  tournament: string;
  category: string;
  date: string;
  matchNumber: number;
  gender: "M" | "F";
  eventType: string;
  startTime?: string;
  place?: string;
  denomination?: string;
  meso?: string;
  micro?: string;
  weekDay?: string;
  microNumber?: string;
  objective?: string;
  teamA: { name: string; players: { number: string; fullName: string }[] };
  teamB: { name: string; players: { number: string; fullName: string }[] };
  platform?: "web" | "mobile";
  rules?: MatchRules;
  createdBy?: string;
}

export interface Match {
  id: string;
  serverId?: number;
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
  currentMatch: Match | null;
  savedMatches: Match[];

  setInitialMatchData: (config: MatchConfig) => string;
  clearCurrentMatch: () => void;

  incrementPointsA: () => void;
  incrementPointsB: () => void;
  setPointsA: (points: number) => void;
  setPointsB: (points: number) => void;
  incrementSetsA: () => void;
  incrementSetsB: () => void;
  setCurrentSet: (set: number) => void;

  addRallyAction: (action: RallyAction, index?: number) => void;
  finishRally: (winner: "A" | "B") => void;
  clearCurrentRally: () => void;

  saveCurrentMatch: (status: "partial" | "finished") => void;
  loadMatch: (matchId: string) => void;
  deleteMatch: (matchId: string) => void;

  syncMatchToServer: (match: Match) => Promise<void>;
  fetchMatchesFromServer: () => Promise<void>; // ← nueva acción
}

// ----------------------------------------------------------------
// 3. Implementación
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

const refreshAccessToken = async (): Promise<boolean> => {
  const { refreshToken } = useAuthStore.getState();
  if (!refreshToken) return false;
  try {
    const res = await fetch("http://127.0.0.1:8000/api/token/refresh/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: refreshToken }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    useAuthStore.setState({ token: data.access });
    return true;
  } catch {
    return false;
  }
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

          let rallies = [...setEntry.rallies];
          let rallyInProgress = rallies[rallies.length - 1];
          if (!rallyInProgress || rallyInProgress.winner) {
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
          if (!lastRally || lastRally.winner) return state;

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
            rallies.pop();
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
          get().syncMatchToServer(matchToSave);
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

      // --- Sincronización con el servidor ---
      syncMatchToServer: async (match: Match) => {
        const refreshed = await refreshAccessToken();
        if (!refreshed) {
          console.error("No se pudo renovar el token");
          return;
        }
        const token = useAuthStore.getState().token;
        if (!token) return;

        const url = match.serverId
          ? `http://127.0.0.1:8000/api/matches/${match.serverId}/`
          : "http://127.0.0.1:8000/api/matches/";
        const method = match.serverId ? "PUT" : "POST";

        const response = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(match),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error("Error al sincronizar:", errorData);
          return;
        }

        const savedMatch = await response.json();
        set((state) => ({
          savedMatches: state.savedMatches.map((m) =>
            m.id === match.id ? { ...m, serverId: savedMatch.id } : m,
          ),
        }));
      },

      fetchMatchesFromServer: async () => {
        const token = useAuthStore.getState().token;
        if (!token) return;

        const tryFetch = async (authToken: string) => {
          const res = await fetch("http://127.0.0.1:8000/api/user-matches/", {
            headers: { Authorization: `Bearer ${authToken}` },
          });
          if (res.status === 401) {
            const refreshed = await refreshAccessToken();
            if (!refreshed) return [];
            const newToken = useAuthStore.getState().token;
            if (!newToken) return [];
            const retryRes = await fetch(
              "http://127.0.0.1:8000/api/user-matches/",
              {
                headers: { Authorization: `Bearer ${newToken}` },
              },
            );
            if (!retryRes.ok) return [];
            return retryRes.json();
          }
          if (!res.ok) return [];
          return res.json();
        };

        const serverMatches = await tryFetch(token);
        if (!Array.isArray(serverMatches)) return;

        const localSaved = get().savedMatches;

        const remoteMatches: Match[] = serverMatches.map((m: any) => ({
          id: m.id.toString(),
          serverId: m.id,
          status: m.status === "IN_PROGRESS" ? "partial" : "finished",
          config: m.config,
          score: m.score,
          history: m.history,
          totalTimeSeconds: m.totalTimeSeconds,
          realTimeSeconds: m.realTimeSeconds,
        }));

        const newMatches = remoteMatches.filter(
          (rm) => !localSaved.some((lm) => lm.serverId === rm.serverId),
        );

        if (newMatches.length > 0) {
          set((state) => ({
            savedMatches: [...state.savedMatches, ...newMatches],
          }));
        }
      },
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
