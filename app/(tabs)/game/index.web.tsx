import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import HeaderMenu from '../../../components/HeaderMenu';
import ReferencePanel from '../../../components/ReferencePanel';
import { useGameTimers } from '../../../hooks/useGameTimers';
import { useScoutingLogic } from '../../../hooks/useScoutingLogic';
import tw from '../../../lib/tailwind';

// --- COMPONENTES AUXILIARES ---

const categoryColors: Record<string, string> = {
  SERVICIO: 'bg-[#93c5fd]',     
  RECEPCION: 'bg-[#86efac]',    
  ACOMODADA: 'bg-[#fbcfe8]',    
  ATAQUE: 'bg-[#fde047]',       
  BLOQUEO: 'bg-[#c084fc]',      
  DEFENSA: 'bg-[#166534]',      
  ERRORES_SERV: 'bg-[#4b5563]', 
  ERRORES_COM: 'bg-[#4b5563]',  
  ERRORES_POS: 'bg-[#4b5563]',  
  ERRORES_TEC: 'bg-[#4b5563]',  
};

const CourtZone = ({ id, displayLabel, active, onPress, isSelected }: {
  id: string; 
  displayLabel: string; 
  active: boolean;
  onPress: () => void;
  isSelected: boolean;
}) => (
  <TouchableOpacity
    onPress={onPress}
    style={tw`flex-1 m-[1px] rounded-md border justify-center items-center ${
      isSelected ? 'border-yellow-400 bg-yellow-400/20' :
      active ? 'border-slate-700 bg-slate-800' : 'border-slate-800/40 bg-slate-900/10'
    }`}
  >
    {isSelected && (
      <View style={tw`absolute inset-0 bg-yellow-400/20 animate-pulse rounded-md`} />
    )}
    <Text style={tw`text-[9px] font-bold ${isSelected ? 'text-yellow-400' : 'text-slate-500'}`}>
      {displayLabel}
    </Text>
  </TouchableOpacity>
);

// --- MAPA DE VALORES PERMITIDOS SEGÚN LA LEYENDA ---
// Ajusta los arrays con los números que permite cada acción.
// Si una acción no está aquí, asumiremos por defecto [0, 1, 2, 3, 4]
const actionAllowedValues: Record<string, number[]> = {
  // Errores (Todos valen 0)
  'SFC': [0], 'SR': [0], 'SME': [0],
  'CI': [0], 'MC': [0],
  'NAT': [0], 'CJR': [0], 'MCA': [0], 'JFZ': [0],
  'GMD': [0], 'TI': [0], 'MER': [0], 'BTR': [0],
  
  'Bn': [0, 1, 2, 3],
  '2ma': [0, 1, 2, 3],
  'Ppm': [0, 1, 2, 3],
  'P2a': [0, 1, 2, 3], // Ejemplo: Acomodada vendida = 0, y pases hasta 3
  'P2b': [0, 1, 2, 3],
  'Dd': [0, 1, 2, 3],
  'Dltd': [0, 1, 2, 3],

  'Rca': [4],
  'Ub': [4],
  'Acd': [4],
  'Rdjn': [4],
  'Rdpmp': [4],
  'Rd': [4],
};

