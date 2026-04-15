import { useEffect, useState } from 'react';

// Definimos la jerarquía de acciones (Máquina de Estados)
const ACTION_FLOW: Record<string, string[]> = {
  START: ['SERVICIO', 'ERRORES'],
  SERVICIO: ['RECEPCION', 'DEFENSA', 'ERRORES'],
  RECEPCION: ['ACOMODADA', 'ERRORES'],
  DEFENSA: ['ACOMODADA', 'ERRORES'],
  ACOMODADA: ['ATAQUE', 'ERRORES'],
  ATAQUE: ['BLOQUEO', 'DEFENSA', 'ERRORES'],
  BLOQUEO: ['ACOMODADA', 'DEFENSA', 'ERRORES'],
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
  const [windA, setWindA] = useState('CALMA');

  const swapWindDirection = (currentWind: string) => {
    if (currentWind === 'A FAVOR') return 'EN CONTRA';
    if (currentWind === 'EN CONTRA') return 'A FAVOR';
    return currentWind;
  };

  useEffect(() => {
    const totalPoints = scoreA + scoreB;
    const switchInterval = currentSet <= 2 ? 7 : 5; 
    
    if (totalPoints > 0 && totalPoints % switchInterval === 0) {
      setMustSwitchSide(true);
      setWindA(prev => swapWindDirection(prev));
    } else {
      setMustSwitchSide(false);
    }
  }, [scoreA, scoreB, currentSet]);

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
      setWindA('CALMA');
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

  const windB = swapWindDirection(windA);

  // --- EL CAMBIO ESTÁ AQUÍ ---
  const canPerformAction = (cat: string) => {
    const allowedActions = ACTION_FLOW[lastActionType];
    
    // Si la acción previa no existe en el flujo, por seguridad permitimos SERVICIO o ERRORES
    if (!allowedActions) {
      return cat === 'SERVICIO' || cat === 'ERRORES';
    }

    return allowedActions.includes(cat);
  };

  return {
    score: { A: scoreA, B: scoreB },
    sets: { A: setsA, B: setsB },
    wind: { A: windA, B: windB },
    currentSet,
    currentRally,
    mustSwitchSide,
    canPerformAction, // Ahora usamos la función blindada
    addActionToRally,
    commitPoint,
    clearRally,
    setWindA
  };
};