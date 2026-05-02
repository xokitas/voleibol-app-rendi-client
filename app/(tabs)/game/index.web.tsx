import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, Text, TouchableOpacity, View } from 'react-native';
import HeaderMenu from '../../../components/HeaderMenu';
import ReferencePanel from '../../../components/ReferencePanel';
import { useGameTimers } from '../../../hooks/useGameTimers';
import { useScoutingLogic } from '../../../hooks/useScoutingLogic';
import tw from '../../../lib/tailwind';

// --- COMPONENTES AUXILIARES ---

const categoryColors: Record<string, string> = {
  SERVICIO: 'bg-[#93c5fd]',     // Azul claro
  RECEPCION: 'bg-[#86efac]',    // Verde claro
  ACOMODADA: 'bg-[#fbcfe8]',    // Rosadito
  ATAQUE: 'bg-[#fde047]',       // Amarillo
  BLOQUEO: 'bg-[#c084fc]',      // Morado
  DEFENSA: 'bg-[#166534]',      // Verde oscuro (Texto blanco en este)
  ERRORES_SERV: 'bg-[#4b5563]', // Grisáceo morado
  ERRORES_COM: 'bg-[#4b5563]',  // Grisáceo morado
  ERRORES_POS: 'bg-[#4b5563]',  // Grisáceo morado
  ERRORES_TEC: 'bg-[#4b5563]',  // Grisáceo morado
};

