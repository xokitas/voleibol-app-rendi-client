import { useMemo } from "react";

interface AllowedValuesMap {
  [subAction: string]: number[];
}

export const useStats = (
  allRallies: any[],
  allowedValues?: AllowedValuesMap,
) => {
  const allActions = useMemo(() => {
    return allRallies.flatMap((rally) => rally.actions || []);
  }, [allRallies]);

  const getMaxValue = (subAction: string): number => {
    if (allowedValues && allowedValues[subAction]) {
      return Math.max(...allowedValues[subAction]);
    }
    return 4; // valor por defecto si no se proporciona el mapa
  };

  const calculateEff = (actions: any[]) => {
    if (actions.length === 0) return 0;
    let positives = 0;
    let negatives = 0;
    actions.forEach((a) => {
      const maxVal = getMaxValue(a.subAction);
      if (a.value === maxVal) positives++;
      else if (a.value === 0) negatives++;
    });
    const eff = ((positives - negatives) / actions.length) * 100;
    return parseFloat(eff.toFixed(1));
  };

  const getPlayerStats = (playerId: string) => {
    const playerActions = allActions.filter((a) => a.playerId === playerId);

    // Si no hay acciones, devolvemos un objeto con todo en cero
    if (playerActions.length === 0) {
      return {
        general: { efficiency: 0, totalActions: 0, errors: 0 },
        serve: { eff: 0, count: 0 },
        receive: { eff: 0, count: 0 },
        set: { eff: 0, count: 0 },
        attack: { eff: 0, count: 0 },
        block: { eff: 0, count: 0 },
        defense: { eff: 0, count: 0 },
      };
    }

    // Cálculo normal (igual que antes)
    const serves = playerActions.filter((a) => a.category === "SERVICIO");
    const receives = playerActions.filter((a) => a.category === "RECEPCION");
    const sets = playerActions.filter((a) => a.category === "ACOMODADA");
    const attacks = playerActions.filter((a) => a.category === "ATAQUE");
    const blocks = playerActions.filter((a) => a.category === "BLOQUEO");
    const defenses = playerActions.filter((a) => a.category === "DEFENSA");
    const errors = playerActions.filter((a) =>
      a.category.startsWith("ERRORES"),
    );

    return {
      general: {
        efficiency: calculateEff(playerActions),
        totalActions: playerActions.length,
        errors: errors.length,
      },
      serve: { eff: calculateEff(serves), count: serves.length },
      receive: { eff: calculateEff(receives), count: receives.length },
      set: { eff: calculateEff(sets), count: sets.length },
      attack: { eff: calculateEff(attacks), count: attacks.length },
      block: { eff: calculateEff(blocks), count: blocks.length },
      defense: { eff: calculateEff(defenses), count: defenses.length },
    };
  };

  return { getPlayerStats, allActions };
};
