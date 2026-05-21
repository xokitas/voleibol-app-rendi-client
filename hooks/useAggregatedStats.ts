// hooks/useAggregatedStats.ts
import { useMemo } from "react";
import { type Match, type RallyAction } from "../src/store/useMatchStore";

interface AggregationFilters {
  playerName?: string; // nombre completo, ej. "Juan Pérez"
  tournament?: string; // nombre del torneo (opcional)
  category?: string; // categoría (opcional)
  // pueden añadirse más filtros en el futuro
}

export const useAggregatedStats = (
  savedMatches: Match[],
  filters: AggregationFilters,
) => {
  const aggregatedActions = useMemo(() => {
    let actions: RallyAction[] = [];

    // Filtrar partidos por torneo y categoría si se especifican
    let filteredMatches = savedMatches.filter((m) => {
      if (filters.tournament && m.config.tournament !== filters.tournament)
        return false;
      if (filters.category && m.config.category !== filters.category)
        return false;
      return true;
    });

    // Si no se pide jugador, devolvemos vacío (o podríamos sumar todo, pero lo dejamos para después)
    if (!filters.playerName) return actions;

    // Para cada partido, encontrar al jugador y extraer sus acciones
    filteredMatches.forEach((match) => {
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

      // Extraer todas las acciones de este jugador en todos los rallies
      match.history.forEach((set) => {
        set.rallies.forEach((rally) => {
          const playerActions = rally.actions.filter(
            (a) => a.playerId === playerTeamId,
          );
          actions.push(...playerActions);
        });
      });
    });

    return actions;
  }, [savedMatches, filters]);

  return { aggregatedActions };
};
