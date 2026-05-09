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

  const [mustSwitchSide, setMustSwitchSide] = useState(false);
  const [windA, setWindA] = useState('VIENTO A FAVOR');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  

  // Añadir esta función en useScoutingLogic
  const editRallyAction = (index: number) => {
    const actionToEdit = currentRally[index];
    
    // 1. Guardamos el índice para saber dónde devolverla después
    setEditingIndex(index);
  
    // 2. Quitamos la acción del array temporalmente
    const newRally = [...currentRally];
    newRally.splice(index, 1);
    setCurrentRally(newRally);
  
    // 3. Restaurar el estado para editarla
    setSelectedPlayerId(actionToEdit.playerId);
    setPendingAction({
      playerId: actionToEdit.playerId,
      category: actionToEdit.category,
      subAction: actionToEdit.subAction,
      value: undefined, 
      origin: actionToEdit.origin, // Cambiado de 'from' a 'origin' para consistencia
      destination: actionToEdit.destination // Cambiado de 'to' a 'destination'
    });
  };

  // --- LÓGICA DE AMBIENTE ---
  const swapWindDirection = (currentWind: string) => {
    return currentWind === 'VIENTO A FAVOR' ? 'VIENTO EN CONTRA' : 'VIENTO A FAVOR';
  };

  const toggleWind = () => {
    setWindA(prev => (prev === 'VIENTO A FAVOR' ? 'VIENTO EN CONTRA' : 'VIENTO A FAVOR'));
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
  
      // Detectamos el viento del equipo que está actuando
  const teamLetter = pendingAction.playerId.split('-')[0]; // 'A' o 'B'
  const actionWind = teamLetter === 'A' ? windA : (windA === 'VIENTO A FAVOR' ? 'VIENTO EN CONTRA' : 'VIENTO A FAVOR');

    const finalAction = {
      ...pendingAction,
      origin,
      destination,
      wind: actionWind,
      timestamp: new Date().toISOString()
    };
  
    setCurrentRally(prev => {
      const newRally = [...prev];
      
      if (editingIndex !== null) {
        // SI ESTÁBAMOS EDITANDO: Insertar en la posición original
        newRally.splice(editingIndex, 0, finalAction);
      } else {
        // SI ES NUEVA: Al final del array
        newRally.push(finalAction);
      }
      
      return newRally;
    });
  
    // IMPORTANTE: Limpiar TODO para la siguiente acción
    setPendingAction(null);
    setSelectedPlayerId(null);
    setEditingIndex(null); // <--- Resetear el índice de edición
  };

  const commitPoint = (teamWhoWon: 'A' | 'B') => {
    let newScoreA = scoreA;
    let newScoreB = scoreB;
  
    // 1. Sumar el punto al estado local para calcular el fin de set
    if (teamWhoWon === 'A') {
      newScoreA = scoreA + 1;
      setScoreA(newScoreA);
    } else {
      newScoreB = scoreB + 1;
      setScoreB(newScoreB);
    }
  
    // 2. Lógica de cierre de SET (Reglas: 21 puntos sets 1-2, 15 puntos set 3)
    const pointsToWin = currentSet <= 2 ? 21 : 15;
    const leadingScore = teamWhoWon === 'A' ? newScoreA : newScoreB;
    const trailingScore = teamWhoWon === 'A' ? newScoreB : newScoreA;
  
    // Se gana si llegas al puntaje Y hay diferencia de 2
    if (leadingScore >= pointsToWin && (leadingScore - trailingScore) >= 2) {
      if (teamWhoWon === 'A') setSetsA(prev => prev + 1);
      else setSetsB(prev => prev + 1);
  
      // Resetear puntos y pasar al siguiente set
      setScoreA(0);
      setScoreB(0);
      setCurrentSet(prev => prev + 1);
    }
  
    clearRally();
  };

  const clearRally = () => {
    setCurrentRally([]);
    setPendingAction(null);
    setSelectedPlayerId(null);
    setEditingIndex(null);
  };

  // 1. Modificamos canPerformAction para que detecte el contexto de edición
const canPerformAction = (cat: string) => {
  // Los errores siempre están permitidos (válvula de escape)
  if (cat.startsWith('ERRORES')) return true;

  let context: string;

  if (editingIndex !== null) {
    // CASO EDICIÓN: El contexto es lo que pasó justo ANTES de la acción que edito
    if (editingIndex === 0) {
      context = 'START';
    } else {
      // Miramos la categoría de la acción anterior en el rally
      context = currentRally[editingIndex - 1]?.category || 'START';
    }
  } else {
    // CASO NORMAL: El contexto es la última acción grabada en el rally
    if (currentRally.length === 0) {
      context = 'START';
    } else {
      context = currentRally[currentRally.length - 1].category;
    }
  }

  const allowedActions = ACTION_FLOW[context];
  
  // Si por alguna razón el contexto no existe en el flujo (ej. START), 
  // permitimos SERVICIO por defecto.
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
    toggleWind,
    editRallyAction
  };
};