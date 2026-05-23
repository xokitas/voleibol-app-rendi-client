// app/(tabs)/game/index.web.tsx
import CustomModal from "@/components/CustomModal";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import HeaderMenu from "../../../components/HeaderMenu";
import ReferencePanel from "../../../components/ReferencePanel";
import { useGameTimers } from "../../../hooks/useGameTimers";
import { useScoutingLogic } from "../../../hooks/useScoutingLogic";
import { useStats } from "../../../hooks/useStats";
import tw from "../../../lib/tailwind";
import { useMatchStore } from "../../../src/store/useMatchStore";

// ==========================================
// 1. CONFIGURACIÓN Y CONSTANTES (sin cambios)
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

const zoneCoords: Record<string, { x: number; y: number }> = {
  "A-TI": { x: 26, y: 40 },
  "A-TC": { x: 26, y: 120 },
  "A-TD": { x: 26, y: 200 },
  "A-DI": { x: 78, y: 40 },
  "A-DC": { x: 78, y: 120 },
  "A-DD": { x: 78, y: 200 },
  "B-DD": { x: 130, y: 40 },
  "B-DC": { x: 130, y: 120 },
  "B-DI": { x: 130, y: 200 },
  "B-TD": { x: 182, y: 40 },
  "B-TC": { x: 182, y: 120 },
  "B-TI": { x: 182, y: 200 },
  "A-OUT-TOP": { x: 65, y: 15 },
  "B-OUT-TOP": { x: 145, y: 15 },
  "A-OUT-BOTTOM": { x: 65, y: 225 },
  "B-OUT-BOTTOM": { x: 145, y: 225 },
  "A-OUT-LEFT": { x: 15, y: 120 },
  "B-OUT-RIGHT": { x: 195, y: 120 },
};

// ==========================================
// 2. COMPONENTES AUXILIARES (sin cambios)
// ==========================================

const CourtZone = ({
  id,
  displayLabel,
  active,
  onPress,
  isSelected,
  type = "grid",
}: {
  id: string;
  displayLabel: string;
  active: boolean;
  onPress: () => void;
  isSelected: boolean;
  type?: "grid" | "out-h" | "out-v";
}) => (
  <TouchableOpacity
    onPress={onPress}
    style={tw`${type === "out-h" ? "h-8 flex-1" : type === "out-v" ? "w-8 h-full" : "flex-1"}
      m-[1px] rounded border justify-center items-center ${
        isSelected
          ? "border-yellow-400 bg-yellow-400/20"
          : active
            ? "border-slate-700 bg-slate-800"
            : "border-slate-800/40 bg-slate-900/10"
      }`}
  >
    <Text
      style={tw`text-[8px] font-bold ${isSelected ? "text-yellow-400" : "text-slate-500"}`}
    >
      {displayLabel}
    </Text>
  </TouchableOpacity>
);

