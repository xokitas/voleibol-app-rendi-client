import { useEffect, useState } from 'react';

// Definimos la jerarquía de acciones (Máquina de Estados)
const ACTION_FLOW: Record<string, string[]> = {
  START: ['SERVICIO', 'ERRORES'],
  SERVICIO: ['RECEPCION', 'DEFENSA', 'ERRORES'],
  RECEPCION: ['ACOMODADA', 'ERRORES'],
  DEFENSA: ['ACOMODADA', 'ERRORES'],
  ACOMODADA: ['ATAQUE', 'ERRORES'],
  ATAQUE: ['BLOQUEO', 'DEFENSA', 'ERRORES'],
  BLOQUEO: ['ACOMODADA', 'DEFENSA', 'ERRORES'], // Añadido: después de bloquear puedes defender o acomodar
};

export const useScoutingLogic = () => {
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [setsA, setSetsA] = useState(0);
  const [setsB, setSetsB] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  
  const [currentRally, setCurrentRally] = useState<any[]>([]);
  const [lastActionType, setLastActionType] = useState<string>('START');
  const [mustSwitchSide, setMustSwitchSide] = useState(false);

  // --- LÓGICA DE VIENTO ---
  // Guardamos el estado del viento del Equipo A. El de B será siempre el opuesto.
  // Valores: 'A FAVOR', 'EN CONTRA', 'LATERAL', 'CALMA'
  const [windA, setWindA] = useState('CALMA');

  /**
   * Función para invertir el viento cuando cambian de lado
   */
  const swapWindDirection = (currentWind: string) => {
    if (currentWind === 'A FAVOR') return 'EN CONTRA';
    if (currentWind === 'EN CONTRA') return 'A FAVOR';
    return currentWind; // LATERAL o CALMA no cambian al rotar 180 grados
  };

  // --- LÓGICA DE CAMBIO DE CANCHA ---
  useEffect(() => {
    const totalPoints = scoreA + scoreB;
    const switchInterval = currentSet <= 2 ? 7 : 5; 
    
    // Si el total de puntos es múltiplo de 7 (o 5 en tie-break), hay cambio
    if (totalPoints > 0 && totalPoints % switchInterval === 0) {
      setMustSwitchSide(true);
      // Actualizamos el viento automáticamente al detectar el cambio de lado
      setWindA(prev => swapWindDirection(prev));
    } else {
      setMustSwitchSide(false);
    }
  }, [scoreA, scoreB, currentSet]);

  /**
   * Finaliza el punto y verifica si el set ha terminado
   */
  const commitPoint = (teamWhoWon: 'A' | 'B') => {
    let newScoreA = scoreA;
    let newScoreB = scoreB;

    if (teamWhoWon === 'A') newScoreA++;
    else newScoreB++;

    const pointsToWin = currentSet <= 2 ? 21 : 15;
    const diff = Math.abs(newScoreA - newScoreB);

    if ((newScoreA >= pointsToWin || newScoreB >= pointsToWin) && diff >= 2) {
      if (newScoreA > newScoreB) setSetsA(prev => prev + 1);
      else setSetsB(prev => prev + 1);

      setScoreA(0);
      setScoreB(0);
      setCurrentSet(prev => prev + 1);
      setWindA('CALMA'); // Resetear viento al iniciar set nuevo
    } else {
      setScoreA(newScoreA);
      setScoreB(newScoreB);
    }

    clearRally();
  };

  const clearRally = () => {
    setCurrentRally([]);
    setLastActionType('START');
  };

  const addActionToRally = (action: any) => {
    setCurrentRally(prev => [...prev, action]);
    setLastActionType(action.category);
  };

  // Calculamos el viento del equipo B basándonos en el de A
  const windB = swapWindDirection(windA);

  return {
    score: { A: scoreA, B: scoreB },
    sets: { A: setsA, B: setsB },
    wind: { A: windA, B: windB }, // Enviamos ambos vientos a la UI
    currentSet,
    currentRally,
    mustSwitchSide,
    canPerformAction: (cat: string) => ACTION_FLOW[lastActionType].includes(cat),
    addActionToRally,
    commitPoint,
    clearRally,
    setWindA // Permite al usuario cambiar el viento inicial manualmente
  };
};