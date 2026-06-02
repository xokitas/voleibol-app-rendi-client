// app/(tabs)/game/index.tsx (MÓVIL)
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
import { useGameTimers } from "../../../hooks/useGameTimers";
import { useScoutingLogic } from "../../../hooks/useScoutingLogic";
import { useStats } from "../../../hooks/useStats";
import tw from "../../../lib/tailwind";
import { useMatchStore } from "../../../src/store/useMatchStore";

const categoryColors: Record<string, string> = {
  SERVICIO: "#93c5fd",
  RECEPCION: "#86efac",
  ACOMODADA: "#fbcfe8",
  ATAQUE: "#fde047",
  BLOQUEO: "#c084fc",
  DEFENSA: "#166534",
  ERRORES_SERV: "#4b5563",
  ERRORES_COM: "#4b5563",
  ERRORES_POS: "#4b5563",
  ERRORES_TEC: "#4b5563",
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
    style={tw`${type === "out-h" ? "h-6 flex-1" : type === "out-v" ? "w-6 h-full" : "flex-1"}
      m-[0.5px] rounded border justify-center items-center ${
        isSelected
          ? "border-yellow-400 bg-yellow-400/20"
          : active
            ? "border-slate-600 bg-slate-700"
            : "border-slate-700/40 bg-slate-800"
      }`}
  >
    <Text
      style={tw`text-[7px] font-bold ${isSelected ? "text-yellow-400" : "text-slate-400"}`}
    >
      {displayLabel}
    </Text>
  </TouchableOpacity>
);

