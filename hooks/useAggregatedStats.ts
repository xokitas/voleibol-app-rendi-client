// hooks/useAggregatedStats.ts
import { useMemo } from "react";
import { type Match, type RallyAction } from "../src/store/useMatchStore";

export interface AggregationFilters {
  playerName?: string;
  teamName?: string;
  denomination?: string; // antes tournament
  category?: string;
  eventType?: string;
  place?: string;
  meso?: string;
  micro?: string;
  gender?: string;
}

export const useAggregatedStats = (
  savedMatches: Match[],
  filters: AggregationFilters,
) => {
  const aggregatedActions = useMemo(() => {
    let actions: RallyAction[] = [];

    // 1. Filtrar partidos por metadatos (AND acumulativo)
    let filteredMatches = savedMatches.filter((m) => {
      if (
        filters.denomination &&
        m.config.denomination !== filters.denomination
      )
        return false;
      if (filters.category && m.config.category !== filters.category)
        return false;
      if (filters.eventType && m.config.eventType !== filters.eventType)
        return false;
      if (filters.place && m.config.place !== filters.place) return false;
      if (filters.meso && m.config.meso !== filters.meso) return false;
      if (filters.micro && m.config.micro !== filters.micro) return false;
      if (filters.gender && m.config.gender !== filters.gender) return false;
      return true;
    });

    // 2. Si no hay filtro de jugador ni equipo, devolver vacío
    if (!filters.playerName && !filters.teamName) return actions;

    // 3. Para cada partido, extraer acciones según los filtros de jugador/equipo
    filteredMatches.forEach((match) => {
      // Determinar si el equipo coincide (si se filtró por equipo)
      let teamPrefix: string | null = null;
      if (filters.teamName) {
        if (match.config.teamA.name === filters.teamName) {
          teamPrefix = "A";
        } else if (match.config.teamB.name === filters.teamName) {
          teamPrefix = "B";
        } else {
          return; // el equipo no jugó este partido
        }
      }

      // Si solo se filtró por equipo (sin jugador), extraer todas las acciones del equipo
      if (filters.teamName && !filters.playerName) {
        match.history.forEach((set) => {
          set.rallies.forEach((rally) => {
            const teamActions = rally.actions.filter((a) =>
              a.playerId.startsWith(teamPrefix!),
            );
            actions.push(...teamActions);
          });
        });
        return;
      }

      // Si se filtró por jugador (con o sin equipo)
      if (filters.playerName) {
        let playerTeamId: string | null = null;

        // Buscar en equipo A
        const playerA = match.config.teamA.players.find(
          (p) => p.fullName === filters.playerName,
        );
        if (playerA) {
          playerTeamId = `A-${playerA.number}`;
        }

        // Buscar en equipo B (si no estaba en A)
        if (!playerTeamId) {
          const playerB = match.config.teamB.players.find(
            (p) => p.fullName === filters.playerName,
          );
          if (playerB) {
            playerTeamId = `B-${playerB.number}`;
          }
        }

        // Si no jugó en este partido, continuar
        if (!playerTeamId) return;

        // Si también se filtró por equipo, verificar que el jugador esté en ese equipo
        if (
          filters.teamName &&
          teamPrefix &&
          !playerTeamId.startsWith(teamPrefix)
        ) {
          return;
        }

        // Extraer acciones del jugador
        match.history.forEach((set) => {
          set.rallies.forEach((rally) => {
            const playerActions = rally.actions.filter(
              (a) => a.playerId === playerTeamId,
            );
            actions.push(...playerActions);
          });
        });
      }
    });

    return actions;
  }, [savedMatches, filters]);

  return { aggregatedActions };
};
