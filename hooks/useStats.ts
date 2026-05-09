import { useMemo } from 'react';

export const useStats = (allRallies: any[]) => {
  const allActions = useMemo(() => {
    return allRallies.flatMap(rally => rally.actions || []);
  }, [allRallies]);

  const getPlayerStats = (playerId: string) => {
    const playerActions = allActions.filter(a => a.playerId === playerId);

    if (playerActions.length === 0) return null;

    // Nueva lógica: (Positivos[3,4] - Negativos[0]) / Total
    const calculateEff = (actions: any[]) => {
      if (actions.length === 0) return 0;
      const positives = actions.filter(a => a.value === 4 || a.value === 3).length;
      const negatives = actions.filter(a => a.value === 0).length;
      
      const eff = ((positives - negatives) / actions.length) * 100;
      return parseFloat(eff.toFixed(1)); // Retornar con un decimal
    };

    const attacks = playerActions.filter(a => a.category === 'ATAQUE');
    const serves = playerActions.filter(a => a.category === 'SERVICIO');
    const receives = playerActions.filter(a => a.category === 'RECEPCION');
    const defenses = playerActions.filter(a => a.category === 'DEFENSA');

    return {
      general: {
        efficiency: calculateEff(playerActions),
        totalActions: playerActions.length,
        errors: playerActions.filter(a => a.category.startsWith('ERRORES')).length
      },
      attack: {
        eff: calculateEff(attacks),
        count: attacks.length,
      },
      serve: {
        eff: calculateEff(serves),
        count: serves.length
      },
      receive: { // Mapeado a 'reception' en la UI si prefieres, pero aquí lo llamamos 'receive'
        eff: calculateEff(receives),
        count: receives.length
      },
      defense: {
        eff: calculateEff(defenses),
        count: defenses.length
      }
    };
  };

  return { getPlayerStats, allActions };
};