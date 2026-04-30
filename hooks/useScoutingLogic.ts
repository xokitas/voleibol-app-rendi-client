import { useEffect, useState } from 'react';

// Flujo lógico de acciones para habilitar/deshabilitar botones en la UI
const ACTION_FLOW: Record<string, string[]> = {
  START: ['SERVICIO', 'ERRORES_SERV', 'ERRORES_COM', 'ERRORES_POS', 'ERRORES_TEC'],
  SERVICIO: ['RECEPCION', 'DEFENSA', 'ERRORES_COM', 'ERRORES_POS', 'ERRORES_TEC'],
  RECEPCION: ['ACOMODADA', 'ERRORES_COM', 'ERRORES_POS', 'ERRORES_TEC'],
  DEFENSA: ['ACOMODADA', 'ERRORES_COM', 'ERRORES_POS', 'ERRORES_TEC'],
  ACOMODADA: ['ATAQUE', 'ERRORES_COM', 'ERRORES_POS', 'ERRORES_TEC'],
  ATAQUE: ['BLOQUEO', 'DEFENSA', 'ERRORES_COM', 'ERRORES_POS', 'ERRORES_TEC'],
  BLOQUEO: ['ACOMODADA', 'DEFENSA', 'ERRORES_COM', 'ERRORES_POS', 'ERRORES_TEC'],
};

export const useScoutingLogic = () => {
  // --- ESTADOS DE PUNTUACIÓN ---
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [setsA, setSetsA] = useState(0);
  const [setsB, setSetsB] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  
  // --- ESTADOS DE FLUJO ---
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<{
    category: string;
    subAction: string;
    playerId: string;
    value?: number;
    origin?: string;
    destination?: string;
  } | null>(null);

  const [currentRally, setCurrentRally] = useState<any[]>([]);
  const [lastActionType, setLastActionType] = useState<string>('START');
  const [mustSwitchSide, setMustSwitchSide] = useState(false);
  const [windA, setWindA] = useState('A FAVOR');

  // --- LÓGICA DE AMBIENTE ---
  const swapWindDirection = (currentWind: string) => {
    return currentWind === 'A FAVOR' ? 'EN CONTRA' : 'A FAVOR';
  };

  const toggleWind = () => {
    setWindA(prev => (prev === 'A FAVOR' ? 'EN CONTRA' : 'A FAVOR'));
  };

  // Cambio de lado automático cada 7 puntos (Sets 1 y 2) o 5 puntos (Set 3)
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

  // --- FUNCIONES DE CONTROL ---
  
  const handlePlayerSelect = (id: string) => {
    setSelectedPlayerId(id);
  };

  const handleActionClick = (category: string, subAction: string) => {
    if (!selectedPlayerId) return;
    
    setPendingAction({
      category,
      subAction,
      playerId: selectedPlayerId
    });
  };

  const confirmActionValue = (value: number) => {
    if (!pendingAction) return;

    setPendingAction(prev => (prev ? { ...prev, value } : null));
    // No guardamos en el rally todavía, esperamos por las zonas en la UI
  };

  // PASO FINAL: Se llama desde la cancha cuando se marca el destino
  const updatePendingZones = (origin: string, destination: string) => {
    if (!pendingAction || pendingAction.value === undefined) return;

    const finalAction = {
      ...pendingAction,
      origin,
      destination,
      timestamp: new Date().toISOString()
    };

    setCurrentRally(prev => [...prev, finalAction]);
    setLastActionType(pendingAction.category);
    
    // Reset para la siguiente acción del rally
    setPendingAction(null);
    setSelectedPlayerId(null);
  };

  const commitPoint = (teamWhoWon: 'A' | 'B') => {
    if (teamWhoWon === 'A') setScoreA(prev => prev + 1);
    else setScoreB(prev => prev + 1);
    
    clearRally();
  };

  const clearRally = () => {
    setCurrentRally([]);
    setLastActionType('START');
    setPendingAction(null);
    setSelectedPlayerId(null);
  };

  const canPerformAction = (cat: string) => {
    // Si es un error, siempre está permitido
    if (cat.startsWith('ERRORES')) return true;
    
    const allowedActions = ACTION_FLOW[lastActionType];
    if (!allowedActions) return cat === 'SERVICIO';
    return allowedActions.includes(cat);
  };

  return {
    score: { A: scoreA, B: scoreB },
    sets: { A: setsA, B: setsB },
    wind: { A: windA, B: swapWindDirection(windA) },
    currentSet,
    currentRally,
    mustSwitchSide,
    selectedPlayerId,
    pendingAction,
    canPerformAction,
    handlePlayerSelect,
    handleActionClick,
    confirmActionValue,
    updatePendingZones, // Función clave para cerrar el scouting
    commitPoint,
    clearRally,
    toggleWind
  };
};