export default function GameScreenWeb() {
  const router = useRouter();
  const { data } = useLocalSearchParams();
  const eventData = data ? JSON.parse(data as string) : null;
  
  const {
    score, 
    sets, 
    wind, 
    mustSwitchSide,
    canPerformAction, 
    handleActionClick,   
    confirmActionValue,  
    pendingAction,       
    selectedPlayerId,    
    handlePlayerSelect,
    commitPoint,
    currentRally,
    clearRally,
    toggleWind,
    currentSet,
    updatePendingZones,
    editRallyAction
  } = useScoutingLogic();

  const timers = useGameTimers();

  // Estados Locales
  const [isManualOpen, setIsManualOpen] = useState(false); 
  const [hoveredAction, setHoveredAction] = useState<string | null>(null);
  const [selectionStep, setSelectionStep] = useState(0); 
  const [origin, setOrigin] = useState<string | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [blink, setBlink] = useState(false);

  // --- NUEVO: ESTADO DE EDICIÓN ---
  const [isEditingMode, setIsEditingMode] = useState(false);

  // Se apaga el modo edición automáticamente cuando la acción se guarda y deja de estar pendiente
  useEffect(() => {
    if (!pendingAction) {
      setIsEditingMode(false);
    }
  }, [pendingAction]);

  // --- NUEVO: FORMATEADOR DE ZONAS (A-TD -> aTD) ---
  const formatTicketZone = (z?: string) => {
    if (!z) return 'z?';
    if (z.startsWith('A-')) return `a${z.slice(2)}`;
    if (z.startsWith('B-')) return `b${z.slice(2)}`;
    return z;
  };

  // --- NUEVOS ESTADOS PARA LA FLECHA ---
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const zoneCoords: Record<string, { x: number, y: number }> = {
    'A-TI': { x: 26, y: 40 }, 'A-TC': { x: 26, y: 120 }, 'A-TD': { x: 26, y: 200 },
    'A-DI': { x: 78, y: 40 }, 'A-DC': { x: 78, y: 120 }, 'A-DD': { x: 78, y: 200 },
    'B-DD': { x: 130, y: 40 }, 'B-DC': { x: 130, y: 120 }, 'B-DI': { x: 130, y: 200 },
    'B-TD': { x: 182, y: 40 }, 'B-TC': { x: 182, y: 120 }, 'B-TI': { x: 182, y: 200 },
  };

  const playErrorBuzzer = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sawtooth'; // Sonido rasposo tipo "buzzer"
      osc.frequency.setValueAtTime(150, ctx.currentTime); // Tono grave
      
      gain.gain.setValueAtTime(0.2, ctx.currentTime); // Volumen
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3); // Fade out rápido
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch(e) {
      console.error("Error reproduciendo sonido", e);
    }
  };

  const handleCancelSelection = (e?: any) => {
    if (e) e.preventDefault(); 
    setOrigin(null);
    setSelectionStep(0);
    console.log("Selección de cancha cancelada");
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (mustSwitchSide) {
      interval = setInterval(() => setBlink(b => !b), 500);
    } else {
      setBlink(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [mustSwitchSide]);

  useEffect(() => {
    timers.startTotalTime();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Solo actuamos si hay una acción pendiente y FALTA el valor
      if (pendingAction && pendingAction.value === undefined) {
        let val: number | null = null;
        
        // Mapeo de teclas válidas
        if (e.key === '`' || e.key === '0' || e.key === 'º') val = 0;
        else if (['1', '2', '3', '4'].includes(e.key)) val = parseInt(e.key);

        if (val !== null) {
          // VERIFICACIÓN DE LÍMITES
          const allowed = actionAllowedValues[pendingAction.subAction] || [0, 1, 2, 3, 4];
          
          if (allowed.includes(val)) {
            confirmActionValue(val); 
          } else {
            playErrorBuzzer(); // ¡BEEP DE ERROR!
            // Opcional: Mostrar un pequeño alert o toast para avisarle al usuario
            console.log(`La acción ${pendingAction.subAction} NO permite el valor ${val}. Valores permitidos: ${allowed.join(', ')}`);
          }
        } else {
          // Si presiona cualquier otra tecla alfanumérica
          if (e.key.length === 1 && /[a-zA-Z0-9]/.test(e.key)) {
            playErrorBuzzer(); 
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pendingAction, confirmActionValue]);


  const handleZoneClick = (zoneLabel: string) => {
    if (pendingAction && pendingAction.value !== undefined) {
      if (selectionStep === 0) {
        setOrigin(zoneLabel);
        setSelectionStep(1); 
      } else if (selectionStep === 1) {
        updatePendingZones(origin!, zoneLabel);
        setSelectionStep(0);
        setOrigin(null);
      }
    }
  };

  const handleAutoCommit = () => {
    if (currentRally.length === 0) return;
  
    const lastAction = currentRally[currentRally.length - 1];
    const teamOfAction = lastAction.playerId.startsWith('A') ? 'A' : 'B';
    const opponentTeam = teamOfAction === 'A' ? 'B' : 'A';
  
    // Regla según la leyenda del cliente:
    // Valor 4 = Tanto a favor (Punto para quien hizo la acción)
    // Valor 0 = Tanto en contra / Muere el balón (Punto para el rival)
    
    if (lastAction.value === 4) {
      commitPoint(teamOfAction);
    } else if (lastAction.value === 0) {
      commitPoint(opponentTeam);
    } else {
      // Para valores 1, 2, 3 (balón continúa en juego)
      // Si el usuario presiona "GUARDAR" manualmente en un balón vivo, 
      // podemos pedir confirmación o definir un comportamiento por defecto.
      const manualWinner = window.confirm("El último balón fue valor " + lastAction.value + " (sigue en juego). ¿Punto para Equipo A?") ? 'A' : 'B';
      commitPoint(manualWinner);
    }
  };

  const renderActionColumn = (title: string, category: string, subs: string[], isDouble = false) => {
    const bgColor = categoryColors[category] || 'bg-slate-800';
    const textColor = 'text-white';
    
    // AHORA: Confiamos plenamente en el canPerformAction del Hook
    const isAllowed = canPerformAction(category);
  
    return (
      <View style={tw`flex-1 min-w-[35px] ${isDouble ? 'max-w-[155px]' : 'max-w-[75px]'} ${!isAllowed ? 'opacity-20' : ''}`}>
        <Text style={tw`text-slate-500 font-black text-[9px] uppercase mb-2 text-center tracking-tighter`}>
          {title}
        </Text>
        <View style={tw`${isDouble ? 'flex-row flex-wrap justify-between' : 'flex-col'} gap-1.5`}>
          {subs.map(sub => (
            <View 
              key={sub} 
              style={isDouble ? { width: '48%' } : { width: '100%' }}
              // @ts-ignore
              onMouseEnter={() => setHoveredAction(sub)} 
              // @ts-ignore
              onMouseLeave={() => setHoveredAction(null)}
            >
              <TouchableOpacity
                onPress={() => handleActionClick(category, sub)}
                disabled={!isAllowed} // Usamos isAllowed en lugar de canPerformAction
                style={[
                  tw`py-2 rounded-lg border-b-2 items-center justify-center shadow-sm`,
                  pendingAction?.subAction === sub 
                    ? [tw`border-white scale-105`, { backgroundColor: '#ffffff' }] 
                    : [tw`border-black/10`, tw`${bgColor}`]
                ]}
              >
                <Text style={[
                  tw`font-black text-[11px] tracking-tight`,
                  pendingAction?.subAction === sub ? tw`text-black` : tw`${textColor}`
                ]}>
                  {sub}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const handleExit = (targetRoute?: string) => {
    const mensaje = "¿Deseas guardar los cambios antes de salir?";
    const deseaGuardar = window.confirm(mensaje);
  
    if (deseaGuardar) {
      const gameData = { inProgress: true, lastSaved: new Date().toISOString() };
      localStorage.setItem('rendi_active_game', JSON.stringify(gameData));
      if (typeof targetRoute === 'string') router.replace(targetRoute as any);
      else router.replace('/(tabs)/menu');
    } else {
      const realmenteSalir = window.confirm("¿Seguro que quieres salir sin guardar? Se perderán los datos actuales.");
      if (realmenteSalir) {
        clearRally(); 
        localStorage.removeItem('rendi_active_game'); 
        if (typeof targetRoute === 'string') router.replace(targetRoute as any);
        else router.canGoBack() ? router.back() : router.replace('/(tabs)/menu');
      }
    }
  };

  return (
    <View style={tw`flex-1 bg-slate-900`}>
      <HeaderMenu dark={true} title="PANEL DE JUEGO" onBack={() => handleExit()} showQuickNav={true} />

      <View style={tw`flex-1 flex-row overflow-hidden`}>

        {/*-- SIDEBAR MANUAL--*/}
        {isManualOpen && (
          <View style={tw`w-80 border-r border-slate-800 bg-slate-900 z-40`}>
            <ReferencePanel dark={true} isOpen={isManualOpen} setIsOpen={setIsManualOpen} hoveredAction={hoveredAction} />
          </View>
        )}

        <View style={tw`flex-1 bg-slate-900 flex-col overflow-hidden relative`}>
          <View style={tw`flex-1 flex-col`}>
            
            {/* --- HEADER / MARCADOR --- */}
            <View style={[
              tw`h-44 border-b border-slate-800 flex-row items-center justify-between px-10 transition-colors duration-300`,
              blink ? tw`bg-red-900` : tw`bg-slate-950`
            ]}>
              {/* LADO IZQUIERDO: EQUIPO A + JUGADORES A */}
              <View style={tw`flex-1 flex-row items-center justify-start gap-8`}>
                <View style={tw`items-center`}>
                  <Text style={tw`text-slate-100 font-black text-2xl mb-1`}>{eventData?.teamA?.name || 'EQUIPO A'}</Text>
                  <View style={tw`flex-row items-center gap-3`}>
                    <TouchableOpacity onPress={toggleWind} style={tw`flex-row items-center gap-1.5`}>
                      <Ionicons name={wind.A === 'VIENTO A FAVOR' ? 'arrow-up-circle' : 'arrow-down-circle'} size={14} color={wind.A === 'VIENTO A FAVOR' ? '#4ade80' : '#f87171'} />
                      <Text style={tw`text-slate-400 font-bold text-[9px]`}>{wind.A}</Text>
                    </TouchableOpacity>
                    <Text style={tw`text-cyan-400 font-black text-[10px]`}>SETS: {sets.A}</Text>
                  </View>
                </View>

                <View style={tw`flex-row gap-2`}>
                  {eventData?.teamA?.players?.map((player: any, index: number) => {
                    const playerId = player.number ? `A-${player.number}` : `A-${index}`;
                    return (
                      <TouchableOpacity
                        key={`playerA-${index}`} onPress={() => handlePlayerSelect(playerId)}
                        style={tw`px-3 py-2 rounded-xl border-b-4 ${selectedPlayerId === playerId ? 'bg-cyan-600 border-cyan-800' : 'bg-slate-800 border-slate-950 shadow-lg'}`}
                      >
                        <Text style={tw`text-[11px] font-black uppercase ${selectedPlayerId === playerId ? 'text-white' : 'text-slate-300'}`}>
                          #{player.number} {player.fullName || 'Jugador'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* CENTRO: PUNTUACIÓN */}
              <View style={tw`items-center bg-slate-950 px-10 py-2 border-x border-slate-900/50 shadow-2xl`}>
                <Text style={tw`text-slate-500 font-black text-[9px] tracking-[0.3em] mb-1`}>PUNTUACIÓN</Text>
                <View style={tw`flex-row items-center gap-6`}>
                  <Text style={tw`text-7xl font-black text-white tracking-tighter`}>{score.A}</Text>
                  <View style={tw`w-2 h-2 rounded-full bg-slate-700`} />
                  <Text style={tw`text-7xl font-black text-white tracking-tighter`}>{score.B}</Text>
                </View>
                <View style={tw`mt-1 border-t border-slate-800/50 pt-2 w-full items-center`}>
                  <Text style={tw`text-yellow-500 font-black text-[12px] uppercase tracking-[0.2em]`}>SET {currentSet}</Text>
                </View>
              </View>

              {/* LADO DERECHO: JUGADORES B + EQUIPO B */}
              <View style={tw`flex-1 flex-row items-center justify-end gap-8`}>
                <View style={tw`flex-row gap-2`}>
                  {eventData?.teamB?.players?.map((player: any, index: number) => {
                    const playerId = player.number ? `B-${player.number}` : `B-${index}`;
                    return (
                      <TouchableOpacity
                        key={`playerB-${index}`} onPress={() => handlePlayerSelect(playerId)}
                        style={tw`px-3 py-2 rounded-xl border-b-4 ${selectedPlayerId === playerId ? 'bg-cyan-600 border-cyan-800' : 'bg-slate-800 border-slate-950 shadow-lg'}`}
                      >
                        <Text style={tw`text-[11px] font-black uppercase ${selectedPlayerId === playerId ? 'text-white' : 'text-slate-300'}`}>
                          #{player.number} {player.fullName || 'Jugador'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={tw`items-center`}>
                  <Text style={tw`text-slate-100 font-black text-2xl mb-1`}>{eventData?.teamB?.name || 'EQUIPO B'}</Text>
                  <View style={tw`flex-row items-center gap-3`}>
                    <TouchableOpacity onPress={toggleWind} style={tw`flex-row items-center gap-1.5`}>
                      <Ionicons name={wind.B === 'VIENTO A FAVOR' ? 'arrow-up-circle' : 'arrow-down-circle'} size={14} color={wind.B === 'VIENTO A FAVOR' ? '#4ade80' : '#f87171'} />
                      <Text style={tw`text-slate-400 font-bold text-[9px]`}>{wind.B}</Text>
                    </TouchableOpacity>
                    <Text style={tw`text-cyan-400 font-black text-[10px]`}>SETS: {sets.B}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* CONTENIDO PRINCIPAL: CANCHA Y BOTONES */}
            <View style={tw`flex-1 flex-row items-center px-4 gap-4 overflow-hidden`}>

              {/* LADO IZQUIERDO: BANNER + CANCHA (Agrupados) */}
              <View style={tw`w-52 flex-col`}>
                
                {/* BANNER COMPACTO SOBRE CANCHA */}
                <View style={tw`h-10 mb-7`}>
                   {pendingAction ? (
                      <View style={tw`bg-slate-800 border-l-4 ${pendingAction.value !== undefined ? 'border-green-500' : 'border-cyan-500'} rounded-r-lg p-2 shadow-lg`}>
                         <View style={tw`flex-row justify-between mb-1`}>
                            <Text style={tw`text-[9px] text-slate-400 font-bold uppercase`}>Acción:</Text>
                            <Text style={tw`text-[10px] text-white font-black`}>{pendingAction.subAction}</Text>
                         </View>
                         <View style={tw`flex-row justify-between items-center`}>
                            <Text style={tw`text-[9px] text-slate-400 font-bold uppercase`}>Valor:</Text>
                            {pendingAction.value !== undefined ? (
                               <Text style={tw`text-[11px] text-green-400 font-black`}>{pendingAction.value}</Text>
                            ) : (
                               <Text style={tw`text-[9px] text-yellow-500 font-bold animate-pulse`}>PRESIONA 0-4</Text>
                            )}
                         </View>
                         {pendingAction.value !== undefined && (
                            <View style={tw`mt-1 pt-1 border-t border-slate-700 flex-row justify-center items-center gap-1`}>
                               <Ionicons name="location" size={10} color="#facc15" />
                               <Text style={tw`text-[8px] text-yellow-500 font-black uppercase`}>Marca Destino</Text>
                            </View>
                         )}
                      </View>
                   ) : (
                      <View style={tw`bg-slate-900/30 border border-dashed border-slate-700 rounded-lg h-full items-center justify-center`}>
                         <Text style={tw`text-slate-600 font-bold text-[9px] uppercase`}>Selecciona Jugador</Text>
                      </View>
                   )}
                </View>
              
                {/* LADO IZQUIERDO: CANCHA COMPACTA CON FLECHA DINÁMICA */}
                <View 
                  style={tw`w-52 h-64 bg-slate-950/50 rounded-2xl p-2 border border-slate-800 shadow-xl relative`}
                  // @ts-ignore
                  onMouseMove={(e: any) => {
                    if (origin) {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
                    }
                  }}
                  // @ts-ignore
                  onContextMenu={handleCancelSelection}
                >
                  <View style={tw`flex-row h-60 w-full relative`}> 
                    
                    {/* EQUIPO A */}
                    <View style={tw`flex-1 flex-row`}>
                      <View style={tw`flex-1 flex-col`}>
                        {['TI', 'TC', 'TD'].map(pos => <CourtZone key={`A-${pos}`} id={`A-${pos}`} displayLabel={pos} active={selectionStep > 0} isSelected={origin === `A-${pos}`} onPress={() => handleZoneClick(`A-${pos}`)} />)}
                      </View>
                      <View style={tw`flex-1 flex-col`}>
                        {['DI', 'DC', 'DD'].map(pos => <CourtZone key={`A-${pos}`} id={`A-${pos}`} displayLabel={pos} active={selectionStep > 0} isSelected={origin === `A-${pos}`} onPress={() => handleZoneClick(`A-${pos}`)} />)}
                      </View>
                    </View>

                    <View style={tw`w-[1px] bg-slate-700 mx-1`} />

                    {/* EQUIPO B */}
                    <View style={tw`flex-1 flex-row`}>
                      <View style={tw`flex-1 flex-col`}>
                        {['DD', 'DC', 'DI'].map(pos => <CourtZone key={`B-${pos}`} id={`B-${pos}`} displayLabel={pos} active={selectionStep > 0} isSelected={origin === `B-${pos}`} onPress={() => handleZoneClick(`B-${pos}`)} />)}
                      </View>
                      <View style={tw`flex-1 flex-col`}>
                        {['TD', 'TC', 'TI'].map(pos => <CourtZone key={`B-${pos}`} id={`B-${pos}`} displayLabel={pos} active={selectionStep > 0} isSelected={origin === `B-${pos}`} onPress={() => handleZoneClick(`B-${pos}`)} />)}
                      </View>
                    </View>

                    {/* CAPA SVG PARA LA FLECHA */}
                    {origin && selectionStep === 1 && (
                      <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 50 }}>
                        <defs>
                          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                            <polygon points="0 0, 10 3.5, 0 7" fill="#fbbf24" />
                          </marker>
                        </defs>
                        <line 
                          x1={zoneCoords[origin]?.x || 0} y1={zoneCoords[origin]?.y || 0} 
                          x2={mousePos.x} y2={mousePos.y} 
                          stroke="#fbbf24" strokeWidth="2" strokeDasharray="4" markerEnd="url(#arrowhead)" 
                        />
                      </svg>
                    )}
                  </View>

                  {/* Mini guía visual inferior en la cancha */}
                  {origin && (
                    <Text style={tw`absolute -bottom-5 left-0 right-0 text-center text-[8px] text-yellow-500 font-bold uppercase`}>
                      Click Derecho p/ Cancelar
                    </Text>
                  )}
                </View>
              </View>

              {/* LADO DERECHO: TICKET + COLUMNAS */}
              <View style={tw`flex-1 flex-col h-full justify-center py-2`}>
                
                {/* TICKET DINÁMICO */}
                  <View style={[tw`flex-row items-center bg-slate-950/90 rounded-xl border border-cyan-900/30 px-3 py-1.5 mb-3 shadow-2xl`, { alignSelf: 'flex-start', minWidth: 200 }]}>
                    <View style={tw`flex-row flex-wrap gap-2 items-center`}>
                      {currentRally.length === 0 ? (
                        <Text style={tw`text-slate-600 font-bold text-[10px] uppercase tracking-widest`}>Esperando Rally...</Text>
                      ) : (
                        currentRally.map((accion, index) => (
                          <TouchableOpacity 
                            key={index} 
                            onPress={() => {
                              editRallyAction(index);
                              setIsEditingMode(true); // Activamos el modo Dios para editar
                            }} 
                            style={tw`bg-slate-900 px-2 py-1 rounded-lg border border-slate-700 flex-row items-center gap-2 active:bg-cyan-900/50 hover:border-cyan-500 transition-colors`}
                          >
                            {/* Jugador y Acción */}
                            <Text style={tw`text-cyan-500 font-black text-[10px]`}>{accion.playerId}</Text>
                            <Text style={tw`text-white font-bold text-[10px]`}>{accion.subAction}</Text>
                            
                            {/* NUEVAS ZONAS con 'a' o 'b' */}
                            <View style={tw`bg-slate-800 px-2 py-0.5 rounded flex-row items-center gap-1`}>
                              <Text style={tw`text-slate-300 text-[10px] font-bold tracking-wider`}>
                                {formatTicketZone(accion.from || accion.origin)}
                              </Text>
                              <Ionicons name="arrow-forward" size={10} color="#fbbf24" />
                              <Text style={tw`text-slate-300 text-[10px] font-bold tracking-wider`}>
                                {formatTicketZone(accion.to || accion.destination)}
                              </Text>
                            </View>
                            
                            {/* Valor */}
                            <Text style={tw`text-yellow-500 font-black text-[11px]`}>{accion.value}</Text>
                          </TouchableOpacity>
                        ))
                      )}  
                    </View>

                    {/* BOTÓN GUARDAR (Se mantiene igual, requiere click manual para finalizar) */}
                    {currentRally.length > 0 && (
                      <TouchableOpacity 
                        onPress={handleAutoCommit} 
                        style={tw`ml-4 bg-cyan-600 px-3 py-1 rounded-lg shadow-lg border-b-2 border-cyan-800`}
                      >
                        <Text style={tw`text-white font-black text-[10px]`}>GUARDAR</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                {/* COLUMNAS DE ACCIÓN EN index.web_11.tsx */}
                <View style={tw`flex-1 flex-row gap-1 justify-start`}>
                  {renderActionColumn('Serv.', 'SERVICIO', ['BAJ', 'FLO', 'SAL', 'SAF'])}
                  {renderActionColumn('Rec.', 'RECEPCION', ['2ma', 'Ppm'])}
                  {renderActionColumn('Acom.', 'ACOMODADA', ['P2a', 'P2b'])}
                  
                  {/* ATAQUE: 8 acciones en total (2 columnas de 4) */}
                  {renderActionColumn('Ataq.', 'ATAQUE', 
                    ['Rm', 'Rca', 'Ub', 'Tr', 'Acd', 'Rdjn', 'Rdpmp', 'Rd' ], 
                    true // <-- Activamos isDouble
                  )}
                  
                  {renderActionColumn('Bloq.', 'BLOQUEO', ['Bl', 'Bd', 'Bn'])}
                  {renderActionColumn('Def.', 'DEFENSA', ['Dd', 'Dltd', 'Ld', 'Cc'])}
                  {renderActionColumn('E. Serv', 'ERRORES_SERV', ['SFC', 'SR', 'SME'])}
                  {renderActionColumn('E. Com', 'ERRORES_COM', ['CI', 'MC'])}
                  {renderActionColumn('E. Pos', 'ERRORES_POS', ['NAT', 'CJR', 'MCA', 'JFZ'])}
                  {renderActionColumn('E. Tec', 'ERRORES_TEC', ['GMD', 'TI', 'MER', 'BTR'])}
                </View>
              </View>
            </View>

          {/* FOOTER: CRONÓMETROS Y CONTROL (ALTURA REDUCIDA A h-20) */}
          <View style={tw`h-20 bg-slate-950 border-t border-slate-800 flex-row items-center justify-between px-10`}>
            
            {/* SECCIÓN IZQUIERDA */}
            <View style={tw`flex-1 flex-row justify-start`}>
              <TouchableOpacity 
                onPress={() => setIsManualOpen(!isManualOpen)}
                style={tw`flex-row items-center gap-2 px-5 py-2 rounded-xl border-b-4 ${isManualOpen ? 'bg-slate-700 border-slate-900' : 'bg-yellow-500 border-yellow-700'}`}
              >
                <Ionicons name={isManualOpen ? "close-circle" : "book"} size={18} color={isManualOpen ? "white" : "black"} />
                <Text style={tw`font-black text-[11px] uppercase ${isManualOpen ? 'text-white' : 'text-black'}`}>Manual</Text>
              </TouchableOpacity>
            </View>

            {/* SECCIÓN CENTRAL: Cronómetros (Escalados) */}
            <View style={tw`flex-row items-center gap-8 bg-slate-900/50 px-6 py-2 rounded-3xl border border-slate-800`}>
              <View style={tw`items-center`}>
                <Text style={tw`text-slate-600 font-black text-[8px] uppercase mb-0.5`}>Tiempo Total</Text>
                <Text style={tw`text-white font-mono text-2xl font-bold`}>{timers.formattedTotalTime}</Text>
              </View>
              <View style={tw`w-px h-8 bg-slate-800`} />
              <View style={tw`items-center`}>
                <Text style={tw`text-slate-600 font-black text-[8px] uppercase mb-0.5`}>En Juego</Text>
                <Text style={[tw`font-mono text-2xl font-bold`, timers.isRealTimeActive ? tw`text-green-400` : tw`text-slate-500`]}>
                  {timers.formattedRealTime}
                </Text>
              </View>
            </View>

            {/* SECCIÓN DERECHA */}
            <View style={tw`flex-1 flex-row justify-end gap-3`}>
              <TouchableOpacity 
                onPress={() => {
                  if (!hasStarted) { setHasStarted(true); timers.startRealTime(); } 
                  else { timers.isRealTimeActive ? timers.stopRealTime() : timers.startRealTime(); }
                }}
                style={tw`flex-row items-center gap-2 px-5 py-2 rounded-xl border-b-4 ${!hasStarted ? 'bg-green-600 border-green-800' : timers.isRealTimeActive ? 'bg-orange-600 border-orange-800' : 'bg-green-600 border-green-800' }`}
              >
                <Ionicons name={!hasStarted ? "play-skip-forward" : timers.isRealTimeActive ? "pause" : "play"} size={18} color="white" />
                <Text style={tw`text-white font-black text-[11px] uppercase`}>{!hasStarted ? 'Comenzar' : timers.isRealTimeActive ? 'Pausar' : 'Reanudar'}</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={() => { if(window.confirm("¿Deseas finalizar el parcial actual?")) console.log("Finalizando Parcial..."); }}
                style={tw`flex-row items-center gap-2 px-5 py-2 bg-slate-800 rounded-xl border-b-4 border-slate-950`}
              >
                <Ionicons name="stop-circle" size={18} color="#f87171" />
                <Text style={tw`text-white font-black text-[11px] uppercase`}>Final Parcial</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </View>
    </View>
  </View>
  );
}