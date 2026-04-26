import { useEffect, useState } from 'react';

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
  // --- ESTADOS DE PUNTUACIÓN ---
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [setsA, setSetsA] = useState(0);
  const [setsB, setSetsB] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  
  // --- ESTADOS DE FLUJO (NUEVOS) ---
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<{
    category: string;
    subAction: string;
    playerId: string;
    value?: number;
  } | null>(null);

  const [currentRally, setCurrentRally] = useState<any[]>([]);
  const [lastActionType, setLastActionType] = useState<string>('START');
  const [mustSwitchSide, setMustSwitchSide] = useState(false);
  const [windA, setWindA] = useState('CALMA');

  // Lógica de viento y cambio de lado (se mantiene igual)
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

  // --- FUNCIONES DE ACCIÓN ---
  
  const handlePlayerSelect = (id: string) => {
    setSelectedPlayerId(id);
  };

  const handleActionClick = (category: string, subAction: string) => {
    if (!selectedPlayerId) return; // No hacemos nada si no hay jugador
    
    setPendingAction({
      category,
      subAction,
      playerId: selectedPlayerId
    });
  };

  const confirmActionValue = (value: number) => {
    if (!pendingAction) return;

    const newAction = {
      ...pendingAction,
      value,
      timestamp: new Date().toISOString()
    };

    setCurrentRally(prev => [...prev, newAction]);
    setLastActionType(pendingAction.category);
    
    // Limpiamos la selección para el siguiente paso
    setPendingAction(null);
    setSelectedPlayerId(null);
  };

  const commitPoint = (teamWhoWon: 'A' | 'B') => {
    // ... tu lógica de puntos se mantiene igual ...
    clearRally();
  };

  const clearRally = () => {
    setCurrentRally([]);
    setLastActionType('START');
    setPendingAction(null);
    setSelectedPlayerId(null);
  };

  const canPerformAction = (cat: string) => {
    const allowedActions = ACTION_FLOW[lastActionType];
    if (!allowedActions) return cat === 'SERVICIO' || cat === 'ERRORES';
    return allowedActions.includes(cat);
  };

  return {
    score: { A: scoreA, B: scoreB },
    sets: { A: setsA, B: setsB },
    wind: { A: windA, B: swapWindDirection(windA) },
    currentSet,
    currentRally,
    mustSwitchSide,
    selectedPlayerId,    // Exportamos esto
    pendingAction,       // Exportamos esto
    canPerformAction,
    handlePlayerSelect,  // Exportamos esto
    handleActionClick,   // Exportamos esto
    confirmActionValue,  // Exportamos esto
    commitPoint,
    clearRally,
    setWindA
  };
};