const CourtZone = ({ id, displayLabel, active, onPress, isSelected }: {
  id: string; // El ID lógico: "A-TI"
  displayLabel: string; // Lo que se ve: "TI"
  active: boolean;
  onPress: () => void;
  isSelected: boolean;
}) => (
  <TouchableOpacity
    onPress={onPress}
    // Reducimos altura y márgenes para ganar espacio vertical
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

const ActionButton = ({
  label,
  color,
  onPress,
  onHover,
  disabled,
  active
}: {
  label: string;
  color: string;
  onPress: () => void;
  onHover: (hover: boolean) => void;
  disabled: boolean;
  active?: boolean;
}) => (
  <Pressable
    onPress={onPress}
    onHoverIn={() => onHover(true)}
    onHoverOut={() => onHover(false)}
    disabled={disabled}
    style={({ pressed }) => [
      tw`px-4 py-3 rounded-xl mb-2 mr-2 border-b-4 items-center justify-center min-w-[80px]`,
      tw`${color} ${disabled ? 'opacity-20 pointer-events-none' : ''}`,
      active ? tw`border-slate-100 scale-105` : tw`border-black/20`,
      pressed && !disabled ? tw`translate-y-1 border-b-0` : {}
    ]}
  >
    <Text style={tw`text-white font-black text-xs`}>{label}</Text>
  </Pressable>
);

export default function GameScreenWeb() {
  const router = useRouter();
  const { data } = useLocalSearchParams();
  const eventData = data ? JSON.parse(data as string) : null;
  // Extraemos todo lo necesario de nuestro hook actualizado
  const {
    score, 
    sets, 
    wind, 
    mustSwitchSide,
    canPerformAction, 
    handleActionClick,   // <--- Ahora viene del hook
    confirmActionValue,  // <--- Para el teclado
    pendingAction,       // <--- Ahora viene del hook
    selectedPlayerId,    // <--- Ahora viene del hook
    handlePlayerSelect,
    commitPoint,
    currentRally,
    clearRally,
    toggleWind,
    currentSet,
    updatePendingZones
  } = useScoutingLogic();

  const timers = useGameTimers();

  // Estados Locales
  const [isManualOpen, setIsManualOpen] = useState(false); // Nuevo estado para el Drawer
  const [hoveredAction, setHoveredAction] = useState<string | null>(null);
  const [selectionStep, setSelectionStep] = useState(0); // 0 = ninguna, 1 = origen, 2 = destino
  const [origin, setOrigin] = useState<string | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [blink, setBlink] = useState(false);


  // Efecto de parpadeo para cambio de cancha
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

  // Iniciar tiempo total al montar
  useEffect(() => {
    timers.startTotalTime();
  }, []);

  // Pon esto junto a tus otros useEffect en GameScreenWeb
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Si ya elegimos acción (ej. BAJ) pero no tiene nota
      if (pendingAction && pendingAction.value === undefined) {
        let val: number | null = null;
        
        // Mapeo de teclas para el VALOR
        if (e.key === '`' || e.key === '0' || e.key === 'º') val = 0;
        else if (['1', '2', '3', '4'].includes(e.key)) val = parseInt(e.key);

        if (val !== null) {
          // Confirmamos el valor pero NO cerramos la acción aún, 
          // porque falta que el usuario marque las zonas en la cancha
          confirmActionValue(val); 
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pendingAction, confirmActionValue]);


  const handleZoneClick = (zoneLabel: string) => {
    // Solo actuamos si hay una acción con valor definida por teclado
    if (pendingAction && pendingAction.value !== undefined) {
      if (selectionStep === 0) {
        setOrigin(zoneLabel);
        setSelectionStep(1); // Esperando el destino
      } else if (selectionStep === 1) {
        // PASO 5: Cerramos la acción
        updatePendingZones(origin!, zoneLabel);
        
        // Limpieza de UI local
        setSelectionStep(0);
        setOrigin(null);
        console.log("Acción guardada con éxito en el Rally");
      }
    } else {
      // Feedback visual opcional: "Primero elige acción y puntuación"
    }
  };

  const renderActionColumn = (title: string, category: string, subs: string[]) => {
    const bgColor = categoryColors[category] || 'bg-slate-800';
    const textColor = 'text-white';
  
    return (
      <View style={tw`flex-1 min-w-[35px] max-w-[85px] ${!canPerformAction(category) ? 'opacity-20' : ''}`}>
        <Text style={tw`text-slate-500 font-black text-[9px] uppercase mb-2 text-center tracking-tighter`}>
          {title}
        </Text>
        <View style={tw`flex-col gap-1.5`}>
          {subs.map(sub => (
            /* Este View es el que "le avisa" al ReferencePanel qué acción estás mirando */
            <View 
              key={sub}
              // @ts-ignore
              onMouseEnter={() => setHoveredAction(sub)} 
              // @ts-ignore
              onMouseLeave={() => setHoveredAction(null)}
            >
              <TouchableOpacity
                onPress={() => handleActionClick(category, sub)}
                disabled={!canPerformAction(category)}
                style={[
                  tw`py-2 rounded-lg border-b-2 items-center justify-center shadow-sm`,
                  pendingAction?.subAction === sub 
                    ? [tw`border-white scale-105`, { backgroundColor: '#ffffff' }] 
                    : [tw`border-black/10`, tw`${bgColor}`]
                ]}
              >
                <Text style={[
                  tw`font-black text-[12px] tracking-tight`, 
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

  const zonesA = [
    ['5', '4'], // Columna 1 (Zaga Izq, Red Izq)
    ['6', '3'], // Columna 2 (Zaga Cent, Red Cent)
    ['1', '2'], // Columna 3 (Zaga Der, Red Der)
  ]; // Zonas estándar de voleibol


  const handleExit = (targetRoute?: string) => {
    const mensaje = "¿Deseas guardar los cambios antes de salir?";
    const save = "Juego guardado";
    const deseaGuardar = window.confirm(mensaje);
  
    if (deseaGuardar) {
      // --- GUARDADO LOCAL ---
      // Guardamos un objeto con lo básico para saber que hay un juego.
      // (Más adelante aquí puedes meter el 'score', 'sets', y el 'rally')
      const gameData = {
        inProgress: true,
        lastSaved: new Date().toISOString()
      };
      localStorage.setItem('rendi_active_game', JSON.stringify(gameData));
      console.log("Juego guardado localmente en el navegador.");
  
      if (typeof targetRoute === 'string') {
        router.replace(targetRoute as any);
      } else {
        router.replace('/(tabs)/menu');
      }
    } else {
      const realmenteSalir = window.confirm("¿Seguro que quieres salir sin guardar? Se perderán los datos actuales.");
      
      if (realmenteSalir) {
        clearRally(); // Tu función existente
        // Borramos cualquier juego guardado anterior porque decidió no guardar
        localStorage.removeItem('rendi_active_game'); 
        
        if (typeof targetRoute === 'string') {
          router.replace(targetRoute as any);
        } else {
          router.canGoBack() ? router.back() : router.replace('/(tabs)/menu');
        }
      }
    }
  };

  return (
    <View style={tw`flex-1 bg-slate-900`}>
      {/* --- HEADER PERMANENTE --- */}
      <HeaderMenu 
        dark={true} 
        title="PANEL DE JUEGO"
        onBack={() => handleExit()} 
        showQuickNav={true}
      />

      <View style={tw`flex-1 flex-row overflow-hidden`}>

        {/*-- SIDEBAR MANUAL--*/}
        {isManualOpen && (
          <View style={tw`w-80 border-r border-slate-800 bg-slate-900 z-40`}>
            <ReferencePanel 
              dark={true} 
              isOpen={isManualOpen} 
              setIsOpen={setIsManualOpen}
              hoveredAction={hoveredAction}
            />
          </View>
        )}

        <View style={tw`flex-1 bg-slate-900 flex-col overflow-hidden relative`}>
      
          {/* CONTENIDO PRINCIPAL */}
          <View style={tw`flex-1 flex-col`}>
            
            {/* --- HEADER / MARCADOR REDISEÑADO ÚNICO --- */}
            <View style={[
              tw`h-44 border-b border-slate-800 flex-row items-center justify-between px-10 transition-colors duration-300`,
              blink ? tw`bg-red-900` : tw`bg-slate-950`
            ]}>
              
              {/* LADO IZQUIERDO: EQUIPO A + JUGADORES A */}
              <View style={tw`flex-1 flex-row items-center justify-start gap-8`}>
                {/* INFO EQUIPO A */}
                <View style={tw`items-center`}>
                  <Text style={tw`text-slate-100 font-black text-2xl mb-1`}>
                    {eventData?.teamA?.name || 'EQUIPO A'}
                  </Text>
                  <View style={tw`flex-row items-center gap-3`}>
                    <TouchableOpacity onPress={toggleWind} style={tw`flex-row items-center gap-1.5`}>
                      <Ionicons 
                        name={wind.A === 'A FAVOR' ? 'arrow-up-circle' : 'arrow-down-circle'} 
                        size={14} 
                        color={wind.A === 'A FAVOR' ? '#4ade80' : '#f87171'} 
                      />
                      <Text style={tw`text-slate-400 font-bold text-[9px]`}>{wind.A}</Text>
                    </TouchableOpacity>
                    <Text style={tw`text-cyan-400 font-black text-[10px]`}>SETS: {sets.A}</Text>
                  </View>
                </View>

                {/* JUGADORES EQUIPO A */}
                <View style={tw`flex-row gap-2`}>
                  {eventData?.teamA?.players?.map((player: any, index: number) => {
                    const playerId = player.number ? `A-${player.number}` : `A-${index}`;

                    return (
                      <TouchableOpacity
                        key={`playerA-${index}`}
                        onPress={() => handlePlayerSelect(playerId)}
                        style={tw`px-3 py-2 rounded-xl border-b-4 ${
                          selectedPlayerId === playerId
                            ? 'bg-cyan-600 border-cyan-800' 
                            : 'bg-slate-800 border-slate-950 shadow-lg'
                        }`}
                      >
                        <Text style={tw`text-[11px] font-black uppercase ${
                          selectedPlayerId === playerId ? 'text-white' : 'text-slate-300'
                        }`}>
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
                  <Text style={tw`text-yellow-500 font-black text-[12px] uppercase tracking-[0.2em]`}>
                    SET {currentSet}
                  </Text>
                </View>
              </View>

              {/* LADO DERECHO: JUGADORES B + EQUIPO B */}
              <View style={tw`flex-1 flex-row items-center justify-end gap-8`}>
                {/* JUGADORES EQUIPO B */}
                <View style={tw`flex-row gap-2`}>
                  {eventData?.teamB?.players?.map((player: any, index: number) => {
                    const playerId = player.number ? `B-${player.number}` : `B-${index}`;

                    return (
                      <TouchableOpacity
                        key={`playerB-${index}`}
                        onPress={() => handlePlayerSelect(playerId)}
                        style={tw`px-3 py-2 rounded-xl border-b-4 ${
                          selectedPlayerId === playerId
                            ? 'bg-cyan-600 border-cyan-800' 
                            : 'bg-slate-800 border-slate-950 shadow-lg'
                        }`}
                      >
                        <Text style={tw`text-[11px] font-black uppercase ${
                          selectedPlayerId === playerId ? 'text-white' : 'text-slate-300'
                        }`}>
                          #{player.number} {player.fullName || 'Jugador'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* INFO EQUIPO B */}
                <View style={tw`items-center`}>
                  <Text style={tw`text-slate-100 font-black text-2xl mb-1`}>
                    {eventData?.teamB?.name || 'EQUIPO B'}
                  </Text>
                  <View style={tw`flex-row items-center gap-3`}>
                    <TouchableOpacity onPress={toggleWind} style={tw`flex-row items-center gap-1.5`}>
                      <Ionicons 
                        name={wind.B === 'A FAVOR' ? 'arrow-up-circle' : 'arrow-down-circle'} 
                        size={14} 
                        color={wind.B === 'A FAVOR' ? '#4ade80' : '#f87171'} 
                      />
                      <Text style={tw`text-slate-400 font-bold text-[9px]`}>{wind.B}</Text>
                    </TouchableOpacity>
                    <Text style={tw`text-cyan-400 font-black text-[10px]`}>SETS: {sets.B}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* CONTENIDO PRINCIPAL: CANCHA Y BOTONES (Organizados en Fila) */}
            <View style={tw`flex-1 flex-row items-center px-4 gap-4 overflow-hidden`}>
              
              {/* LADO IZQUIERDO: CANCHA COMPACTA */}
              <View style={tw`w-52 bg-slate-950/50 rounded-2xl p-2 border border-slate-800 shadow-xl`}>
                <View style={tw`flex-row h-60 w-full`}> 
                  
                  {/* EQUIPO A (Izquierda) */}
                  <View style={tw`flex-1 flex-row`}>
                    <View style={tw`flex-1 flex-col`}>
                      {['TI', 'TC', 'TD'].map(pos => (
                        <CourtZone 
                          key={`A-${pos}`} id={`A-${pos}`} displayLabel={pos}
                          active={selectionStep > 0} isSelected={origin === `A-${pos}`} 
                          onPress={() => handleZoneClick(`A-${pos}`)} 
                        />
                      ))}
                    </View>
                    <View style={tw`flex-1 flex-col`}>
                      {['DI', 'DC', 'DD'].map(pos => (
                        <CourtZone 
                          key={`A-${pos}`} id={`A-${pos}`} displayLabel={pos}
                          active={selectionStep > 0} isSelected={origin === `A-${pos}`} 
                          onPress={() => handleZoneClick(`A-${pos}`)} 
                        />
                      ))}
                    </View>
                  </View>

                  {/* RED */}
                  <View style={tw`w-[1px] bg-slate-700 mx-1`} />

                  {/* EQUIPO B (Derecha - Espejo) */}
                  <View style={tw`flex-1 flex-row`}>
                    <View style={tw`flex-1 flex-col`}>
                      {['DD', 'DC', 'DI'].map(pos => (
                        <CourtZone 
                          key={`B-${pos}`} id={`B-${pos}`} displayLabel={pos}
                          active={selectionStep > 0} isSelected={origin === `B-${pos}`} 
                          onPress={() => handleZoneClick(`B-${pos}`)} 
                        />
                      ))}
                    </View>
                    <View style={tw`flex-1 flex-col`}>
                      {['TD', 'TC', 'TI'].map(pos => (
                        <CourtZone 
                          key={`B-${pos}`} id={`B-${pos}`} displayLabel={pos}
                          active={selectionStep > 0} isSelected={origin === `B-${pos}`} 
                          onPress={() => handleZoneClick(`B-${pos}`)} 
                        />
                      ))}
                    </View>
                  </View>

                  {/* --- ESTO ES LO NUEVO: INDICADOR DE TRAYECTORIA --- */}
                    {origin && (
                      <View style={tw`absolute -bottom-6 left-0 right-0 items-center`}>
                        <View style={tw`bg-yellow-500 px-2 py-0.5 rounded-full shadow-lg flex-row items-center gap-1`}>
                          <Ionicons name="location" size={10} color="black" />
                          <Text style={tw`text-black font-black text-[9px] uppercase`}>
                            Marcando desde: {origin.replace(/^[AB]-/, '')} → Selecciona Destino
                          </Text>
                        </View>
                      </View>
                    )}    

                </View>
              </View>

              {/* LADO DERECHO: TICKET + COLUMNAS */}
                <View style={tw`flex-1 flex-col h-full justify-center py-2`}>
                  
                  {/* TICKET DINÁMICO Y ESTÉTICO */}
                    <View style={[
                      tw`flex-row items-center bg-slate-950/90 rounded-xl border border-cyan-900/30 px-3 py-1.5 mb-3 shadow-2xl`,
                      { alignSelf: 'flex-start', minWidth: 200 } // <--- Esto evita que se estire a la derecha
                    ]}>
                      <View style={tw`flex-row flex-wrap gap-2 items-center`}>
                        {currentRally.length === 0 ? (
                          <Text style={tw`text-slate-600 font-bold text-[10px] uppercase tracking-widest`}>Esperando Rally...</Text>
                        ) : (
                          currentRally.map((accion, index) => (
                            <View key={index} style={tw`bg-slate-900 px-2 py-1 rounded-lg border border-slate-800 flex-row items-center gap-2`}>
                              <Text style={tw`text-cyan-500 font-black text-[10px]`}>{accion.playerId}</Text>
                              <Text style={tw`text-white font-bold text-[10px]`}>{accion.subAction}</Text>
                              {/* Mostramos las zonas: Ej (5 -> 1) */}
                              <View style={tw`bg-slate-800 px-1.5 rounded flex-row items-center`}>
                                <Text style={tw`text-slate-400 text-[9px]`}>{accion.from?.replace(/^[AB]-/, '')}</Text>
                                <Ionicons name="arrow-forward" size={8} color="#94a3b8" style={tw`mx-0.5`} />
                                <Text style={tw`text-slate-400 text-[9px]`}>{accion.to?.replace(/^[AB]-/, '')}</Text>
                              </View>
                              <Text style={tw`text-yellow-500 font-black text-[10px]`}>{accion.value}</Text>
                            </View>
                          ))
                        )}
                      </View>

                      {currentRally.length > 0 && (
                        <TouchableOpacity 
                          onPress={() => commitPoint(window.confirm("¿Punto Equipo A?") ? 'A' : 'B')}
                          style={tw`ml-4 bg-cyan-600 px-3 py-1 rounded-lg shadow-lg border-b-2 border-cyan-800`}
                        >
                          <Text style={tw`text-white font-black text-[10px]`}>GUARDAR</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                {/* COLUMNAS DE ACCIÓN (Ahora debajo del ticket) */}
                <View style={tw`flex-1 flex-row gap-1 justify-start`}>
                  {renderActionColumn('Serv.', 'SERVICIO', ['BAJ', 'FLO', 'SAL', 'SAF'])}
                  {renderActionColumn('Rec.', 'RECEPCION', ['2ma', 'Ppm'])}
                  {renderActionColumn('Acom.', 'ACOMODADA', ['P2a', 'P2b'])}
                  {renderActionColumn('Ataq.', 'ATAQUE', ['RM', 'Rca', 'Ub', 'Tr', 'Acd', 'Rdjn', 'Rd'])}
                  {renderActionColumn('Bloq.', 'BLOQUEO', ['Bl', 'Bd', 'Bn'])}
                  {renderActionColumn('Def.', 'DEFENSA', ['Dd', 'Dltd', 'Ld', 'Cc'])}
                  {renderActionColumn('E. Serv', 'ERRORES_SERV', ['SFC', 'SR', 'SME'])}
                  {renderActionColumn('E. Com', 'ERRORES_COM', ['CI', 'MC'])}
                  {renderActionColumn('E. Pos', 'ERRORES_POS', ['NAT', 'CJR', 'MCA', 'JFZ'])}
                  {renderActionColumn('E. Tec', 'ERRORES_TEC', ['GMD', 'TI', 'MER', 'BTR'])}
                </View>

              </View>
            </View>


          {/* FOOTER: CRONÓMETROS Y CONTROL */}
          <View style={tw`h-28 bg-slate-950 border-t border-slate-800 flex-row items-center justify-between px-10`}>
            
            {/* SECCIÓN IZQUIERDA: Solo el Manual */}
            <View style={tw`flex-1 flex-row justify-start`}>
              <TouchableOpacity 
                onPress={() => setIsManualOpen(!isManualOpen)}
                style={tw`flex-row items-center gap-2 px-6 py-3 rounded-xl border-b-4 ${
                  isManualOpen ? 'bg-slate-700 border-slate-900' : 'bg-yellow-500 border-yellow-700'
                }`}
              >
                <Ionicons 
                  name={isManualOpen ? "close-circle" : "book"} 
                  size={20} 
                  color={isManualOpen ? "white" : "black"} 
                />
                <Text style={tw`font-black text-xs uppercase ${isManualOpen ? 'text-white' : 'text-black'}`}>
                  Manual
                </Text>
              </TouchableOpacity>
            </View>

            {/* SECCIÓN CENTRAL: Cronómetros */}
            <View style={tw`flex-row items-center gap-10 bg-slate-900/50 px-8 py-4 rounded-3xl border border-slate-800`}>
              <View style={tw`items-center`}>
                <Text style={tw`text-slate-600 font-black text-[9px] uppercase mb-1`}>Tiempo Total</Text>
                <Text style={tw`text-white font-mono text-3xl font-bold`}>{timers.formattedTotalTime}</Text>
              </View>

              <View style={tw`w-px h-10 bg-slate-800`} />

              <View style={tw`items-center`}>
                <Text style={tw`text-slate-600 font-black text-[9px] uppercase mb-1`}>En Juego</Text>
                <Text style={[tw`font-mono text-3xl font-bold`, timers.isRealTimeActive ? tw`text-green-400` : tw`text-slate-500`]}>
                  {timers.formattedRealTime}
                </Text>
              </View>
            </View>

            {/* SECCIÓN DERECHA: Controles */}
            <View style={tw`flex-1 flex-row justify-end gap-4`}>
              {/* Botón Pausa / Reanudar */}
              <TouchableOpacity 
                onPress={() => {
                  if (!hasStarted) {
                    setHasStarted(true);
                    timers.startRealTime();
                  } else {
                    timers.isRealTimeActive ? timers.stopRealTime() : timers.startRealTime();
                  }
                }}
                style={tw`flex-row items-center gap-2 px-6 py-3 rounded-xl border-b-4 ${
                  !hasStarted ? 'bg-green-600 border-green-800' : 
                  timers.isRealTimeActive ? 'bg-orange-600 border-orange-800' : 
                  'bg-green-600 border-green-800' 
                }`}
              >
                <Ionicons 
                  name={!hasStarted ? "play-skip-forward" : timers.isRealTimeActive ? "pause" : "play"} 
                  size={20} 
                  color="white" 
                />
                <Text style={tw`text-white font-black text-xs uppercase`}>
                  {!hasStarted ? 'Comenzar' : timers.isRealTimeActive ? 'Pausar' : 'Reanudar'}
                </Text>
              </TouchableOpacity>

              {/* Botón Final Parcial */}
              <TouchableOpacity 
                onPress={() => {
                  if(window.confirm("¿Deseas finalizar el parcial actual?")) {
                    console.log("Finalizando Parcial...");
                  }
                }}
                style={tw`flex-row items-center gap-2 px-6 py-3 bg-slate-800 rounded-xl border-b-4 border-slate-950`}
              >
                <Ionicons name="stop-circle" size={20} color="#f87171" />
                <Text style={tw`text-white font-black text-xs uppercase`}>Final Parcial</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </View>
    </View>
  </View>
  );
}