export default function GameScreenMobile() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const currentMatch = useMatchStore((s) => s.currentMatch);
  const updateCurrentMatchTimes = useMatchStore(
    (s) => s.updateCurrentMatchTimes,
  );
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

  const initialTotal = currentMatch?.totalTimeSeconds ?? 0;
  const initialReal = currentMatch?.realTimeSeconds ?? 0;
  const timers = useGameTimers(initialTotal, initialReal);

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

  const [valuePopover, setValuePopover] = useState<{
    visible: boolean;
    subAction: string;
    allowedValues: number[];
  }>({ visible: false, subAction: "", allowedValues: [] });
  const [origin, setOrigin] = useState<string | null>(null);
  const [selectionStep, setSelectionStep] = useState(0);
  const [isWaitingForZone, setIsWaitingForZone] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(true);
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const [activePlayersA, setActivePlayersA] = useState<number[]>([0, 1]);
  const [activePlayersB, setActivePlayersB] = useState<number[]>([0, 1]);
  const [showSubModal, setShowSubModal] = useState<{
    team: "A" | "B";
    index: number;
  } | null>(null);

  useEffect(() => {
    if (!pendingAction) {
      setIsWaitingForZone(false);
      setOrigin(null);
      setSelectionStep(0);
    }
  }, [pendingAction]);
  useEffect(() => {
    if (currentMatch && !timers.isTotalTimeActive) timers.startTotalTime();
  }, []);
  useEffect(() => {
    return () => {
      timers.stopRealTime();
      timers.stopTotalTime();
      timers.resetTimers();
    };
  }, []);
  useEffect(() => {
    if (mustSwitchSide) {
      showModal(
        "Cambio de campo",
        "Los equipos deben cambiar de lado.",
        "info",
        () => {
          hideModal();
          toggleWind();
        },
      );
    }
  }, [mustSwitchSide]);
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
  useEffect(() => {
    if (score.A > 0 || score.B > 0) timers.stopRealTime();
  }, [score.A, score.B]);
  useEffect(() => {
    if (pendingAction && !isEditingAction && !timers.isRealTimeActive) {
      timers.startRealTime();
      if (!timers.isTotalTimeActive) timers.startTotalTime();
    }
  }, [pendingAction, isEditingAction]);

  const handleSubActionPress = (category: string, sub: string) => {
    handleActionClick(category, sub);
    const allowed = actionAllowedValues[sub] || [0, 1, 2, 3, 4];
    setValuePopover({ visible: true, subAction: sub, allowedValues: allowed });
  };

  const handleZonePress = (zone: string) => {
    if (!isWaitingForZone || !pendingAction) return;
    if (selectionStep === 0) {
      setOrigin(zone);
      setSelectionStep(1);
    } else {
      updatePendingZones(origin!, zone);
      setOrigin(null);
      setSelectionStep(0);
      setIsWaitingForZone(false);
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
    timers.startTotalTime();
  };

  const handleExit = () =>
    showModal(
      "Salir del partido",
      "Elige qué hacer con el partido actual:",
      "warning",
      () => {
        if (currentMatch) {
          currentMatch.totalTimeSeconds = timers.totalTime;
          currentMatch.realTimeSeconds = timers.realTime;
        }
        timers.stopRealTime();
        timers.stopTotalTime();
        router.replace("/(tabs)/menu");
      },
      () => {
        clearRally();
        clearCurrentMatch();
        timers.stopRealTime();
        timers.stopTotalTime();
        timers.resetTimers();
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
        updateCurrentMatchTimes(timers.totalTime, timers.realTime);
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
        updateCurrentMatchTimes(timers.totalTime, timers.realTime);
        saveCurrentMatch("finished");
        timers.stopRealTime();
        timers.stopTotalTime();
        router.replace("/(tabs)/menu");
      },
    );

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

  const { getPlayerStats } = useStats(rallyHistory || [], actionAllowedValues);

  const playersAOriginalIndex = (player: any) =>
    eventData?.teamA?.players?.findIndex(
      (p: any) => p.number === player.number,
    ) ?? -1;
  const playersBOriginalIndex = (player: any) =>
    eventData?.teamB?.players?.findIndex(
      (p: any) => p.number === player.number,
    ) ?? -1;

  return (
    <SafeAreaView style={tw`flex-1 bg-slate-900`}>
      <HeaderMenu
        dark
        title="PANEL DE JUEGO"
        onBack={handleExit}
        showQuickNav={false}
        compact
      />

      <ScrollView contentContainerStyle={tw`pb-24`}>
        <View
          style={tw`h-32 bg-slate-950 flex-row items-center justify-between px-3`}
        >
          <View style={tw`flex-1 flex-col items-start`}>
            <Text style={tw`text-slate-100 font-black text-xs mb-1`}>
              {eventData?.teamA?.name || "A"}
            </Text>
            <View style={tw`flex-row items-center gap-1`}>
              <TouchableOpacity
                onPress={toggleWind}
                style={tw`flex-row items-center gap-0.5`}
              >
                <Ionicons
                  name={
                    wind.A === "VIENTO A FAVOR"
                      ? "arrow-up-circle"
                      : "arrow-down-circle"
                  }
                  size={12}
                  color={wind.A === "VIENTO A FAVOR" ? "#4ade80" : "#f87171"}
                />
                <Text style={tw`text-slate-400 font-bold text-[8px]`}>
                  {wind.A}
                </Text>
              </TouchableOpacity>
              <Text style={tw`text-blue-400 font-black text-[8px]`}>
                SETS: {sets.A}
              </Text>
            </View>
            <View style={tw`flex-col gap-2 mt-2`}>
              {activePlayersA.map((playerIndex, slotIndex) => {
                const player = eventData?.teamA?.players[playerIndex];
                if (!player) return null;
                const playerId = `A-${player.number}`;
                const isSelected = selectedPlayerId === playerId;
                return (
                  <View
                    key={`playerA-${slotIndex}`}
                    style={tw`flex-row items-center`}
                  >
                    <TouchableOpacity
                      onPress={() => handlePlayerSelect(playerId)}
                      style={tw`px-2 py-1 rounded border-l-2 ${isSelected ? "bg-blue-600 border-blue-400" : "bg-slate-800 border-blue-900"}`}
                    >
                      <Text
                        style={tw`text-[8px] font-black uppercase ${isSelected ? "text-white" : "text-blue-200"}`}
                      >
                        #{player.number} {player.fullName?.split(" ")[0]}
                      </Text>
                    </TouchableOpacity>
                    {isTraining && (
                      <TouchableOpacity
                        onPress={() =>
                          setShowSubModal({ team: "A", index: slotIndex })
                        }
                        style={tw`ml-1 p-1 rounded bg-slate-700`}
                      >
                        <Ionicons
                          name="swap-horizontal"
                          size={12}
                          color="#94a3b8"
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>
          </View>

          <View style={tw`items-center bg-slate-900 px-4 py-1 rounded-xl mx-2`}>
            <Text style={tw`text-slate-500 font-black text-[7px] mb-0.5`}>
              PUNTUACIÓN
            </Text>
            <View style={tw`flex-row items-center gap-2`}>
              <Text style={tw`text-4xl font-black text-white`}>{score.A}</Text>
              <View style={tw`w-1 h-1 rounded-full bg-slate-700`} />
              <Text style={tw`text-4xl font-black text-white`}>{score.B}</Text>
            </View>
            <View
              style={tw`mt-1 border-t border-slate-800/50 pt-1 w-full items-center`}
            >
              <Text style={tw`text-yellow-500 font-black text-[9px] uppercase`}>
                SET {currentSet}
              </Text>
              <Text style={tw`text-slate-400 text-[8px] mt-0.5`}>
                {eventTypeLabel()}
              </Text>
            </View>
          </View>

          <View style={tw`flex-1 flex-col items-end`}>
            <Text style={tw`text-slate-100 font-black text-xs mb-1`}>
              {eventData?.teamB?.name || "B"}
            </Text>
            <View style={tw`flex-row items-center gap-1`}>
              <TouchableOpacity
                onPress={toggleWind}
                style={tw`flex-row items-center gap-0.5`}
              >
                <Ionicons
                  name={
                    wind.B === "VIENTO A FAVOR"
                      ? "arrow-up-circle"
                      : "arrow-down-circle"
                  }
                  size={12}
                  color={wind.B === "VIENTO A FAVOR" ? "#4ade80" : "#f87171"}
                />
                <Text style={tw`text-slate-400 font-bold text-[8px]`}>
                  {wind.B}
                </Text>
              </TouchableOpacity>
              <Text style={tw`text-red-400 font-black text-[8px]`}>
                SETS: {sets.B}
              </Text>
            </View>
            <View style={tw`flex-col gap-2 mt-2`}>
              {activePlayersB.map((playerIndex, slotIndex) => {
                const player = eventData?.teamB?.players[playerIndex];
                if (!player) return null;
                const playerId = `B-${player.number}`;
                const isSelected = selectedPlayerId === playerId;
                return (
                  <View
                    key={`playerB-${slotIndex}`}
                    style={tw`flex-row items-center`}
                  >
                    <TouchableOpacity
                      onPress={() => handlePlayerSelect(playerId)}
                      style={tw`px-2 py-1 rounded border-r-2 ${isSelected ? "bg-red-600 border-red-400" : "bg-slate-800 border-red-900"}`}
                    >
                      <Text
                        style={tw`text-[8px] font-black uppercase ${isSelected ? "text-white" : "text-red-200"}`}
                      >
                        #{player.number} {player.fullName?.split(" ")[0]}
                      </Text>
                    </TouchableOpacity>
                    {isTraining && (
                      <TouchableOpacity
                        onPress={() =>
                          setShowSubModal({ team: "B", index: slotIndex })
                        }
                        style={tw`ml-1 p-1 rounded bg-slate-700`}
                      >
                        <Ionicons
                          name="swap-horizontal"
                          size={12}
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

        <View style={tw`flex-row p-2`}>
          <View style={tw`w-1/3 h-60 bg-slate-800/50 rounded-lg p-1`}>
            <View style={tw`flex-1 flex-row mx-1`}>
              <View style={tw`flex-1 flex-row`}>
                <View style={tw`flex-1 flex-col`}>
                  {["TI", "TC", "TD"].map((pos) => (
                    <CourtZone
                      key={`A-${pos}`}
                      id={`A-${pos}`}
                      displayLabel={pos}
                      active={isWaitingForZone}
                      isSelected={origin === `A-${pos}`}
                      onPress={() => handleZonePress(`A-${pos}`)}
                    />
                  ))}
                </View>
                <View style={tw`flex-1 flex-col`}>
                  {["DI", "DC", "DD"].map((pos) => (
                    <CourtZone
                      key={`A-${pos}`}
                      id={`A-${pos}`}
                      displayLabel={pos}
                      active={isWaitingForZone}
                      isSelected={origin === `A-${pos}`}
                      onPress={() => handleZonePress(`A-${pos}`)}
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
                      active={isWaitingForZone}
                      isSelected={origin === `B-${pos}`}
                      onPress={() => handleZonePress(`B-${pos}`)}
                    />
                  ))}
                </View>
                <View style={tw`flex-1 flex-col`}>
                  {["TD", "TC", "TI"].map((pos) => (
                    <CourtZone
                      key={`B-${pos}`}
                      id={`B-${pos}`}
                      displayLabel={pos}
                      active={isWaitingForZone}
                      isSelected={origin === `B-${pos}`}
                      onPress={() => handleZonePress(`B-${pos}`)}
                    />
                  ))}
                </View>
              </View>
            </View>
            {isWaitingForZone && (
              <Text style={tw`text-yellow-400 text-[8px] text-center mt-1`}>
                {selectionStep === 0 ? "Toca origen" : "Toca destino"}
              </Text>
            )}
          </View>

          <View style={tw`flex-1 ml-2`}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={tw`flex-row gap-1`}>
                {/* Servicio */}
                <View style={tw`w-12 items-center`}>
                  <Text style={tw`text-slate-400 text-[7px] font-bold mb-1`}>
                    Serv.
                  </Text>
                  {["BAJ", "FLO", "SAL", "SAF"].map((sub) => {
                    const canDo = canPerformAction("SERVICIO");
                    return (
                      <TouchableOpacity
                        key={sub}
                        onPress={() => handleSubActionPress("SERVICIO", sub)}
                        style={tw`mb-0.5 ${canDo ? "border-2 border-white rounded" : "opacity-70"}`}
                        activeOpacity={0.7}
                      >
                        <View
                          style={[
                            tw`w-10 h-10 rounded items-center justify-center`,
                            { backgroundColor: categoryColors["SERVICIO"] },
                          ]}
                        >
                          <Text style={tw`text-black text-[8px] font-bold`}>
                            {sub}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {/* Recepción */}
                <View style={tw`w-12 items-center`}>
                  <Text style={tw`text-slate-400 text-[7px] font-bold mb-1`}>
                    Rec.
                  </Text>
                  {["2ma", "Ppm"].map((sub) => {
                    const canDo = canPerformAction("RECEPCION");
                    return (
                      <TouchableOpacity
                        key={sub}
                        onPress={() => handleSubActionPress("RECEPCION", sub)}
                        style={tw`mb-0.5 ${canDo ? "border-2 border-white rounded" : "opacity-70"}`}
                        activeOpacity={0.7}
                      >
                        <View
                          style={[
                            tw`w-10 h-10 rounded items-center justify-center`,
                            { backgroundColor: categoryColors["RECEPCION"] },
                          ]}
                        >
                          <Text style={tw`text-black text-[8px] font-bold`}>
                            {sub}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {/* Acomodada */}
                <View style={tw`w-12 items-center`}>
                  <Text style={tw`text-slate-400 text-[7px] font-bold mb-1`}>
                    Acom.
                  </Text>
                  {["P2a", "P2b"].map((sub) => {
                    const canDo = canPerformAction("ACOMODADA");
                    return (
                      <TouchableOpacity
                        key={sub}
                        onPress={() => handleSubActionPress("ACOMODADA", sub)}
                        style={tw`mb-0.5 ${canDo ? "border-2 border-white rounded" : "opacity-70"}`}
                        activeOpacity={0.7}
                      >
                        <View
                          style={[
                            tw`w-10 h-10 rounded items-center justify-center`,
                            { backgroundColor: categoryColors["ACOMODADA"] },
                          ]}
                        >
                          <Text style={tw`text-black text-[8px] font-bold`}>
                            {sub}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {/* Ataque (dos columnas) */}
                <View style={tw`w-24 items-center`}>
                  <Text style={tw`text-slate-400 text-[7px] font-bold mb-1`}>
                    Ataq.
                  </Text>
                  <View style={tw`flex-row flex-wrap`}>
                    {[
                      "Rm",
                      "Rca",
                      "Ub",
                      "Tr",
                      "Acd",
                      "Rdjn",
                      "Rdpmp",
                      "Rd",
                    ].map((sub) => {
                      const canDo = canPerformAction("ATAQUE");
                      return (
                        <TouchableOpacity
                          key={sub}
                          onPress={() => handleSubActionPress("ATAQUE", sub)}
                          style={tw`w-1/2 mb-0.5 ${canDo ? "border-2 border-white rounded" : "opacity-70"}`}
                          activeOpacity={0.7}
                        >
                          <View
                            style={[
                              tw`w-10 h-10 rounded items-center justify-center`,
                              { backgroundColor: categoryColors["ATAQUE"] },
                            ]}
                          >
                            <Text style={tw`text-black text-[8px] font-bold`}>
                              {sub}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
                {/* Bloqueo */}
                <View style={tw`w-12 items-center`}>
                  <Text style={tw`text-slate-400 text-[7px] font-bold mb-1`}>
                    Bloq.
                  </Text>
                  {["Bl", "Bd", "Bn"].map((sub) => {
                    const canDo = canPerformAction("BLOQUEO");
                    return (
                      <TouchableOpacity
                        key={sub}
                        onPress={() => handleSubActionPress("BLOQUEO", sub)}
                        style={tw`mb-0.5 ${canDo ? "border-2 border-white rounded" : "opacity-70"}`}
                        activeOpacity={0.7}
                      >
                        <View
                          style={[
                            tw`w-10 h-10 rounded items-center justify-center`,
                            { backgroundColor: categoryColors["BLOQUEO"] },
                          ]}
                        >
                          <Text style={tw`text-black text-[8px] font-bold`}>
                            {sub}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {/* Defensa */}
                <View style={tw`w-12 items-center`}>
                  <Text style={tw`text-slate-400 text-[7px] font-bold mb-1`}>
                    Def.
                  </Text>
                  {["Dd", "Dltd", "Ld", "Cc"].map((sub) => {
                    const canDo = canPerformAction("DEFENSA");
                    return (
                      <TouchableOpacity
                        key={sub}
                        onPress={() => handleSubActionPress("DEFENSA", sub)}
                        style={tw`mb-0.5 ${canDo ? "border-2 border-white rounded" : "opacity-70"}`}
                        activeOpacity={0.7}
                      >
                        <View
                          style={[
                            tw`w-10 h-10 rounded items-center justify-center`,
                            { backgroundColor: categoryColors["DEFENSA"] },
                          ]}
                        >
                          <Text style={tw`text-black text-[8px] font-bold`}>
                            {sub}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {/* E.Srv */}
                <View style={tw`w-12 items-center`}>
                  <Text style={tw`text-slate-400 text-[7px] font-bold mb-1`}>
                    E.Srv
                  </Text>
                  {["SFC", "SR", "SME"].map((sub) => {
                    const canDo = canPerformAction("ERRORES_SERV");
                    return (
                      <TouchableOpacity
                        key={sub}
                        onPress={() =>
                          handleSubActionPress("ERRORES_SERV", sub)
                        }
                        style={tw`mb-0.5 ${canDo ? "border-2 border-white rounded" : "opacity-70"}`}
                        activeOpacity={0.7}
                      >
                        <View
                          style={[
                            tw`w-10 h-10 rounded items-center justify-center`,
                            { backgroundColor: categoryColors["ERRORES_SERV"] },
                          ]}
                        >
                          <Text style={tw`text-black text-[8px] font-bold`}>
                            {sub}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {/* E.Com */}
                <View style={tw`w-12 items-center`}>
                  <Text style={tw`text-slate-400 text-[7px] font-bold mb-1`}>
                    E.Com
                  </Text>
                  {["CI", "MC"].map((sub) => {
                    const canDo = canPerformAction("ERRORES_COM");
                    return (
                      <TouchableOpacity
                        key={sub}
                        onPress={() => handleSubActionPress("ERRORES_COM", sub)}
                        style={tw`mb-0.5 ${canDo ? "border-2 border-white rounded" : "opacity-70"}`}
                        activeOpacity={0.7}
                      >
                        <View
                          style={[
                            tw`w-10 h-10 rounded items-center justify-center`,
                            { backgroundColor: categoryColors["ERRORES_COM"] },
                          ]}
                        >
                          <Text style={tw`text-black text-[8px] font-bold`}>
                            {sub}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {/* E.Pos */}
                <View style={tw`w-12 items-center`}>
                  <Text style={tw`text-slate-400 text-[7px] font-bold mb-1`}>
                    E.Pos
                  </Text>
                  {["NAT", "CJR", "MCA", "JFZ"].map((sub) => {
                    const canDo = canPerformAction("ERRORES_POS");
                    return (
                      <TouchableOpacity
                        key={sub}
                        onPress={() => handleSubActionPress("ERRORES_POS", sub)}
                        style={tw`mb-0.5 ${canDo ? "border-2 border-white rounded" : "opacity-70"}`}
                        activeOpacity={0.7}
                      >
                        <View
                          style={[
                            tw`w-10 h-10 rounded items-center justify-center`,
                            { backgroundColor: categoryColors["ERRORES_POS"] },
                          ]}
                        >
                          <Text style={tw`text-black text-[8px] font-bold`}>
                            {sub}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {/* E.Tec */}
                <View style={tw`w-12 items-center`}>
                  <Text style={tw`text-slate-400 text-[7px] font-bold mb-1`}>
                    E.Tec
                  </Text>
                  {["GMD", "TI", "MER", "BTR"].map((sub) => {
                    const canDo = canPerformAction("ERRORES_TEC");
                    return (
                      <TouchableOpacity
                        key={sub}
                        onPress={() => handleSubActionPress("ERRORES_TEC", sub)}
                        style={tw`mb-0.5 ${canDo ? "border-2 border-white rounded" : "opacity-70"}`}
                        activeOpacity={0.7}
                      >
                        <View
                          style={[
                            tw`w-10 h-10 rounded items-center justify-center`,
                            { backgroundColor: categoryColors["ERRORES_TEC"] },
                          ]}
                        >
                          <Text style={tw`text-black text-[8px] font-bold`}>
                            {sub}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </ScrollView>
          </View>
        </View>

        <View
          style={tw`bg-slate-950 p-2 mx-2 rounded-lg mt-2 flex-row items-center`}
        >
          <ScrollView horizontal style={tw`flex-1`}>
            {currentRally.map((action, idx) => (
              <View
                key={idx}
                style={tw`bg-slate-800 px-2 py-1 rounded mr-2 flex-row items-center`}
              >
                <Text style={tw`text-cyan-400 text-xs`}>{action.playerId}</Text>
                <Text style={tw`text-white text-xs mx-1`}>→</Text>
                <Text style={tw`text-white text-xs`}>{action.subAction}</Text>
                {action.value !== undefined && (
                  <Text style={tw`text-yellow-400 text-xs ml-1`}>
                    ({action.value})
                  </Text>
                )}
              </View>
            ))}
          </ScrollView>
          {currentRally.length > 0 && (
            <TouchableOpacity
              onPress={handleAutoCommit}
              style={tw`bg-cyan-600 px-3 py-1 rounded ml-2`}
            >
              <Text style={tw`text-white text-xs font-bold`}>GUARDAR</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={tw`mt-4 mx-2`}>
          <TouchableOpacity
            onPress={() => setIsStatsOpen(!isStatsOpen)}
            style={tw`bg-slate-800 p-3 rounded-lg flex-row justify-between items-center`}
          >
            <Text style={tw`text-white font-bold text-sm`}>
              📊 Análisis de Rendimiento
            </Text>
            <Ionicons
              name={isStatsOpen ? "chevron-up" : "chevron-down"}
              size={18}
              color="white"
            />
          </TouchableOpacity>
          {isStatsOpen && (
            <View style={tw`bg-slate-800 p-3 mt-2 rounded-lg`}>
              {[
                ...(eventData?.teamA?.players || []).map((p) => ({
                  ...p,
                  team: "A",
                })),
                ...(eventData?.teamB?.players || []).map((p) => ({
                  ...p,
                  team: "B",
                })),
              ].map((player) => {
                const pId = `${player.team}-${player.number}`;
                const stats = getPlayerStats(pId);
                if (!stats) return null;
                const color = player.team === "A" ? "#3b82f6" : "#ef4444";
                return (
                  <View key={pId} style={tw`mb-3 bg-slate-700 p-2 rounded-lg`}>
                    <View style={tw`flex-row justify-between items-center`}>
                      <Text style={tw`text-white font-bold text-xs`}>
                        #{player.number} {player.fullName}
                      </Text>
                      <Text style={tw`text-white text-xs`}>
                        {stats.general.efficiency}%
                      </Text>
                    </View>
                    <View style={tw`flex-row justify-between mt-1`}>
                      <Text style={tw`text-slate-300 text-xs`}>
                        Acc: {stats.general.totalActions}
                      </Text>
                      <Text style={tw`text-slate-300 text-xs`}>
                        Err: {stats.general.errors}
                      </Text>
                    </View>
                    <View style={tw`flex-row mt-2 gap-1`}>
                      {Object.entries(stats)
                        .filter(([key]) => key !== "general")
                        .map(([key, value]: [string, any]) => (
                          <View key={key} style={tw`flex-1 items-center`}>
                            <Text style={tw`text-slate-400 text-[8px]`}>
                              {key.toUpperCase()}
                            </Text>
                            <View
                              style={tw`h-1 bg-slate-600 rounded-full mt-0.5 w-full`}
                            >
                              <View
                                style={[
                                  tw`h-1 rounded-full`,
                                  {
                                    width: `${Math.max(0, Math.min(100, value.eff))}%`,
                                    backgroundColor: color,
                                  },
                                ]}
                              />
                            </View>
                            <Text style={tw`text-slate-300 text-[8px]`}>
                              {value.eff}%
                            </Text>
                          </View>
                        ))}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      <View
        style={tw`h-16 bg-slate-950 border-t border-slate-800 flex-row items-center justify-between px-4`}
      >
        <TouchableOpacity
          onPress={() => setIsManualOpen(!isManualOpen)}
          style={tw`flex-row items-center gap-1 px-3 py-1.5 rounded-lg border-b-2 ${isManualOpen ? "bg-slate-700 border-slate-900" : "bg-yellow-500 border-yellow-700"}`}
        >
          <Ionicons
            name={isManualOpen ? "close-circle" : "book"}
            size={16}
            color={isManualOpen ? "white" : "black"}
          />
          <Text
            style={tw`font-black text-[10px] uppercase ${isManualOpen ? "text-white" : "text-black"}`}
          >
            Manual
          </Text>
        </TouchableOpacity>

        <View
          style={tw`flex-row items-center gap-4 bg-slate-900/50 px-3 py-1 rounded-2xl border border-slate-800`}
        >
          <View style={tw`items-center`}>
            <Text style={tw`text-slate-600 font-black text-[7px] uppercase`}>
              Total
            </Text>
            <Text style={tw`text-white font-mono text-sm font-bold`}>
              {timers.formattedTotalTime}
            </Text>
          </View>
          <View style={tw`w-px h-6 bg-slate-800`} />
          <View style={tw`items-center`}>
            <Text style={tw`text-slate-600 font-black text-[7px] uppercase`}>
              Juego
            </Text>
            <Text
              style={[
                tw`font-mono text-sm font-bold`,
                timers.isRealTimeActive
                  ? tw`text-green-400`
                  : tw`text-slate-500`,
              ]}
            >
              {timers.formattedRealTime}
            </Text>
          </View>
        </View>

        <View style={tw`flex-row gap-2`}>
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
            style={tw`flex-row items-center gap-1 px-3 py-1.5 rounded-lg border-b-2 ${!timers.isTotalTimeActive ? "bg-green-600 border-green-800" : timers.isRealTimeActive ? "bg-orange-600 border-orange-800" : "bg-green-600 border-green-800"}`}
          >
            <Ionicons
              name={
                !timers.isTotalTimeActive
                  ? "play-skip-forward"
                  : timers.isRealTimeActive
                    ? "pause"
                    : "play"
              }
              size={16}
              color="white"
            />
            <Text style={tw`text-white font-black text-[10px] uppercase`}>
              {!timers.isTotalTimeActive
                ? "Iniciar"
                : timers.isRealTimeActive
                  ? "Pausa"
                  : "Reanudar"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handlePartialSave}
            style={tw`flex-row items-center gap-1 px-3 py-1.5 bg-slate-800 rounded-lg border-b-2 border-slate-950`}
          >
            <Ionicons name="stop-circle" size={16} color="#f87171" />
            <Text style={tw`text-white font-black text-[10px] uppercase`}>
              Parcial
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleFinishMatch}
            style={tw`flex-row items-center gap-1 px-3 py-1.5 bg-blue-600 rounded-lg border-b-2 border-blue-800`}
          >
            <Ionicons name="checkmark-circle" size={16} color="white" />
            <Text style={tw`text-white font-black text-[10px] uppercase`}>
              Fin
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={valuePopover.visible} transparent animationType="fade">
        <TouchableOpacity
          style={tw`flex-1 justify-center items-center bg-black/50`}
          activeOpacity={1}
          onPress={() =>
            setValuePopover({
              visible: false,
              subAction: "",
              allowedValues: [],
            })
          }
        >
          <View style={tw`bg-slate-800 p-4 rounded-xl`}>
            <Text style={tw`text-white text-center mb-4`}>
              {valuePopover.subAction} - Valor
            </Text>
            <View style={tw`flex-row gap-4 justify-center`}>
              {valuePopover.allowedValues.map((val) => (
                <TouchableOpacity
                  key={val}
                  onPress={() => {
                    confirmActionValue(val);
                    setValuePopover({
                      visible: false,
                      subAction: "",
                      allowedValues: [],
                    });
                    setIsWaitingForZone(true);
                  }}
                  style={tw`bg-yellow-500 w-12 h-12 rounded-full items-center justify-center`}
                >
                  <Text style={tw`text-black font-bold text-lg`}>{val}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

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
            ].map((player: any) => {
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
                      targetTeam === "A"
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
