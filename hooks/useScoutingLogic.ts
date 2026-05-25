// hooks/useScoutingLogic.ts
import { useEffect, useMemo, useState } from "react";
import {
  useMatchStore,
  type MatchRules,
  type RallyAction,
} from "../src/store/useMatchStore";

const ACTION_FLOW: Record<string, string[]> = {
  START: [
    "SERVICIO",
    "ERRORES_SERV",
    "ERRORES_COM",
    "ERRORES_POS",
    "ERRORES_TEC",
  ],
  SERVICIO: [
    "RECEPCION",
    "DEFENSA",
    "ERRORES_COM",
    "ERRORES_POS",
    "ERRORES_TEC",
  ],
  RECEPCION: ["ACOMODADA", "ERRORES_COM", "ERRORES_POS", "ERRORES_TEC"],
  DEFENSA: ["ACOMODADA", "ERRORES_COM", "ERRORES_POS", "ERRORES_TEC"],
  ACOMODADA: ["ATAQUE", "ERRORES_COM", "ERRORES_POS", "ERRORES_TEC"],
  ATAQUE: ["BLOQUEO", "DEFENSA", "ERRORES_COM", "ERRORES_POS", "ERRORES_TEC"],
  BLOQUEO: [
    "ACOMODADA",
    "DEFENSA",
    "ERRORES_COM",
    "ERRORES_POS",
    "ERRORES_TEC",
  ],
};

