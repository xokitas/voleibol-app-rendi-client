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
        onBack={() => handleExit()} // Reemplazamos el back por un replace para evitar volver a esta pantalla al salir del menú
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
              hoveredAction={hoveredAction} // Reacciona al hover de los botones
            />
          </View>
        )}

        
        <View style={tw`flex-1 bg-slate-900 flex-col overflow-hidden relative`}>
      
        {/* CONTENIDO PRINCIPAL */}

          <View style={tw`flex-1 flex-col`}>
            {/* HEADER / MARCADOR */}
              <View style={[
                tw`h-36 border-b border-slate-800 flex-row items-center justify-between px-10 transition-colors duration-300`,
                blink ? tw`bg-red-900` : tw`bg-slate-950` // <--- Fondo azul oscuro igual al footer
              ]}>
                
                {/* EQUIPO A */}
                <View style={tw`items-center`}>
                  <Text style={tw`text-slate-100 font-black text-2xl mb-1`}>{eventData?.teamA?.name || 'EQUIPO A'}</Text>
                  
                  {/* Botón de Viento A - Ahora es clickeable */}
                  <TouchableOpacity 
                    onPress={toggleWind} 
                    style={tw`flex-row items-center gap-2 mt-1 px-3 py-1.5 rounded-lg active:bg-slate-800`}
                  >
                    <Ionicons 
                      name={wind.A === 'A FAVOR' ? 'arrow-up-circle' : 'arrow-down-circle'} 
                      size={16} 
                      color={wind.A === 'A FAVOR' ? '#4ade80' : '#f87171'} // Verde o Rojo
                    />
                    <Text style={tw`text-slate-300 font-bold text-[10px]`}>VIENTO: {wind.A}</Text>
                  </TouchableOpacity>
                  
                  <Text style={tw`text-cyan-400 font-black mt-1`}>SETS: {sets.A}</Text>
                </View>

                {/* PUNTUACIÓN CENTRAL (AJUSTADA PARA SER MÁS PEQUEÑA) */}
                  <View style={tw`items-center bg-slate-950 px-8 py-5s border-slate-800 shadow-2xl`}>
                    <Text style={tw`text-slate-500 font-black text-[10px] tracking-[0.3em] mb-1`}>PUNTUACIÓN</Text>
                    
                    <View style={tw`flex-row items-center gap-4`}>
                      <Text style={tw`text-6xl font-black text-white`}>{score.A}</Text>
                      <View style={tw`w-1 h-1 rounded-full bg-slate-700`} />
                      <Text style={tw`text-6xl font-black text-white`}>{score.B}</Text>
                    </View>
                    
                    {/* Set Actual más pequeño y estético */}
                    <View style={tw`mt-1 border-t border-slate-800 pt-1 w-full items-center`}>
                      <Text style={tw`text-yellow-500/80 font-black text-[11px] uppercase tracking-widest`}>
                        SET {currentSet}
                      </Text>
                    </View>
                  </View>

                {/* EQUIPO B */}
                <View style={tw`items-center`}>
                  <Text style={tw`text-slate-100 font-black text-2xl mb-1`}>{eventData?.teamB?.name || 'EQUIPO B'}</Text>
                  
                  {/* Botón de Viento B - Ahora es clickeable */}
                  <TouchableOpacity 
                    onPress={toggleWind} 
                    style={tw`flex-row items-center gap-2 mt-1 px-3 py-1.5 rounded-lg active:bg-slate-800`}
                  >
                    <Ionicons 
                      name={wind.B === 'A FAVOR' ? 'arrow-up-circle' : 'arrow-down-circle'} 
                      size={16} 
                      color={wind.B === 'A FAVOR' ? '#4ade80' : '#f87171'} // Verde o Rojo
                    />
                    <Text style={tw`text-slate-300 font-bold text-[10px]`}>VIENTO: {wind.B}</Text>
                  </TouchableOpacity>
                  
                  <Text style={tw`text-cyan-400 font-black mt-1`}>SETS: {sets.B}</Text>
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
                  </View>
                </View>

                {/* LADO DERECHO: TODAS LAS COLUMNAS DE ACCIÓN */}
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

            {/* FOOTER: CRONÓMETROS Y CONTROL */}
              <View style={tw`h-28 bg-slate-950 border-t border-slate-800 flex-row items-center justify-between px-10`}>
                
                {/* SECCIÓN IZQUIERDA: Solo el Manual (flex-1 para empujar al centro) */}
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

                {/* SECCIÓN CENTRAL: Cronómetros (Se mantiene en el centro real) */}
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
                      !hasStarted ? 'bg-green-600 border-green-800' : // Comenzar (Verde)
                      timers.isRealTimeActive ? 'bg-orange-600 border-orange-800' : // Pausar (Naranja)
                      'bg-green-600 border-green-800' // Reanudar (Verde)
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