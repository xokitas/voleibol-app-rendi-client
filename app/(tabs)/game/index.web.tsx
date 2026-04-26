import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import HeaderMenu from '../../../components/HeaderMenu';
import ReferencePanel from '../../../components/ReferencePanel';
import { useGameTimers } from '../../../hooks/useGameTimers';
import { useScoutingLogic } from '../../../hooks/useScoutingLogic';
import tw from '../../../lib/tailwind';

// --- COMPONENTES AUXILIARES ---

const CourtZone = ({ label, team, active, onPress, isSelected }: {
  label: string;
  team: 'A' | 'B';
  active: boolean;
  onPress: () => void;
  isSelected: boolean;
}) => (
  <TouchableOpacity
    onPress={onPress}
    style={tw`flex-1 m-1 rounded-lg border-2 justify-center items-center h-24 ${
      isSelected ? 'border-yellow-400 bg-yellow-400/20' :
      active ? 'border-slate-600 bg-slate-700' : 'border-slate-800 bg-slate-900/50'
    }`}
  >
    <Text style={tw`text-xs font-black ${isSelected ? 'text-yellow-400' : 'text-slate-500'}`}>{label}</Text>
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
    clearRally
  } = useScoutingLogic();

  const timers = useGameTimers();

  // Estados Locales
  const [isManualOpen, setIsManualOpen] = useState(false); // Nuevo estado para el Drawer
  const [hoveredAction, setHoveredAction] = useState<string | null>(null);
  const [selectionStep, setSelectionStep] = useState(0); // 0 = ninguna, 1 = origen, 2 = destino
  const [origin, setOrigin] = useState<string | null>(null);

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
    // Solo permitimos marcar zonas si ya hay una acción seleccionada y con valor (teclado)
    if (pendingAction && pendingAction.value !== undefined) {
      if (selectionStep === 0) {
        // Marcamos origen
        setOrigin(zoneLabel);
        setSelectionStep(1);
      } else if (selectionStep === 1) {
        console.log("Acción Completa:", {
          ...pendingAction,
          origen: origin,
          destino: zoneLabel
        });
        setSelectionStep(0);
        setOrigin(null);
      }
    }
  };

  const renderActionGroup = (title: string, category: string, color: string, subs: string[]) => (
    <View style={tw`mb-6 ${!canPerformAction(category) ? 'opacity-20 pointer-events-none' : ''}`}>
      <Text style={tw`text-slate-500 font-black text-[10px] uppercase mb-3`}>{title}</Text>
      <View style={tw`flex-row flex-wrap gap-2`}>
        {subs.map(sub => (
          <View 
            key={sub}
            // @ts-ignore - Para que TS no llore con el hover en Web
            onMouseEnter={() => setHoveredAction(sub)}
            // @ts-ignore
            onMouseLeave={() => setHoveredAction(null)}
          >
            <TouchableOpacity
              onPress={() => handleActionClick(category, sub)}
              disabled={!canPerformAction(category)}
              style={[
                tw`px-4 py-3 rounded-xl border min-w-[70px] items-center`,
                pendingAction?.subAction === sub 
                  ? tw`${color} border-white shadow-lg` 
                  : tw`bg-slate-800 border-slate-700`
              ]}
            >
              <Text style={[
                tw`font-black text-xs`, 
                pendingAction?.subAction === sub ? tw`text-white` : tw`text-slate-400`
              ]}>
                {sub}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );

  const zones = ['1', '6', '5', '2', '3', '4']; // Zonas estándar de voleibol

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

      {/* --- CONTENEDOR FLEX-ROW PARA SIDEBAR Y CONTENIDO --- */}
      <View style={tw`flex-1 flex-row overflow-hidden`}>

        {/* --- SIDEBAR MANUAL DINÁMICO --- */}
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

        {/* CONTENIDO PRINCIPAL */}
        <View style={tw`flex-1 bg-slate-900 flex-col overflow-hidden relative`}>
          
          {/* BOTÓN PARA REABRIR EL MANUAL (Solo visible si está cerrado) */}
          {!isManualOpen && (
            <TouchableOpacity 
              onPress={() => setIsManualOpen(true)}
              style={tw`absolute left-4 top-4 z-50 bg-slate-800 p-2 rounded-full border border-slate-700 shadow-lg`}
            >
              <Ionicons name="book-outline" size={24} color="#eab308" />
            </TouchableOpacity>
          )}

          <View style={tw`flex-1 flex-col`}>
            {/* HEADER / MARCADOR */}
            <View style={[
              tw`h-32 border-b border-slate-800 flex-row items-center justify-between px-10 transition-colors duration-300`,
              blink ? tw`bg-red-600` : tw`bg-slate-900`
            ]}>
              <View style={tw`items-center`}>
                <Text style={tw`text-slate-100 font-black text-2xl mb-1`}>{eventData?.teamA?.name || 'EQUIPO A'}</Text>
                <View style={tw`flex-row items-center gap-2`}>
                  <Ionicons name={wind.A === 'A FAVOR' ? 'arrow-up-circle' : 'arrow-down-circle'} size={16} color="#94a3b8" />
                  <Text style={tw`text-slate-400 font-bold text-[10px]`}>VIENTO: {wind.A}</Text>
                </View>
                <Text style={tw`text-cyan-400 font-black mt-1`}>SETS: {sets.A}</Text>
              </View>

              <View style={tw`items-center bg-slate-800 px-12 py-4 rounded-3xl border border-slate-700 shadow-2xl`}>
                <Text style={tw`text-slate-500 font-black text-[10px] tracking-[0.3em] mb-2`}>PUNTUACIÓN</Text>
                <View style={tw`flex-row items-center gap-8`}>
                  <Text style={tw`text-6xl font-black text-white`}>{score.A}</Text>
                  <View style={tw`w-2 h-2 rounded-full bg-slate-600`} />
                  <Text style={tw`text-6xl font-black text-white`}>{score.B}</Text>
                </View>
              </View>

              <View style={tw`items-center`}>
                <Text style={tw`text-slate-100 font-black text-2xl mb-1`}>{eventData?.teamB?.name || 'EQUIPO B'}</Text>
                <View style={tw`flex-row items-center gap-2`}>
                  <Ionicons name={wind.B === 'A FAVOR' ? 'arrow-up-circle' : 'arrow-down-circle'} size={16} color="#94a3b8" />
                  <Text style={tw`text-slate-400 font-bold text-[10px]`}>VIENTO: {wind.B}</Text>
                </View>
                <Text style={tw`text-cyan-400 font-black mt-1`}>SETS: {sets.B}</Text>
              </View>
            </View>

            {/* CONTENIDO PRINCIPAL: CANCHA Y BOTONES */}
            <View style={tw`flex-1 flex-row p-8 gap-8`}>
              {/* LADO IZQUIERDO: CANCHA TÁCTICA */}
              <View style={tw`flex-1 bg-slate-800/50 rounded-3xl p-6 border border-slate-800`}>
                <View style={tw`flex-row justify-between items-center mb-6`}>
                  <Text style={tw`text-slate-100 font-black text-lg`}>Cancha Táctica</Text>
                  <View style={tw`bg-slate-900 px-4 py-2 rounded-full border border-slate-700`}>
                    <Text style={tw`text-yellow-400 font-black text-[10px] uppercase`}>
                      {selectionStep === 0 ? 'Selecciona una acción' : selectionStep === 1 ? 'Punto de ORIGEN' : 'Punto de DESTINO'}
                    </Text>
                  </View>
                </View>

                <View style={tw`flex-1 flex-row`}>
                  {/* Equipo A */}
                  <View style={tw`flex-1 border-r-2 border-slate-700 pr-2`}>
                    <View style={tw`flex-1 flex-row flex-wrap`}>
                      {zones.map(z => (
                        <View key={`A-${z}`} style={tw`w-1/3`}>
                          <CourtZone
                            label={`A${z}`}
                            team="A"
                            active={selectionStep > 0}
                            isSelected={origin === `A${z}`}
                            onPress={() => handleZoneClick(`A${z}`)}
                          />
                        </View>
                      ))}
                    </View>
                  </View>
                  {/* Equipo B */}
                  <View style={tw`flex-1 pl-2`}>
                    <View style={tw`flex-1 flex-row flex-wrap`}>
                      {zones.map(z => (
                        <View key={`B-${z}`} style={tw`w-1/3`}>
                          <CourtZone
                            label={`B${z}`}
                            team="B"
                            active={selectionStep > 0}
                            isSelected={origin === `B${z}`}
                            onPress={() => handleZoneClick(`B${z}`)}
                          />
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              </View>

              {/* LADO DERECHO: ACCIONES */}
              <ScrollView style={tw`w-1/3 pr-2`}>
                {renderActionGroup('Servicio', 'SERVICIO', 'bg-cyan-600', ['BAJ', 'FLO', 'SAL', 'SAF'])}
                {renderActionGroup('Ataque', 'ATAQUE', 'bg-yellow-600', ['RM', 'Rca', 'Ub', 'Tr', 'Acd', 'Rdjn'])}
                {renderActionGroup('Bloqueo', 'BLOQUEO', 'bg-red-600', ['Bl', 'Bd', 'Bn'])}
                {renderActionGroup('Defensa', 'DEFENSA', 'bg-green-600', ['Dd', 'Dltd', 'Ld', 'Cc'])}
                {renderActionGroup('Recepción', 'RECEPCION', 'bg-indigo-600', ['2ma', 'Ppm'])}
                {renderActionGroup('Errores', 'ERRORES', 'bg-orange-600', ['Ens', 'Enr', 'Enp', 'Enm'])}
              </ScrollView>
            </View>

            {/* FOOTER: CRONÓMETROS Y CONTROL */}
            <View style={tw`h-24 bg-slate-800 border-t border-slate-700 flex-row items-center justify-between px-10`}>
              <View style={tw`flex-row gap-8`}>
                <View>
                  <Text style={tw`text-slate-500 font-black text-[10px] uppercase`}>Tiempo Total</Text>
                  <Text style={tw`text-slate-100 font-mono text-2xl font-bold`}>{timers.formattedTotalTime}</Text>
                </View>
                <View>
                  <View style={tw`flex-row items-center gap-2`}>
                    <View style={tw`w-2 h-2 rounded-full ${timers.isRealTimeActive ? 'bg-green-500 animate-pulse' : 'bg-slate-600'}`} />
                    <Text style={tw`text-slate-500 font-black text-[10px] uppercase`}>Tiempo de Juego</Text>
                  </View>
                  <Text style={[tw`font-mono text-2xl font-bold`, timers.isRealTimeActive ? tw`text-green-400` : tw`text-slate-400`]}>{timers.formattedRealTime}</Text>
                </View>
              </View>

              <View style={tw`flex-row gap-4`}>
                <TouchableOpacity
                  onPress={() => timers.isRealTimeActive ? timers.stopRealTime() : timers.startRealTime()}
                  style={tw`bg-slate-700 px-6 py-3 rounded-xl border border-slate-600 flex-row items-center`}
                >
                  <Ionicons name={timers.isRealTimeActive ? 'pause' : 'play'} size={20} color="white" style={tw`mr-2`} />
                  <Text style={tw`text-white font-black text-xs uppercase`}>{timers.isRealTimeActive ? 'Pausar Juego' : 'Reanudar Juego'}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => commitPoint('A')}
                  style={tw`bg-red-600 px-8 py-3 rounded-xl shadow-lg shadow-red-900/40`}
                >
                  <Text style={tw`text-white font-black text-xs uppercase`}>Punto A</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => commitPoint('B')}
                  style={tw`bg-blue-600 px-8 py-3 rounded-xl shadow-lg shadow-blue-900/40`}
                >
                  <Text style={tw`text-white font-black text-xs uppercase`}>Punto B</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}