export const useScoutingLogic = () => {
  const addRallyAction = useMatchStore((s) => s.addRallyAction);
  const finishRally = useMatchStore((s) => s.finishRally);
  const clearCurrentRally = useMatchStore((s) => s.clearCurrentRally);
  const incrementSetsA = useMatchStore((s) => s.incrementSetsA);
  const incrementSetsB = useMatchStore((s) => s.incrementSetsB);
  const setCurrentSet = useMatchStore((s) => s.setCurrentSet);
  const setPointsA = useMatchStore((s) => s.setPointsA);
  const setPointsB = useMatchStore((s) => s.setPointsB);

  const currentMatch = useMatchStore((s) => s.currentMatch);
  const score = currentMatch?.score ?? {
    pointsA: 0,
    pointsB: 0,
    setsA: 0,
    setsB: 0,
    currentSet: 1,
  };
  const pointsA = score.pointsA;
  const pointsB = score.pointsB;
  const setsA = score.setsA;
  const setsB = score.setsB;
  const currentSet = score.currentSet;

  // Reglas por defecto
  const rules: MatchRules = currentMatch?.config?.rules ?? {
    pointsToWinSet: 21,
    pointsToWinLastSet: 15,
    minDifference: 2,
    maxSets: 3,
    switchIntervalNormal: 7,
    switchIntervalLast: 5,
    hasTimeLimit: false,
  };

  const currentRallyActions = useMemo<RallyAction[]>(() => {
    if (!currentMatch) return [];
    const setEntry = currentMatch.history.find((h) => h.set === currentSet);
    if (!setEntry) return [];
    const lastRally = setEntry.rallies[setEntry.rallies.length - 1];
    if (lastRally && !lastRally.winner) return lastRally.actions;
    return [];
  }, [currentMatch, currentSet]);

  const rallyHistory =
    currentMatch?.history.flatMap((set) =>
      set.rallies.map((rally) => ({
        set: set.set,
        winner: rally.winner,
        actions: rally.actions,
        scoreAtTheTime: rally.scoreAtTheTime,
      })),
    ) ?? [];

  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<{
    category: string;
    subAction: string;
    playerId: string;
    value?: number;
    origin?: string;
    destination?: string;
  } | null>(null);
  const [mustSwitchSide, setMustSwitchSide] = useState(false);
  const [windA, setWindA] = useState("VIENTO A FAVOR");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isEditingAction, setIsEditingAction] = useState(false);

  const swapWindDirection = (current: string) =>
    current === "VIENTO A FAVOR" ? "VIENTO EN CONTRA" : "VIENTO A FAVOR";
  const toggleWind = () => setWindA((prev) => swapWindDirection(prev));

  // Cambio de lado usando reglas
  useEffect(() => {
    const totalPoints = pointsA + pointsB;
    const switchInterval =
      currentSet < rules.maxSets
        ? rules.switchIntervalNormal
        : rules.switchIntervalLast;
    if (totalPoints > 0 && totalPoints % switchInterval === 0) {
      setMustSwitchSide(true);
      setWindA((prev) => swapWindDirection(prev));
    } else {
      setMustSwitchSide(false);
    }
  }, [pointsA, pointsB, currentSet, rules]);

  const handlePlayerSelect = (id: string) => setSelectedPlayerId(id);

  const handleActionClick = (category: string, subAction: string) => {
    if (!selectedPlayerId) return;
    setIsEditingAction(false);
    setPendingAction({ category, subAction, playerId: selectedPlayerId });
  };

  const confirmActionValue = (value: number) => {
    if (!pendingAction) return;
    setPendingAction((prev) => (prev ? { ...prev, value } : null));
  };

  const updatePendingZones = (origin: string, destination: string) => {
    if (!pendingAction || pendingAction.value === undefined) return;
    const teamLetter = pendingAction.playerId.split("-")[0];
    const actionWind =
      teamLetter === "A"
        ? windA
        : windA === "VIENTO A FAVOR"
          ? "VIENTO EN CONTRA"
          : "VIENTO A FAVOR";
    const finalAction: RallyAction = {
      ...pendingAction,
      origin,
      destination,
      wind: actionWind,
      timestamp: new Date().toISOString(),
    };
    addRallyAction(
      finalAction,
      editingIndex !== null ? editingIndex : undefined,
    );
    setPendingAction(null);
    setSelectedPlayerId(null);
    setEditingIndex(null);
    setIsEditingAction(false);
  };

  const editRallyAction = (index: number) => {
    const actionToEdit = currentRallyActions[index];
    if (!actionToEdit) return;
    setEditingIndex(index);
    setIsEditingAction(true);
    const remainingActions = currentRallyActions.filter((_, i) => i !== index);
    clearCurrentRally();
    remainingActions.forEach((action) => addRallyAction(action));
    setSelectedPlayerId(actionToEdit.playerId);
    setPendingAction({
      playerId: actionToEdit.playerId,
      category: actionToEdit.category,
      subAction: actionToEdit.subAction,
      value: undefined,
      origin: actionToEdit.origin,
      destination: actionToEdit.destination,
    });
  };

  const commitPoint = (teamWhoWon: "A" | "B") => {
    finishRally(teamWhoWon);
    const updatedState = useMatchStore.getState();
    const updatedScore = updatedState.currentMatch?.score;
    if (!updatedScore) return;
    const newPointsA = updatedScore.pointsA;
    const newPointsB = updatedScore.pointsB;
    const pointsToWin =
      currentSet < rules.maxSets
        ? rules.pointsToWinSet
        : rules.pointsToWinLastSet;
    const leadingScore = teamWhoWon === "A" ? newPointsA : newPointsB;
    const trailingScore = teamWhoWon === "A" ? newPointsB : newPointsA;
    if (
      leadingScore >= pointsToWin &&
      leadingScore - trailingScore >= rules.minDifference
    ) {
      if (teamWhoWon === "A") incrementSetsA();
      else incrementSetsB();
      setPointsA(0);
      setPointsB(0);
      setCurrentSet(currentSet + 1);
    }
  };

  const clearRally = () => {
    clearCurrentRally();
    setPendingAction(null);
    setSelectedPlayerId(null);
    setEditingIndex(null);
    setIsEditingAction(false);
  };

  const canPerformAction = (cat: string) => {
    if (cat.startsWith("ERRORES")) return true;
    let context: string;
    if (editingIndex !== null) {
      context =
        editingIndex === 0
          ? "START"
          : currentRallyActions[editingIndex - 1]?.category || "START";
    } else {
      context =
        currentRallyActions.length === 0
          ? "START"
          : currentRallyActions[currentRallyActions.length - 1].category;
    }
    const allowed = ACTION_FLOW[context];
    if (!allowed) return cat === "SERVICIO";
    return allowed.includes(cat);
  };

  return {
    score: { A: pointsA, B: pointsB },
    sets: { A: setsA, B: setsB },
    wind: { A: windA, B: swapWindDirection(windA) },
    currentSet,
    currentRally: currentRallyActions,
    rallyHistory,
    mustSwitchSide,
    selectedPlayerId,
    pendingAction,
    isEditingAction,
    canPerformAction,
    handlePlayerSelect,
    handleActionClick,
    confirmActionValue,
    updatePendingZones,
    commitPoint,
    clearRally,
    toggleWind,
    editRallyAction,
    setPointsA,
    setPointsB,
    setCurrentSet,
    incrementSetsA,
    incrementSetsB,
  };
};
