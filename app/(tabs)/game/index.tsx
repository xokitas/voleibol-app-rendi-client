// app/(tabs)/game/index.tsx
import CustomModal from "@/components/CustomModal";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import HeaderMenu from "../../../components/HeaderMenu";
import ReferencePanel from "../../../components/ReferencePanel";
import { useGameTimers } from "../../../hooks/useGameTimers";
import { useScoutingLogic } from "../../../hooks/useScoutingLogic";
import { useStats } from "../../../hooks/useStats";
import tw from "../../../lib/tailwind";
import { useMatchStore } from "../../../src/store/useMatchStore";

// ==========================================
// CONSTANTES (idénticas a web)
// ==========================================
const categoryColors: Record<string, string> = {
  SERVICIO: "bg-[#93c5fd]",
  RECEPCION: "bg-[#86efac]",
  ACOMODADA: "bg-[#fbcfe8]",
  ATAQUE: "bg-[#fde047]",
  BLOQUEO: "bg-[#c084fc]",
  DEFENSA: "bg-[#166534]",
  ERRORES_SERV: "bg-[#4b5563]",
  ERRORES_COM: "bg-[#4b5563]",
  ERRORES_POS: "bg-[#4b5563]",
  ERRORES_TEC: "bg-[#4b5563]",
};

const actionAllowedValues: Record<string, number[]> = {
  SFC: [0],
  SR: [0],
  SME: [0],
  CI: [0],
  MC: [0],
  NAT: [0],
  CJR: [0],
  MCA: [0],
  JFZ: [0],
  GMD: [0],
  TI: [0],
  MER: [0],
  BTR: [0],
  Bn: [0, 1, 2, 3],
  "2ma": [0, 1, 2, 3],
  Ppm: [0, 1, 2, 3],
  P2a: [0, 1, 2, 3],
  P2b: [0, 1, 2, 3],
  Dd: [0, 1, 2, 3],
  Dltd: [0, 1, 2, 3],
  Rca: [4],
  Ub: [4],
  Acd: [4],
  Rdjn: [4],
  Rdpmp: [4],
  Rd: [4],
};