const MiniStatBox = ({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) => (
  <View
    style={tw`flex-1 min-w-[45px] bg-slate-950 p-1 rounded border border-slate-800/50`}
  >
    <Text style={tw`text-slate-500 text-[7px] uppercase font-bold`}>
      {label}
    </Text>
    <Text style={tw`${color} text-[10px] font-black`}>{value}%</Text>
  </View>
);

// ==========================================
// 3. COMPONENTE PRINCIPAL
// ==========================================

export default function GameScreenWeb() {
  const router = useRouter();
  const currentMatch = useMatchStore((s) => s.currentMatch);
  const saveCurrentMatch = useMatchStore((s) => s.saveCurrentMatch);
  const clearCurrentMatch = useMatchStore((s) => s.clearCurrentMatch);
  const eventData = currentMatch?.config;
  const isTraining =
    eventData?.eventType === "entrenamiento" ||
    eventData?.eventType === "Entrenamiento";

  // Redirigir si no hay partido cargado
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

  const initialTotal = currentMatch?.totalTimeSeconds ?? 0;
  const initialReal = currentMatch?.realTimeSeconds ?? 0;
  const timers = useGameTimers(initialTotal, initialReal);

  // ================== ESTADO DEL MODAL ==================
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

  // Estados locales
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [hoveredAction, setHoveredAction] = useState<string | null>(null);
  const [selectionStep, setSelectionStep] = useState(0);
  const [origin, setOrigin] = useState<string | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [blink, setBlink] = useState(false);
  const { getPlayerStats } = useStats(rallyHistory || [], actionAllowedValues);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Estados para sustituciones
  const [activePlayersA, setActivePlayersA] = useState<number[]>([0, 1]);
  const [activePlayersB, setActivePlayersB] = useState<number[]>([0, 1]);
  const [showSubModal, setShowSubModal] = useState<{
    team: "A" | "B";
    index: number;
  } | null>(null);

  // Estado para la ruta pendiente de QuickNav
  const [pendingQuickNavRoute, setPendingQuickNavRoute] = useState<
    string | null
  >(null);

  const handleMouseMove = useCallback((e: any) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });
  }, []);

  // Efectos
  useEffect(() => {
    if (!pendingAction) setIsEditingMode(false);
  }, [pendingAction]);

  useEffect(() => {
    if (currentMatch && !timers.isTotalTimeActive) {
      timers.startTotalTime();
    }
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (mustSwitchSide) interval = setInterval(() => setBlink((b) => !b), 500);
    else setBlink(false);
    return () => clearInterval(interval);
  }, [mustSwitchSide]);

  // Fin de set (modal informativo)
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
        undefined,
        "OK",
      );
    }
  }, [currentSet]);

  // Fin de partido (modal informativo + guardado automático)
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
        undefined,
        "OK",
      );
    }
  }, [sets.A, sets.B]);

  // Pausa automática en cada punto
  useEffect(() => {
    if (score.A > 0 || score.B > 0) timers.stopRealTime();
  }, [score.A, score.B]);

  // Iniciar/reanudar cronómetros automáticamente al comenzar una nueva acción
  useEffect(() => {
    if (pendingAction && !isEditingAction && !timers.isRealTimeActive) {
      timers.startRealTime();
      if (!timers.isTotalTimeActive) {
        timers.startTotalTime();
        setHasStarted(true);
      }
    }
  }, [pendingAction, isEditingAction]);

  // Teclado numérico mejorado con selección rápida de jugadores (1‑4)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Solo si NO hay una acción pendiente, las teclas 1‑4 seleccionan jugador
      if (!pendingAction && ["1", "2", "3", "4"].includes(e.key)) {
        const index = parseInt(e.key) - 1;
        const playersA = eventData?.teamA?.players || [];
        const playersB = eventData?.teamB?.players || [];
        let targetPlayerId: string | null = null;
        if (index === 0 && playersA.length > 0)
          targetPlayerId = `A-${playersA[0].number}`;
        else if (index === 1 && playersA.length > 1)
          targetPlayerId = `A-${playersA[1].number}`;
        else if (index === 2 && playersB.length > 0)
          targetPlayerId = `B-${playersB[0].number}`;
        else if (index === 3 && playersB.length > 1)
          targetPlayerId = `B-${playersB[1].number}`;
        if (targetPlayerId) handlePlayerSelect(targetPlayerId);
        else playErrorBuzzer();
        return;
      }

      // Asignación de valor (0‑4) cuando hay acción pendiente y valor sin definir
      if (pendingAction && pendingAction.value === undefined) {
        let val: number | null = null;
        if (e.key === "`" || e.key === "0" || e.key === "º") val = 0;
        else if (["1", "2", "3", "4"].includes(e.key)) val = parseInt(e.key);
        if (val !== null) {
          const allowed = actionAllowedValues[pendingAction.subAction] || [
            0, 1, 2, 3, 4,
          ];
          if (allowed.includes(val)) confirmActionValue(val);
          else playErrorBuzzer();
        } else if (e.key.length === 1 && /[a-zA-Z0-9]/.test(e.key)) {
          playErrorBuzzer();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pendingAction, confirmActionValue, handlePlayerSelect, eventData]);

  const formatTicketZone = (z?: string) => {
    if (!z) return "z?";
    if (z.startsWith("A-")) return `a${z.slice(2)}`;
    if (z.startsWith("B-")) return `b${z.slice(2)}`;
    return z;
  };

  const playErrorBuzzer = () => {
    try {
      const AudioContext =
        window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      console.error(e);
    }
  };

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
    const teamOfAction = lastAction.playerId.startsWith("A") ? "A" : "B";
    const opponentTeam = teamOfAction === "A" ? "B" : "A";
    if (lastAction.value === 4) commitPoint(teamOfAction);
    else if (lastAction.value === 0) commitPoint(opponentTeam);
    else {
      const nameA = eventData?.teamA?.name || "Equipo A";
      const nameB = eventData?.teamB?.name || "Equipo B";
      showModal(
        "Punto del Rally",
        "¿Qué equipo ganó el punto?",
        "warning",
        () => commitPoint(teamOfAction),
        () => commitPoint(opponentTeam),
        teamOfAction === "A" ? nameA : nameB,
        teamOfAction === "A" ? nameB : nameA,
      );
    }
    timers.startTotalTime(); // asegurar que el cronómetro total nunca se detenga
  };

  const handleExit = () =>
    showModal(
      "Salir del partido",
      "Elige qué hacer con el partido actual:",
      "warning",
      // onConfirm: Guardar y salir → mantiene el partido en curso (no guarda, no borra)
      () => {
        if (currentMatch) {
          currentMatch.totalTimeSeconds = timers.totalTime;
          currentMatch.realTimeSeconds = timers.realTime;
        }
        timers.stopRealTime();
        router.replace("/(tabs)/menu");
      },
      // onSecondary: Salir sin guardar → descarta el partido completamente
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

  const handlePartialSave = () =>
    showModal(
      "Suspender Partido",
      "¿Guardar el parcial actual?",
      "warning",
      () => {
        if (currentMatch) {
          currentMatch.totalTimeSeconds = timers.totalTime;
          currentMatch.realTimeSeconds = timers.realTime;
        }
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
        if (currentMatch) {
          currentMatch.totalTimeSeconds = timers.totalTime;
          currentMatch.realTimeSeconds = timers.realTime;
        }
        saveCurrentMatch("finished");
        timers.stopRealTime();
        timers.stopTotalTime();
        router.replace("/(tabs)/menu");
      },
    );

  // Renderizado de columnas (sin bloqueo, solo resaltado)
  const renderActionColumn = (
    title: string,
    category: string,
    subs: string[],
    isDouble = false,
  ) => {
    const bgColor = categoryColors[category] || "bg-slate-800";
    const isSuggested = canPerformAction(category);
    const columnStyle = isDouble
      ? tw`flex-1 min-w-[35px] ${isStatsOpen ? "min-w-[150px]" : "max-w-[155px]"}`
      : tw`flex-1 min-w-[35px] max-w-[75px]`;
    return (
      <View style={columnStyle}>
        <Text
          style={tw`text-slate-500 font-black text-[9px] uppercase mb-2 text-center`}
        >
          {title}
        </Text>
        <View
          style={tw`${isDouble ? "flex-row flex-wrap justify-between" : "flex-col"} gap-1.5`}
        >
          {subs.map((sub) => (
            <View
              key={sub}
              style={isDouble ? { width: "47%" } : { width: "100%" }}
              // @ts-ignore
              onMouseEnter={() => setHoveredAction(sub)}
              onMouseLeave={() => setHoveredAction(null)}
            >
              <TouchableOpacity
                onPress={() => handleActionClick(category, sub)}
                style={[
                  tw`py-2 rounded-lg border-b-2 items-center justify-center shadow-sm`,
                  pendingAction?.subAction === sub
                    ? [
                        tw`border-white scale-105`,
                        { backgroundColor: "#ffffff" },
                      ]
                    : [
                        tw`border-black/10`,
                        tw`${bgColor}`,
                        isSuggested
                          ? tw`border-white border-2`
                          : tw`opacity-70`,
                      ],
                ]}
              >
                <Text
                  style={[
                    tw`font-black text-[11px]`,
                    pendingAction?.subAction === sub
                      ? tw`text-black`
                      : tw`text-white`,
                  ]}
                >
                  {sub}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const eventTypeLabel = () => {
    if (!eventData) return "";
    switch (eventData.eventType) {
      case "Oficial":
      case "oficial":
        return `🏆 ${eventData.denomination || "Competencia Oficial"}`;
      case "Interno":
      case "interno":
        return `🔵 Control Interno – ${eventData.meso} / ${eventData.micro} #${eventData.microNumber}`;
      case "Externo":
      case "externo":
        return `🟢 Control Externo – ${eventData.meso} / ${eventData.micro} #${eventData.microNumber}`;
      case "Entrenamiento":
      case "entrenamiento":
        return `⚪ Entrenamiento – ${eventData.meso} / ${eventData.micro} #${eventData.microNumber}`;
      default:
        return eventData.tournament || "";
    }
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

  // ============ UI ============
  return (
    <View style={tw`flex-1 bg-slate-900`}>
      <HeaderMenu
        dark={true}
        title="PANEL DE JUEGO"
        onBack={handleExit}
        showQuickNav={true}
      />

      <View style={tw`flex-1 flex-row overflow-hidden`}>
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
          <View style={tw`flex-1 flex-col`}>
            {/* Marcador superior */}
            <View
              style={[
                tw`h-44 border-b border-slate-800 flex-row items-center justify-between px-10 transition-colors duration-300`,
                blink ? tw`bg-red-900` : tw`bg-slate-950`,
              ]}
            >
              {/* Equipo A */}
              <View
                style={tw`flex-1 flex-row items-center justify-start gap-8`}
              >
                <View style={tw`items-center`}>
                  <Text style={tw`text-slate-100 font-black text-2xl mb-1`}>
                    {eventData?.teamA?.name || "EQUIPO A"}
                  </Text>
                  <View style={tw`flex-row items-center gap-3`}>
                    <TouchableOpacity
                      onPress={toggleWind}
                      style={tw`flex-row items-center gap-1.5`}
                    >
                      <Ionicons
                        name={
                          wind.A === "VIENTO A FAVOR"
                            ? "arrow-up-circle"
                            : "arrow-down-circle"
                        }
                        size={14}
                        color={
                          wind.A === "VIENTO A FAVOR" ? "#4ade80" : "#f87171"
                        }
                      />
                      <Text style={tw`text-slate-400 font-bold text-[9px]`}>
                        {wind.A}
                      </Text>
                    </TouchableOpacity>
                    <Text style={tw`text-blue-400 font-black text-[10px]`}>
                      SETS: {sets.A}
                    </Text>
                  </View>
                </View>
                <View style={tw`flex-col gap-5`}>
                  {eventData?.teamA?.players
                    ?.filter((_: any, i: number) => activePlayersA.includes(i))
                    .map((player: any, indexInActive: number) => {
                      const originalIndex = activePlayersA[indexInActive];
                      const playerId = player.number
                        ? `A-${player.number}`
                        : `A-${originalIndex}`;
                      const isSelected = selectedPlayerId === playerId;
                      return (
                        <View
                          key={`playerA-${originalIndex}`}
                          style={tw`flex-row items-center`}
                        >
                          <TouchableOpacity
                            onPress={() => handlePlayerSelect(playerId)}
                            style={tw`px-3 py-2.5 rounded-lg border-l-4 ${isSelected ? "bg-blue-600 border-blue-400" : "bg-slate-800 border-blue-900 shadow-md"}`}
                          >
                            <Text
                              style={tw`text-[10px] font-black uppercase ${isSelected ? "text-white" : "text-blue-200"}`}
                            >
                              #{player.number} {player.fullName || "Jugador"}
                            </Text>
                          </TouchableOpacity>
                          {isTraining && (
                            <TouchableOpacity
                              onPress={() =>
                                setShowSubModal({
                                  team: "A",
                                  index: indexInActive,
                                })
                              }
                              style={tw`ml-2 p-1 rounded bg-slate-700`}
                            >
                              <Ionicons
                                name="swap-horizontal"
                                size={14}
                                color="#94a3b8"
                              />
                            </TouchableOpacity>
                          )}
                        </View>
                      );
                    })}
                </View>
              </View>

              {/* Puntuación central */}
              <View
                style={tw`items-center bg-slate-950 px-10 py-2 border-x border-slate-900/50 shadow-2xl`}
              >
                <Text style={tw`text-slate-500 font-black text-[9px] mb-1`}>
                  PUNTUACIÓN
                </Text>
                <View style={tw`flex-row items-center gap-6`}>
                  <Text style={tw`text-7xl font-black text-white`}>
                    {score.A}
                  </Text>
                  <View style={tw`w-2 h-2 rounded-full bg-slate-700`} />
                  <Text style={tw`text-7xl font-black text-white`}>
                    {score.B}
                  </Text>
                </View>
                <View
                  style={tw`mt-1 border-t border-slate-800/50 pt-2 w-full items-center`}
                >
                  <Text
                    style={tw`text-yellow-500 font-black text-[12px] uppercase`}
                  >
                    SET {currentSet}
                  </Text>
                  <Text style={tw`text-slate-400 text-[11px] mt-0.5`}>
                    {eventTypeLabel()}
                  </Text>
                </View>
              </View>

              {/* Equipo B */}
              <View style={tw`flex-1 flex-row items-center justify-end gap-8`}>
                <View style={tw`flex-col gap-5`}>
                  {eventData?.teamB?.players
                    ?.filter((_: any, i: number) => activePlayersB.includes(i))
                    .map((player: any, indexInActive: number) => {
                      const originalIndex = activePlayersB[indexInActive];
                      const playerId = player.number
                        ? `B-${player.number}`
                        : `B-${originalIndex}`;
                      const isSelected = selectedPlayerId === playerId;
                      return (
                        <View
                          key={`playerB-${originalIndex}`}
                          style={tw`flex-row items-center`}
                        >
                          <TouchableOpacity
                            onPress={() => handlePlayerSelect(playerId)}
                            style={tw`px-3 py-2.5 rounded-lg border-r-4 ${isSelected ? "bg-red-600 border-red-400" : "bg-slate-800 border-red-900 shadow-md"}`}
                          >
                            <Text
                              style={tw`text-[10px] font-black uppercase ${isSelected ? "text-white" : "text-red-200"}`}
                            >
                              #{player.number} {player.fullName || "Jugador"}
                            </Text>
                          </TouchableOpacity>
                          {isTraining && (
                            <TouchableOpacity
                              onPress={() =>
                                setShowSubModal({
                                  team: "B",
                                  index: indexInActive,
                                })
                              }
                              style={tw`ml-2 p-1 rounded bg-slate-700`}
                            >
                              <Ionicons
                                name="swap-horizontal"
                                size={14}
                                color="#94a3b8"
                              />
                            </TouchableOpacity>
                          )}
                        </View>
                      );
                    })}
                </View>
                <View style={tw`items-center`}>
                  <Text style={tw`text-slate-100 font-black text-2xl mb-1`}>
                    {eventData?.teamB?.name || "EQUIPO B"}
                  </Text>
                  <View style={tw`flex-row items-center gap-3`}>
                    <TouchableOpacity
                      onPress={toggleWind}
                      style={tw`flex-row items-center gap-1.5`}
                    >
                      <Ionicons
                        name={
                          wind.B === "VIENTO A FAVOR"
                            ? "arrow-up-circle"
                            : "arrow-down-circle"
                        }
                        size={14}
                        color={
                          wind.B === "VIENTO A FAVOR" ? "#4ade80" : "#f87171"
                        }
                      />
                      <Text style={tw`text-slate-400 font-bold text-[9px]`}>
                        {wind.B}
                      </Text>
                    </TouchableOpacity>
                    <Text style={tw`text-red-400 font-black text-[10px]`}>
                      SETS: {sets.B}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Sección central (cancha + columnas + estadísticas) */}
            <View
              style={tw`flex-1 flex-row items-center px-4 gap-4 overflow-hidden`}
            >
              {/* CANCHA COMPLETA */}
              <View
                style={tw`w-64 h-80 bg-slate-950/50 rounded-2xl p-1 border border-slate-800 relative`}
                // @ts-ignore
                onPointerMove={(e: any) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setMousePos({
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                  });
                }}
              >
                {/* ZONA FUERA ARRIBA */}
                <View style={tw`flex-row h-8 w-full`}>
                  <CourtZone
                    id="A-OUT-TOP"
                    displayLabel="OUT A"
                    type="out-h"
                    active={selectionStep > 0}
                    isSelected={origin === "A-OUT-TOP"}
                    onPress={() => handleZoneClick("A-OUT-TOP")}
                  />
                  <CourtZone
                    id="B-OUT-TOP"
                    displayLabel="OUT B"
                    type="out-h"
                    active={selectionStep > 0}
                    isSelected={origin === "B-OUT-TOP"}
                    onPress={() => handleZoneClick("B-OUT-TOP")}
                  />
                </View>

                {/* FILA CENTRAL (IZQ | CANCHA | DER) */}
                <View style={tw`flex-1 flex-row w-full my-1`}>
                  <CourtZone
                    id="A-OUT-LEFT"
                    displayLabel="OUT"
                    type="out-v"
                    active={selectionStep > 0}
                    isSelected={origin === "A-OUT-LEFT"}
                    onPress={() => handleZoneClick("A-OUT-LEFT")}
                  />

                  {/* GRID DE JUEGO (A | RED | B) */}
                  <View style={tw`flex-1 flex-row mx-1`}>
                    <View style={tw`flex-1 flex-row`}>
                      <View style={tw`flex-1 flex-col`}>
                        {["TI", "TC", "TD"].map((pos) => (
                          <CourtZone
                            key={`A-${pos}`}
                            id={`A-${pos}`}
                            displayLabel={pos}
                            active={selectionStep > 0}
                            isSelected={origin === `A-${pos}`}
                            onPress={() => handleZoneClick(`A-${pos}`)}
                          />
                        ))}
                      </View>
                      <View style={tw`flex-1 flex-col`}>
                        {["DI", "DC", "DD"].map((pos) => (
                          <CourtZone
                            key={`A-${pos}`}
                            id={`A-${pos}`}
                            displayLabel={pos}
                            active={selectionStep > 0}
                            isSelected={origin === `A-${pos}`}
                            onPress={() => handleZoneClick(`A-${pos}`)}
                          />
                        ))}
                      </View>
                    </View>

                    <View style={tw`w-[2px] bg-yellow-500/30 mx-1`} />

                    <View style={tw`flex-1 flex-row`}>
                      <View style={tw`flex-1 flex-col`}>
                        {["DD", "DC", "DI"].map((pos) => (
                          <CourtZone
                            key={`B-${pos}`}
                            id={`B-${pos}`}
                            displayLabel={pos}
                            active={selectionStep > 0}
                            isSelected={origin === `B-${pos}`}
                            onPress={() => handleZoneClick(`B-${pos}`)}
                          />
                        ))}
                      </View>
                      <View style={tw`flex-1 flex-col`}>
                        {["TD", "TC", "TI"].map((pos) => (
                          <CourtZone
                            key={`B-${pos}`}
                            id={`B-${pos}`}
                            displayLabel={pos}
                            active={selectionStep > 0}
                            isSelected={origin === `B-${pos}`}
                            onPress={() => handleZoneClick(`B-${pos}`)}
                          />
                        ))}
                      </View>
                    </View>
                  </View>

                  <CourtZone
                    id="B-OUT-RIGHT"
                    displayLabel="OUT"
                    type="out-v"
                    active={selectionStep > 0}
                    isSelected={origin === "B-OUT-RIGHT"}
                    onPress={() => handleZoneClick("B-OUT-RIGHT")}
                  />
                </View>

                {/* ZONA FUERA ABAJO */}
                <View style={tw`flex-row h-8 w-full`}>
                  <CourtZone
                    id="A-OUT-BOTTOM"
                    displayLabel="OUT A"
                    type="out-h"
                    active={selectionStep > 0}
                    isSelected={origin === "A-OUT-BOTTOM"}
                    onPress={() => handleZoneClick("A-OUT-BOTTOM")}
                  />
                  <CourtZone
                    id="B-OUT-BOTTOM"
                    displayLabel="OUT B"
                    type="out-h"
                    active={selectionStep > 0}
                    isSelected={origin === "B-OUT-BOTTOM"}
                    onPress={() => handleZoneClick("B-OUT-BOTTOM")}
                  />
                </View>

                {/* Flecha SVG */}
                {origin && selectionStep === 1 && (
                  <svg
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      pointerEvents: "none",
                      zIndex: 50,
                    }}
                  >
                    <defs>
                      <marker
                        id="arrowhead"
                        markerWidth="10"
                        markerHeight="7"
                        refX="9"
                        refY="3.5"
                        orient="auto"
                      >
                        <polygon points="0 0, 10 3.5, 0 7" fill="#fbbf24" />
                      </marker>
                    </defs>
                    <line
                      x1={zoneCoords[origin]?.x || 0}
                      y1={zoneCoords[origin]?.y || 0}
                      x2={mousePos.x}
                      y2={mousePos.y}
                      stroke="#fbbf24"
                      strokeWidth="2"
                      strokeDasharray="4"
                      markerEnd="url(#arrowhead)"
                    />
                  </svg>
                )}
                {origin ? (
                  <Text
                    style={tw`absolute -bottom-5 left-0 right-0 text-center text-[8px] text-yellow-500 font-bold uppercase`}
                  >
                    Click Derecho p/ Cancelar
                  </Text>
                ) : null}
              </View>
              {/* FIN CANCHA */}

              {/* Columnas de acción */}
              <View style={tw`flex-1 flex-col h-full justify-center py-2`}>
                {/* Ticket del rally */}
                <View
                  style={[
                    tw`flex-row items-center bg-slate-950/90 rounded-xl border border-cyan-900/30 px-3 py-1.5 mb-3 shadow-2xl`,
                    { alignSelf: "flex-start", minWidth: 200 },
                  ]}
                >
                  {currentRally.length > 0 && (
                    <TouchableOpacity
                      onPress={clearRally}
                      style={tw`mr-3 p-1 rounded-lg bg-red-900/50 border border-red-800`}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={16}
                        color="#f87171"
                      />
                    </TouchableOpacity>
                  )}
                  <View
                    style={tw`flex-row flex-wrap gap-2 items-center flex-1`}
                  >
                    {currentRally.length === 0 && !pendingAction ? (
                      <Text
                        style={tw`text-slate-600 font-bold text-[10px] uppercase`}
                      >
                        Esperando Rally...
                      </Text>
                    ) : (
                      <>
                        {currentRally.map((accion, idx) => (
                          <TouchableOpacity
                            key={idx}
                            onPress={() => {
                              editRallyAction(idx);
                              setIsEditingMode(true);
                            }}
                            style={tw`bg-slate-900 px-2 py-1 rounded-lg border border-slate-700 flex-row items-center gap-2 active:bg-cyan-900/50 hover:border-cyan-500 transition-colors`}
                          >
                            <Text
                              style={tw`text-cyan-500 font-black text-[10px]`}
                            >
                              {accion.playerId}
                            </Text>
                            <Text style={tw`text-white font-bold text-[10px]`}>
                              {accion.subAction}
                            </Text>
                            <View
                              style={tw`bg-slate-800 px-2 py-0.5 rounded flex-row items-center gap-1`}
                            >
                              <Text
                                style={tw`text-slate-300 text-[10px] font-bold`}
                              >
                                {formatTicketZone(accion.origin)}
                              </Text>
                              <Ionicons
                                name="arrow-forward"
                                size={10}
                                color="#fbbf24"
                              />
                              <Text
                                style={tw`text-slate-300 text-[10px] font-bold`}
                              >
                                {formatTicketZone(accion.destination)}
                              </Text>
                            </View>
                            <Text
                              style={tw`text-yellow-500 font-black text-[11px]`}
                            >
                              {accion.value}
                            </Text>
                          </TouchableOpacity>
                        ))}
                        {pendingAction && (
                          <View
                            style={tw`bg-slate-900/80 border border-dashed border-cyan-600 px-2 py-1 rounded-lg flex-row items-center gap-2`}
                          >
                            <Text
                              style={tw`text-cyan-500 font-black text-[10px]`}
                            >
                              {pendingAction.playerId}
                            </Text>
                            <Text style={tw`text-white font-bold text-[10px]`}>
                              {pendingAction.subAction}
                            </Text>
                            {pendingAction.value !== undefined && (
                              <Text
                                style={tw`text-yellow-500 font-black text-[11px]`}
                              >
                                {pendingAction.value}
                              </Text>
                            )}
                            {pendingAction.origin && (
                              <View
                                style={tw`bg-slate-800 px-2 py-0.5 rounded flex-row items-center gap-1`}
                              >
                                <Text
                                  style={tw`text-slate-300 text-[10px] font-bold`}
                                >
                                  {formatTicketZone(pendingAction.origin)}
                                </Text>
                                <Ionicons
                                  name="arrow-forward"
                                  size={10}
                                  color="#fbbf24"
                                />
                                <Text
                                  style={tw`text-slate-500 text-[10px] font-bold`}
                                >
                                  ?
                                </Text>
                              </View>
                            )}
                          </View>
                        )}
                      </>
                    )}
                  </View>
                  {currentRally.length > 0 && (
                    <TouchableOpacity
                      onPress={handleAutoCommit}
                      style={tw`ml-4 bg-cyan-600 px-3 py-1 rounded-lg shadow-lg border-b-2 border-cyan-800`}
                    >
                      <Text style={tw`text-white font-black text-[10px]`}>
                        GUARDAR
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Columnas de acciones */}
                <View style={tw`flex-1 flex-row gap-1 justify-start`}>
                  {renderActionColumn("Serv.", "SERVICIO", [
                    "BAJ",
                    "FLO",
                    "SAL",
                    "SAF",
                  ])}
                  {renderActionColumn("Rec.", "RECEPCION", ["2ma", "Ppm"])}
                  {renderActionColumn("Acom.", "ACOMODADA", ["P2a", "P2b"])}
                  {renderActionColumn(
                    "Ataq.",
                    "ATAQUE",
                    ["Rm", "Rca", "Ub", "Tr", "Acd", "Rdjn", "Rdpmp", "Rd"],
                    true,
                  )}
                  {renderActionColumn("Bloq.", "BLOQUEO", ["Bl", "Bd", "Bn"])}
                  {renderActionColumn("Def.", "DEFENSA", [
                    "Dd",
                    "Dltd",
                    "Ld",
                    "Cc",
                  ])}
                  {renderActionColumn("E. Serv", "ERRORES_SERV", [
                    "SFC",
                    "SR",
                    "SME",
                  ])}
                  {renderActionColumn("E. Com", "ERRORES_COM", ["CI", "MC"])}
                  {renderActionColumn("E. Pos", "ERRORES_POS", [
                    "NAT",
                    "CJR",
                    "MCA",
                    "JFZ",
                  ])}
                  {renderActionColumn("E. Tec", "ERRORES_TEC", [
                    "GMD",
                    "TI",
                    "MER",
                    "BTR",
                  ])}
                </View>
              </View>

              {/* Panel de estadísticas (scrollable) */}
              <View
                style={[
                  tw`bg-slate-950 border-l border-slate-800`,
                  { width: isStatsOpen ? 500 : 60, height: "100%" },
                ]}
              >
                <TouchableOpacity
                  onPress={() => setIsStatsOpen(!isStatsOpen)}
                  style={tw`absolute -left-4 top-1/2 bg-cyan-600 w-8 h-12 rounded-lg items-center justify-center z-50 shadow-2xl`}
                >
                  <Ionicons
                    name={isStatsOpen ? "chevron-forward" : "analytics"}
                    size={20}
                    color="white"
                  />
                </TouchableOpacity>
                {isStatsOpen ? (
                  <View style={tw`flex-1 p-4 pt-12`}>
                    <Text
                      style={tw`text-white font-black text-sm uppercase mb-4 border-b border-slate-800 pb-2`}
                    >
                      Análisis de Rendimiento
                    </Text>
                    <ScrollView
                      contentContainerStyle={tw`flex-col gap-3 pb-4`}
                      style={tw`flex-1`}
                    >
                      {[
                        ...(eventData?.teamA?.players || []).map((p) => ({
                          ...p,
                          team: "A",
                        })),
                        ...(eventData?.teamB?.players || []).map((p) => ({
                          ...p,
                          team: "B",
                        })),
                      ].map((player, idx) => {
                        const pId = `${player.team}-${player.number}`;
                        const stats = getPlayerStats(pId);
                        if (!stats) return null;
                        const isTeamA = player.team === "A";
                        return (
                          <View
                            key={idx}
                            style={tw`${isTeamA ? "bg-blue-900/20 border-blue-500" : "bg-red-900/20 border-red-500"} p-2 rounded-xl border`}
                          >
                            <View
                              style={tw`flex-row justify-between items-center mb-1`}
                            >
                              <Text
                                style={tw`${isTeamA ? "text-blue-400" : "text-red-400"} font-black text-[10px]`}
                              >
                                #{player.number} {player.fullName}
                              </Text>
                              <View
                                style={tw`bg-slate-800 px-1 py-0.5 rounded`}
                              >
                                <Text
                                  style={tw`text-white font-bold text-[9px]`}
                                >
                                  {stats.general.efficiency}% EFF
                                </Text>
                              </View>
                            </View>
                            <View style={tw`flex-row flex-wrap gap-1`}>
                              <MiniStatBox
                                label="SRV"
                                value={stats.serve.eff}
                                color="text-blue-400"
                              />
                              <MiniStatBox
                                label="REC"
                                value={stats.receive.eff}
                                color="text-green-400"
                              />
                              <MiniStatBox
                                label="SET"
                                value={stats.set.eff}
                                color="text-pink-400"
                              />
                              <MiniStatBox
                                label="ATK"
                                value={stats.attack.eff}
                                color="text-yellow-400"
                              />
                              <MiniStatBox
                                label="BLK"
                                value={stats.block.eff}
                                color="text-purple-400"
                              />
                              <MiniStatBox
                                label="DEF"
                                value={stats.defense.eff}
                                color="text-emerald-400"
                              />
                            </View>
                            <Text style={tw`text-slate-500 text-[8px] mt-1`}>
                              Acciones: {stats.general.totalActions} | Errores:{" "}
                              {stats.general.errors}
                            </Text>
                          </View>
                        );
                      })}
                    </ScrollView>
                  </View>
                ) : (
                  <View style={tw`items-center gap-6 p-4 pt-12`}>
                    <Ionicons name="person" size={18} color="#475569" />
                    <Ionicons name="trending-up" size={18} color="#475569" />
                    <Ionicons name="pie-chart" size={18} color="#475569" />
                  </View>
                )}
              </View>
            </View>

            {/* Footer con cronómetros y botones */}
            <View
              style={tw`h-20 bg-slate-950 border-t border-slate-800 flex-row items-center justify-between px-10`}
            >
              <View style={tw`flex-1 flex-row justify-start`}>
                <TouchableOpacity
                  onPress={() => setIsManualOpen(!isManualOpen)}
                  style={tw`flex-row items-center gap-2 px-5 py-2 rounded-xl border-b-4 ${isManualOpen ? "bg-slate-700 border-slate-900" : "bg-yellow-500 border-yellow-700"}`}
                >
                  <Ionicons
                    name={isManualOpen ? "close-circle" : "book"}
                    size={18}
                    color={isManualOpen ? "white" : "black"}
                  />
                  <Text
                    style={tw`font-black text-[11px] uppercase ${isManualOpen ? "text-white" : "text-black"}`}
                  >
                    Manual
                  </Text>
                </TouchableOpacity>
              </View>
              <View
                style={tw`flex-row items-center gap-8 bg-slate-900/50 px-6 py-2 rounded-3xl border border-slate-800`}
              >
                <View style={tw`items-center`}>
                  <Text
                    style={tw`text-slate-600 font-black text-[8px] uppercase mb-0.5`}
                  >
                    Tiempo Total
                  </Text>
                  <Text style={tw`text-white font-mono text-2xl font-bold`}>
                    {timers.formattedTotalTime}
                  </Text>
                </View>
                <View style={tw`w-px h-8 bg-slate-800`} />
                <View style={tw`items-center`}>
                  <Text
                    style={tw`text-slate-600 font-black text-[8px] uppercase mb-0.5`}
                  >
                    Tiempo En Juego
                  </Text>
                  <Text
                    style={[
                      tw`font-mono text-2xl font-bold`,
                      timers.isRealTimeActive
                        ? tw`text-green-400`
                        : tw`text-slate-500`,
                    ]}
                  >
                    {timers.formattedRealTime}
                  </Text>
                </View>
              </View>
              <View style={tw`flex-1 flex-row justify-end gap-3`}>
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
                  style={tw`flex-row items-center gap-2 px-5 py-2 rounded-xl border-b-4 ${!timers.isTotalTimeActive ? "bg-green-600 border-green-800" : timers.isRealTimeActive ? "bg-orange-600 border-orange-800" : "bg-green-600 border-green-800"}`}
                >
                  <Ionicons
                    name={
                      !timers.isTotalTimeActive
                        ? "play-skip-forward"
                        : timers.isRealTimeActive
                          ? "pause"
                          : "play"
                    }
                    size={18}
                    color="white"
                  />
                  <Text style={tw`text-white font-black text-[11px] uppercase`}>
                    {!timers.isTotalTimeActive
                      ? "Comenzar"
                      : timers.isRealTimeActive
                        ? "Pausar Juego"
                        : "Reanudar Juego"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handlePartialSave}
                  style={tw`flex-row items-center gap-2 px-5 py-2 bg-slate-800 rounded-xl border-b-4 border-slate-950`}
                >
                  <Ionicons name="stop-circle" size={18} color="#f87171" />
                  <Text style={tw`text-white font-black text-[11px] uppercase`}>
                    Final Parcial
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleFinishMatch}
                  style={tw`flex-row items-center gap-2 px-5 py-2 bg-blue-600 rounded-xl border-b-4 border-blue-800`}
                >
                  <Ionicons name="checkmark-circle" size={18} color="white" />
                  <Text style={tw`text-white font-black text-[11px] uppercase`}>
                    Finalizar
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Modal de sustitución */}
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
            {/* Mostrar todos los jugadores registrados */}
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
              const playerId = `${team}-${playerNumber}`;
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
                      // Sustitución dentro del mismo equipo
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
                      // Intercambio entre equipos
                      if (targetTeam === "A") {
                        setActivePlayersA((prev) => {
                          const newA = [...prev];
                          const temp = newA[index]!;
                          newA[index] = selectedIndex;
                          setActivePlayersB((prevB) => {
                            const newB = [...prevB];
                            const idxInB = newB.indexOf(selectedIndex);
                            if (idxInB !== -1) {
                              newB[idxInB] = temp;
                            } else {
                              if (index < newB.length) newB[index] = temp;
                            }
                            return newB;
                          });
                          return newA;
                        });
                      } else {
                        // targetTeam === "B"
                        setActivePlayersB((prev) => {
                          const newB = [...prev];
                          const temp = newB[index]!;
                          newB[index] = selectedIndex;
                          setActivePlayersA((prevA) => {
                            const newA = [...prevA];
                            const idxInA = newA.indexOf(selectedIndex);
                            if (idxInA !== -1) {
                              newA[idxInA] = temp;
                            } else {
                              if (index < newA.length) newA[index] = temp;
                            }
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

      {/* Modal global de confirmación */}
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
    </View>
  );
}