const zoneLabels: Record<string, string> = {
  "A-TI": "TI",
  "A-TC": "TC",
  "A-TD": "TD",
  "A-DI": "DI",
  "A-DC": "DC",
  "A-DD": "DD",
  "B-TI": "TI",
  "B-TC": "TC",
  "B-TD": "TD",
  "B-DI": "DI",
  "B-DC": "DC",
  "B-DD": "DD",
};

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
export default function GameScreenMobile() {
  const router = useRouter();
  const currentMatch = useMatchStore((s) => s.currentMatch);
  const saveCurrentMatch = useMatchStore((s) => s.saveCurrentMatch);
  const clearCurrentMatch = useMatchStore((s) => s.clearCurrentMatch);
  const eventData = currentMatch?.config;
  const isTraining =
    eventData?.eventType === "entrenamiento" ||
    eventData?.eventType === "Entrenamiento";

  useEffect(() => {
    if (!currentMatch) router.replace("/(tabs)/menu");
  }, [currentMatch]);

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
    editRallyAction,
    rallyHistory,
    isEditingAction,
  } = useScoutingLogic();

  const timers = useGameTimers();
  const { width } = useWindowDimensions();

  // Estados locales para la cascada de acciones
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeSubAction, setActiveSubAction] = useState<string | null>(null);
  const [showValueSelector, setShowValueSelector] = useState(false);
  const [showZoneSelector, setShowZoneSelector] = useState(false);
  const [originZone, setOriginZone] = useState<string | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);

  // Estados para sustituciones
  const [activePlayersA, setActivePlayersA] = useState<number[]>([0, 1]);
  const [activePlayersB, setActivePlayersB] = useState<number[]>([0, 1]);
  const [showSubModal, setShowSubModal] = useState<{
    team: "A" | "B";
    index: number;
  } | null>(null);

  const { getPlayerStats } = useStats(rallyHistory || [], actionAllowedValues);

  // Modal de confirmación
  const [modal, setModal] = useState({
    visible: false,
    title: "",
    message: "",
    type: "warning" as "warning" | "danger" | "info",
    onConfirm: () => {},
    onSecondary: undefined as (() => void) | undefined,
    confirmText: "Aceptar",
    secondaryText: undefined as string | undefined,
  });

  const showModal = (
    title: string,
    message: string,
    type: "warning" | "danger" | "info",
    onConfirm: () => void,
    onSecondary?: () => void,
    confirmText = "Aceptar",
    secondaryText?: string,
  ) => {
    setModal({
      visible: true,
      title,
      message,
      type,
      onConfirm,
      onSecondary,
      confirmText,
      secondaryText,
    });
  };
  const hideModal = () => setModal((prev) => ({ ...prev, visible: false }));

  // Efectos de set/partido
  useEffect(() => {
    if (currentSet > 1) {
      timers.stopRealTime();
      showModal(
        "¡SET FINALIZADO!",
        `Los equipos deben cambiar de lado para el Set ${currentSet}.`,
        "info",
        () => {
          hideModal();
          toggleWind();
        },
      );
    }
  }, [currentSet]);

  useEffect(() => {
    if (sets.A === 2 || sets.B === 2) {
      timers.stopRealTime();
      timers.stopTotalTime();
      showModal(
        "¡PARTIDO FINALIZADO!",
        `Ganador: ${sets.A === 2 ? "EQUIPO A" : "EQUIPO B"}`,
        "info",
        () => {
          saveCurrentMatch("finished");
          router.replace("/(tabs)/menu");
        },
      );
    }
  }, [sets.A, sets.B]);

  // Iniciar/reanudar cronómetros al seleccionar una sub‑acción (no al seleccionar jugador)
  useEffect(() => {
    if (pendingAction && !isEditingAction && !timers.isRealTimeActive) {
      timers.startRealTime();
      if (!timers.isTotalTimeActive) {
        timers.startTotalTime();
        setHasStarted(true);
      }
    }
  }, [pendingAction, isEditingAction]);

  // --- MANEJO DE LA CASCADA MÓVIL ---
  const handleCategoryPress = (category: string) => {
    if (!selectedPlayerId) return;
    setActiveCategory(category);
    setActiveSubAction(null);
    setShowValueSelector(false);
    setShowZoneSelector(false);
  };

  const handleSubActionPress = (subAction: string) => {
    if (!activeCategory) return;
    setActiveSubAction(subAction);
    handleActionClick(activeCategory, subAction);
    setShowValueSelector(true);
  };

  const handleValuePress = (value: number) => {
    confirmActionValue(value);
    setShowValueSelector(false);
    setShowZoneSelector(true);
    setActiveCategory(null);
    setActiveSubAction(null);
  };

  const handleZonePress = (zoneId: string) => {
    if (!showZoneSelector) return;
    if (!originZone) {
      setOriginZone(zoneId);
    } else {
      updatePendingZones(originZone, zoneId);
      setOriginZone(null);
      setShowZoneSelector(false);
    }
  };

  // --- ACCIONES DEL FOOTER ---
  const handleAutoCommit = () => {
    if (currentRally.length === 0) return;
    const lastAction = currentRally[currentRally.length - 1];
    const teamOfAction = lastAction.playerId.startsWith("A") ? "A" : "B";
    const opponentTeam = teamOfAction === "A" ? "B" : "A";
    if (lastAction.value === 4) commitPoint(teamOfAction);
    else if (lastAction.value === 0) commitPoint(opponentTeam);
    else
      showModal(
        "Punto del Rally",
        "¿Qué equipo ganó el punto?",
        "warning",
        () => commitPoint(teamOfAction),
        () => commitPoint(opponentTeam),
        teamOfAction === "A" ? "Equipo A" : "Equipo B",
        teamOfAction === "A" ? "Equipo B" : "Equipo A",
      );
    timers.startTotalTime(); // mantener el cronómetro total corriendo
  };

  const handleExit = () =>
    showModal(
      "Salir del partido",
      "Elige qué hacer con el partido actual:",
      "warning",
      () => {
        saveCurrentMatch("partial");
        timers.stopRealTime();
        timers.stopTotalTime();
        router.replace("/(tabs)/menu");
      },
      () => {
        clearRally();
        clearCurrentMatch();
        timers.stopRealTime();
        timers.stopTotalTime();
        router.replace("/(tabs)/menu");
      },
      "Guardar y salir",
      "Salir sin guardar",
    );

  // Manejo de QuickNav: mismo modal que handleExit pero redirige a la ruta elegida
  const handleQuickNav = (route: string) => {
    if (currentMatch) {
      showModal(
        "Salir del partido",
        "Elige qué hacer con el partido actual:",
        "warning",
        () => {
          saveCurrentMatch("partial");
          timers.stopRealTime();
          timers.stopTotalTime();
          router.replace(route as any);
        },
        () => {
          clearRally();
          clearCurrentMatch();
          timers.stopRealTime();
          timers.stopTotalTime();
          router.replace(route as any);
        },
        "Guardar y salir",
        "Salir sin guardar",
      );
    } else {
      router.replace(route as any);
    }
  };

  const handlePartialSave = () =>
    showModal(
      "Suspender Partido",
      "¿Guardar el parcial actual?",
      "warning",
      () => {
        saveCurrentMatch("partial");
        timers.stopRealTime();
        timers.stopTotalTime();
        router.replace("/(tabs)/menu");
      },
    );

  const handleFinishMatch = () =>
    showModal(
      "Finalizar Partido",
      "¿Finalizar definitivamente?",
      "danger",
      () => {
        saveCurrentMatch("finished");
        timers.stopRealTime();
        timers.stopTotalTime();
        router.replace("/(tabs)/menu");
      },
    );

  // --- SUB-ACCIONES SEGÚN CATEGORÍA ACTIVA ---
  const subActionsForCategory = (cat: string): string[] => {
    const map: Record<string, string[]> = {
      SERVICIO: ["BAJ", "FLO", "SAL", "SAF"],
      RECEPCION: ["2ma", "Ppm"],
      ACOMODADA: ["P2a", "P2b"],
      ATAQUE: ["Rm", "Rca", "Ub", "Tr", "Acd", "Rdjn", "Rdpmp", "Rd"],
      BLOQUEO: ["Bl", "Bd", "Bn"],
      DEFENSA: ["Dd", "Dltd", "Ld", "Cc"],
      ERRORES_SERV: ["SFC", "SR", "SME"],
      ERRORES_COM: ["CI", "MC"],
      ERRORES_POS: ["NAT", "CJR", "MCA", "JFZ"],
      ERRORES_TEC: ["GMD", "TI", "MER", "BTR"],
    };
    return map[cat] || [];
  };

  // Funciones auxiliares para índices de jugadores
  const playersAOriginalIndex = (player: any) =>
    eventData?.teamA?.players?.findIndex(
      (p: any) => p.number === player.number,
    ) ?? -1;
  const playersBOriginalIndex = (player: any) =>
    eventData?.teamB?.players?.findIndex(
      (p: any) => p.number === player.number,
    ) ?? -1;

  return (
    <SafeAreaView style={tw`flex-1 bg-slate-950`}>
      <HeaderMenu
        dark={true}
        title="PANEL DE JUEGO"
        onBack={handleExit}
        showQuickNav={true}
        compact={true}
        onNavigate={handleQuickNav}
      />

      <ScrollView contentContainerStyle={tw`p-2 pb-4`}>
        {/* MARCADOR SUPERIOR */}
        <View
          style={tw`flex-row justify-between items-center bg-slate-900 rounded-xl p-2 mb-2 border border-slate-800`}
        >
          {/* Equipo A */}
          <View style={tw`flex-1 items-center`}>
            <Text style={tw`text-white font-black text-xs`}>
              {eventData?.teamA?.name || "EQUIPO A"}
            </Text>
            <View style={tw`flex-row gap-1 mt-1`}>
              {eventData?.teamA?.players
                ?.filter((_: any, i: number) => activePlayersA.includes(i))
                .map((p: any, indexInActive: number) => {
                  const originalIndex = activePlayersA[indexInActive];
                  const pid = `A-${p.number}`;
                  const isSel = selectedPlayerId === pid;
                  return (
                    <View
                      key={`playerA-${originalIndex}`}
                      style={tw`flex-row items-center`}
                    >
                      <TouchableOpacity
                        onPress={() => handlePlayerSelect(pid)}
                        style={tw`px-2 py-1 rounded-lg border ${isSel ? "bg-blue-600 border-blue-400" : "bg-slate-800 border-slate-700"}`}
                      >
                        <Text
                          style={tw`${isSel ? "text-white" : "text-blue-300"} font-bold text-[9px]`}
                        >
                          #{p.number}
                        </Text>
                      </TouchableOpacity>
                      {isTraining && (
                        <TouchableOpacity
                          onPress={() =>
                            setShowSubModal({ team: "A", index: indexInActive })
                          }
                          style={tw`ml-1 p-1 rounded bg-slate-700`}
                        >
                          <Ionicons
                            name="swap-horizontal"
                            size={10}
                            color="#94a3b8"
                          />
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
            </View>
          </View>

          {/* Puntuación */}
          <View style={tw`items-center px-3`}>
            <View style={tw`flex-row items-center gap-2`}>
              <Text style={tw`text-white text-2xl font-black`}>{score.A}</Text>
              <Text style={tw`text-slate-500 text-xs font-bold`}>-</Text>
              <Text style={tw`text-white text-2xl font-black`}>{score.B}</Text>
            </View>
            <Text style={tw`text-yellow-500 font-black text-[10px] mt-1`}>
              SET {currentSet}
            </Text>
          </View>

          {/* Equipo B */}
          <View style={tw`flex-1 items-center`}>
            <Text style={tw`text-white font-black text-xs`}>
              {eventData?.teamB?.name || "EQUIPO B"}
            </Text>
            <View style={tw`flex-row gap-1 mt-1`}>
              {eventData?.teamB?.players
                ?.filter((_: any, i: number) => activePlayersB.includes(i))
                .map((p: any, indexInActive: number) => {
                  const originalIndex = activePlayersB[indexInActive];
                  const pid = `B-${p.number}`;
                  const isSel = selectedPlayerId === pid;
                  return (
                    <View
                      key={`playerB-${originalIndex}`}
                      style={tw`flex-row items-center`}
                    >
                      <TouchableOpacity
                        onPress={() => handlePlayerSelect(pid)}
                        style={tw`px-2 py-1 rounded-lg border ${isSel ? "bg-red-600 border-red-400" : "bg-slate-800 border-slate-700"}`}
                      >
                        <Text
                          style={tw`${isSel ? "text-white" : "text-red-300"} font-bold text-[9px]`}
                        >
                          #{p.number}
                        </Text>
                      </TouchableOpacity>
                      {isTraining && (
                        <TouchableOpacity
                          onPress={() =>
                            setShowSubModal({ team: "B", index: indexInActive })
                          }
                          style={tw`ml-1 p-1 rounded bg-slate-700`}
                        >
                          <Ionicons
                            name="swap-horizontal"
                            size={10}
                            color="#94a3b8"
                          />
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
            </View>
          </View>
        </View>

        {/* CANCHA + BOTONES DE CATEGORÍA */}
        <View style={tw`flex-row gap-2`}>
          {/* CANCHA (6 zonas por lado) */}
          <View
            style={tw`flex-1 bg-slate-900 border border-slate-700 rounded-xl p-1`}
          >
            <View style={tw`flex-row`}>
              {/* Lado A */}
              <View style={tw`flex-1`}>
                {["A-TI", "A-TC", "A-TD", "A-DI", "A-DC", "A-DD"].map(
                  (zone) => (
                    <TouchableOpacity
                      key={zone}
                      onPress={() => handleZonePress(zone)}
                      disabled={!showZoneSelector}
                      style={tw`h-8 m-0.5 rounded border justify-center items-center ${showZoneSelector ? "bg-slate-800 border-yellow-500/40" : "bg-slate-900 border-slate-800"} ${originZone === zone ? "bg-yellow-500/20 border-yellow-400" : ""}`}
                    >
                      <Text
                        style={tw`text-[8px] font-bold ${showZoneSelector ? "text-yellow-400" : "text-slate-600"}`}
                      >
                        {zoneLabels[zone]}
                      </Text>
                    </TouchableOpacity>
                  ),
                )}
              </View>
              {/* Red */}
              <View style={tw`w-1 bg-yellow-500/30 mx-1`} />
              {/* Lado B */}
              <View style={tw`flex-1`}>
                {["B-TI", "B-TC", "B-TD", "B-DI", "B-DC", "B-DD"].map(
                  (zone) => (
                    <TouchableOpacity
                      key={zone}
                      onPress={() => handleZonePress(zone)}
                      disabled={!showZoneSelector}
                      style={tw`h-8 m-0.5 rounded border justify-center items-center ${showZoneSelector ? "bg-slate-800 border-yellow-500/40" : "bg-slate-900 border-slate-800"} ${originZone === zone ? "bg-yellow-500/20 border-yellow-400" : ""}`}
                    >
                      <Text
                        style={tw`text-[8px] font-bold ${showZoneSelector ? "text-yellow-400" : "text-slate-600"}`}
                      >
                        {zoneLabels[zone]}
                      </Text>
                    </TouchableOpacity>
                  ),
                )}
              </View>
            </View>
          </View>

          {/* CATEGORÍAS */}
          <View style={tw`w-24 gap-1`}>
            {[
              "SERVICIO",
              "RECEPCION",
              "ACOMODADA",
              "ATAQUE",
              "BLOQUEO",
              "DEFENSA",
              "ERRORES_SERV",
              "ERRORES_COM",
              "ERRORES_POS",
              "ERRORES_TEC",
            ].map((cat) => {
              const isSuggested = canPerformAction(cat);
              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => handleCategoryPress(cat)}
                  style={tw`py-1.5 px-2 rounded-lg border ${activeCategory === cat ? "bg-white border-white" : categoryColors[cat] || "bg-slate-800 border-slate-700"} ${isSuggested ? "border-cyan-400 border-2" : "opacity-70"}`}
                >
                  <Text
                    style={tw`text-[8px] font-black text-center ${activeCategory === cat ? "text-slate-900" : "text-white"}`}
                  >
                    {cat.replace("ERRORES_", "E.").substring(0, 4)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* POPOVER DE SUB-ACCIONES */}
        {activeCategory && !showValueSelector && (
          <View
            style={tw`bg-slate-800 border border-slate-600 rounded-xl p-2 mt-2 flex-row flex-wrap gap-1`}
          >
            {subActionsForCategory(activeCategory).map((sub) => (
              <TouchableOpacity
                key={sub}
                onPress={() => handleSubActionPress(sub)}
                style={tw`px-3 py-1.5 rounded-lg ${activeSubAction === sub ? "bg-white" : "bg-slate-700"}`}
              >
                <Text
                  style={tw`text-[10px] font-bold ${activeSubAction === sub ? "text-slate-900" : "text-white"}`}
                >
                  {sub}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* POPOVER DE VALORES */}
        {showValueSelector && pendingAction && (
          <View
            style={tw`bg-slate-800 border border-slate-600 rounded-xl p-2 mt-2 flex-row justify-center gap-2`}
          >
            {(
              actionAllowedValues[pendingAction.subAction] || [0, 1, 2, 3, 4]
            ).map((val) => (
              <TouchableOpacity
                key={val}
                onPress={() => handleValuePress(val)}
                style={tw`w-10 h-10 rounded-full items-center justify-center ${val === 0 ? "bg-red-600" : val === 4 ? "bg-green-600" : "bg-blue-600"}`}
              >
                <Text style={tw`text-white font-black text-sm`}>{val}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* INDICADOR DE ZONA ACTUAL */}
        {showZoneSelector && (
          <Text
            style={tw`text-yellow-400 text-[10px] font-bold text-center mt-2`}
          >
            {originZone
              ? "Selecciona la zona de destino"
              : "Selecciona la zona de origen"}
          </Text>
        )}

        {/* TICKET DEL RALLY */}
        <View
          style={tw`bg-slate-900 rounded-xl p-2 mt-2 border border-slate-800 flex-row items-center`}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={tw`flex-1`}
          >
            {currentRally.length === 0 ? (
              <Text style={tw`text-slate-500 text-[10px]`}>
                Esperando rally...
              </Text>
            ) : (
              currentRally.map((action, idx) => (
                <View
                  key={idx}
                  style={tw`flex-row items-center bg-slate-800 rounded-lg px-2 py-1 mr-1`}
                >
                  <Text style={tw`text-cyan-400 text-[9px] font-bold`}>
                    {action.playerId}
                  </Text>
                  <Text style={tw`text-white text-[9px] mx-1`}>
                    {action.subAction} ({action.value})
                  </Text>
                </View>
              ))
            )}
          </ScrollView>
          {currentRally.length > 0 && (
            <TouchableOpacity
              onPress={handleAutoCommit}
              style={tw`bg-cyan-600 px-3 py-1.5 rounded-lg ml-2`}
            >
              <Text style={tw`text-white font-black text-[9px]`}>GUARDAR</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* FOOTER */}
        <View
          style={tw`flex-row justify-between items-center mt-2 pt-2 border-t border-slate-800`}
        >
          <View style={tw`flex-row gap-2`}>
            <Text style={tw`text-slate-400 text-[9px] font-bold`}>
              REAL: {timers.formattedRealTime}
            </Text>
            <Text style={tw`text-slate-400 text-[9px] font-bold`}>
              TOTAL: {timers.formattedTotalTime}
            </Text>
          </View>
          <View style={tw`flex-row gap-2`}>
            <TouchableOpacity
              onPress={() => setShowStatsModal(true)}
              style={tw`bg-slate-800 p-2 rounded-lg`}
            >
              <Ionicons name="stats-chart" size={14} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowManualModal(true)}
              style={tw`bg-slate-800 p-2 rounded-lg`}
            >
              <Ionicons name="book" size={14} color="#fbbf24" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                if (!timers.isTotalTimeActive) {
                  timers.startTotalTime();
                  timers.startRealTime();
                  setHasStarted(true);
                } else
                  timers.isRealTimeActive
                    ? timers.stopRealTime()
                    : timers.startRealTime();
              }}
              style={tw`px-3 py-1.5 rounded-lg ${!timers.isTotalTimeActive ? "bg-green-600" : timers.isRealTimeActive ? "bg-orange-600" : "bg-green-600"}`}
            >
              <Text style={tw`text-white font-black text-[9px]`}>
                {!timers.isTotalTimeActive
                  ? "COMENZAR"
                  : timers.isRealTimeActive
                    ? "PAUSAR"
                    : "REANUDAR"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handlePartialSave}
              style={tw`bg-slate-700 px-3 py-1.5 rounded-lg`}
            >
              <Text style={tw`text-red-400 font-black text-[9px]`}>
                PARCIAL
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleFinishMatch}
              style={tw`bg-blue-600 px-3 py-1.5 rounded-lg`}
            >
              <Text style={tw`text-white font-black text-[9px]`}>
                FINALIZAR
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* MODAL ESTADÍSTICAS */}
      <Modal
        visible={showStatsModal}
        animationType="slide"
        onRequestClose={() => setShowStatsModal(false)}
      >
        <SafeAreaView style={tw`flex-1 bg-slate-950`}>
          <View
            style={tw`flex-row justify-between items-center p-4 border-b border-slate-800`}
          >
            <Text style={tw`text-white font-black text-base uppercase`}>
              Análisis de Rendimiento
            </Text>
            <TouchableOpacity onPress={() => setShowStatsModal(false)}>
              <Ionicons name="close-circle" size={28} color="white" />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={tw`p-4`}>
            {[
              ...(eventData?.teamA?.players || []).map((p: any) => ({
                ...p,
                team: "A",
              })),
              ...(eventData?.teamB?.players || []).map((p: any) => ({
                ...p,
                team: "B",
              })),
            ].map((player: any, idx: number) => {
              const pId = `${player.team}-${player.number}`;
              const stats = getPlayerStats(pId);
              if (!stats) return null;
              const isTeamA = player.team === "A";
              return (
                <View
                  key={idx}
                  style={tw`${isTeamA ? "bg-blue-900/20 border-blue-500" : "bg-red-900/20 border-red-500"} p-3 rounded-xl border mb-3`}
                >
                  <View style={tw`flex-row justify-between items-center mb-2`}>
                    <Text
                      style={tw`${isTeamA ? "text-blue-400" : "text-red-400"} font-black text-xs`}
                    >
                      #{player.number} {player.fullName}
                    </Text>
                    <Text style={tw`text-white font-bold text-xs`}>
                      {stats.general.efficiency}% EFF
                    </Text>
                  </View>
                  <View style={tw`flex-row gap-1`}>
                    {["SRV", "REC", "SET", "ATK", "BLK", "DEF"].map(
                      (lbl, i) => {
                        const vals = [
                          stats.serve.eff,
                          stats.receive.eff,
                          stats.set.eff,
                          stats.attack.eff,
                          stats.block.eff,
                          stats.defense.eff,
                        ];
                        return (
                          <View
                            key={lbl}
                            style={tw`flex-1 bg-slate-800 p-1 rounded items-center`}
                          >
                            <Text style={tw`text-slate-400 text-[7px]`}>
                              {lbl}
                            </Text>
                            <Text style={tw`text-white text-[9px] font-bold`}>
                              {vals[i]}%
                            </Text>
                          </View>
                        );
                      },
                    )}
                  </View>
                  <Text style={tw`text-slate-400 text-[8px] mt-1`}>
                    Acc: {stats.general.totalActions} | Err:{" "}
                    {stats.general.errors}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* MODAL MANUAL */}
      <Modal
        visible={showManualModal}
        animationType="slide"
        onRequestClose={() => setShowManualModal(false)}
      >
        <SafeAreaView style={tw`flex-1 bg-slate-950`}>
          <View
            style={tw`flex-row justify-between items-center p-4 border-b border-slate-800`}
          >
            <Text style={tw`text-white font-black text-base uppercase`}>
              Manual de Usuario
            </Text>
            <TouchableOpacity onPress={() => setShowManualModal(false)}>
              <Ionicons name="close-circle" size={28} color="white" />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={tw`p-4`}>
            <ReferencePanel
              dark={true}
              isOpen={true}
              setIsOpen={() => {}}
              hoveredAction={null}
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* MODAL DE SUSTITUCIÓN */}
      <Modal
        visible={!!showSubModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSubModal(null)}
      >
        <View style={tw`flex-1 justify-end bg-black/60`}>
          <View style={tw`bg-slate-900 rounded-t-3xl p-4`}>
            <Text style={tw`text-white font-black text-lg mb-4`}>
              Sustituir jugador
            </Text>
            {[
              ...(eventData?.teamA?.players || []).map((p: any) => ({
                ...p,
                team: "A",
              })),
              ...(eventData?.teamB?.players || []).map((p: any) => ({
                ...p,
                team: "B",
              })),
            ].map((player, idx) => {
              const team = player.team;
              const playerNumber = player.number;
              const isActive =
                (team === "A" &&
                  activePlayersA.includes(playersAOriginalIndex(player))) ||
                (team === "B" &&
                  activePlayersB.includes(playersBOriginalIndex(player)));
              return (
                <TouchableOpacity
                  key={`sub-${team}-${playerNumber}`}
                  onPress={() => {
                    if (!showSubModal) return;
                    const { team: targetTeam, index } = showSubModal;
                    const selectedTeamPlayers =
                      team === "A"
                        ? eventData?.teamA?.players
                        : eventData?.teamB?.players;
                    if (!selectedTeamPlayers) return;
                    const selectedIndex = selectedTeamPlayers.findIndex(
                      (p: any) => p.number === playerNumber,
                    );
                    if (selectedIndex === -1) return;
                    if (targetTeam === team) {
                      if (targetTeam === "A") {
                        setActivePlayersA((prev) =>
                          prev.map((i) => (i === index ? selectedIndex : i)),
                        );
                      } else {
                        setActivePlayersB((prev) =>
                          prev.map((i) => (i === index ? selectedIndex : i)),
                        );
                      }
                    } else {
                      if (targetTeam === "A") {
                        setActivePlayersA((prev) => {
                          const newA = [...prev];
                          const temp = newA[index]!;
                          newA[index] = selectedIndex;
                          setActivePlayersB((prevB) => {
                            const newB = [...prevB];
                            const idxInB = newB.indexOf(selectedIndex);
                            if (idxInB !== -1) newB[idxInB] = temp;
                            else if (index < newB.length) newB[index] = temp;
                            return newB;
                          });
                          return newA;
                        });
                      } else {
                        setActivePlayersB((prev) => {
                          const newB = [...prev];
                          const temp = newB[index]!;
                          newB[index] = selectedIndex;
                          setActivePlayersA((prevA) => {
                            const newA = [...prevA];
                            const idxInA = newA.indexOf(selectedIndex);
                            if (idxInA !== -1) newA[idxInA] = temp;
                            else if (index < newA.length) newA[index] = temp;
                            return newA;
                          });
                          return newB;
                        });
                      }
                    }
                    setShowSubModal(null);
                  }}
                  style={tw`p-3 border-b border-slate-700 flex-row justify-between items-center`}
                >
                  <Text style={tw`text-white`}>
                    #{player.number} {player.fullName} ({player.team})
                  </Text>
                  {isActive && (
                    <Text style={tw`text-green-400 text-xs`}>En cancha</Text>
                  )}
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              onPress={() => setShowSubModal(null)}
              style={tw`mt-4 bg-red-600 p-3 rounded-lg`}
            >
              <Text style={tw`text-white text-center font-bold`}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL DE CONFIRMACIÓN GLOBAL */}
      <CustomModal
        visible={modal.visible}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        onConfirm={modal.onConfirm}
        onCancel={hideModal}
        confirmText={modal.confirmText}
        onSecondary={modal.onSecondary}
        secondaryText={modal.secondaryText}
      />
    </SafeAreaView>
  );
}
