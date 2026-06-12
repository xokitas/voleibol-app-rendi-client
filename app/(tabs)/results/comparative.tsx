// app/(tabs)/results/comparative.tsx
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import HeaderMenu from "../../../components/HeaderMenu";
import StatsPanel from "../../../components/results/StatsPanel";
import { useAggregatedStats } from "../../../hooks/useAggregatedStats";
import type {
  ComparisonFilters,
  ComparisonSet,
} from "../../../hooks/useComparative";
import { useStats } from "../../../hooks/useStats";
import tw from "../../../lib/tailwind";
import { useMatchStore } from "../../../src/store/useMatchStore";
import {
  actionAllowedValues,
  computeCategoriesAndRadar,
} from "../../../utils/analytics";

export default function ComparativeScreen() {
  const { set1Data, set2Data } = useLocalSearchParams<{
    set1Data?: string;
    set2Data?: string;
  }>();
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const isMobile = width < 1024;
  const savedMatches = useMatchStore((s) => s.savedMatches);

  const set1: ComparisonSet | null = useMemo(() => {
    if (!set1Data) return null;
    try {
      return JSON.parse(set1Data);
    } catch {
      return null;
    }
  }, [set1Data]);

  const set2: ComparisonSet | null = useMemo(() => {
    if (!set2Data) return null;
    try {
      return JSON.parse(set2Data);
    } catch {
      return null;
    }
  }, [set2Data]);

  const matches1 = useMemo(() => {
    if (!set1) return [];
    return savedMatches.filter((m) => set1.matchIds.includes(m.id));
  }, [savedMatches, set1]);

  const matches2 = useMemo(() => {
    if (!set2) return [];
    return savedMatches.filter((m) => set2.matchIds.includes(m.id));
  }, [savedMatches, set2]);

  const filters1: ComparisonFilters = set1?.filters ?? {
    playerName: "",
    teamName: "",
    denomination: "",
    category: "",
    eventType: "",
    place: "",
    meso: "",
    micro: "",
    gender: "",
  };
  const { aggregatedActions: actions1 } = useAggregatedStats(
    matches1,
    filters1,
  );
  const { getPlayerStats: getStats1 } = useStats(
    [{ actions: actions1.map((a) => ({ ...a, playerId: "any" })) }],
    actionAllowedValues,
  );
  const stats1 = getStats1("any");
  const { categoriesMap: categories1, radarData: radar1 } = useMemo(
    () => computeCategoriesAndRadar(actions1),
    [actions1],
  );

  const filters2: ComparisonFilters = set2?.filters ?? {
    playerName: "",
    teamName: "",
    denomination: "",
    category: "",
    eventType: "",
    place: "",
    meso: "",
    micro: "",
    gender: "",
  };
  const { aggregatedActions: actions2 } = useAggregatedStats(
    matches2,
    filters2,
  );
  const { getPlayerStats: getStats2 } = useStats(
    [{ actions: actions2.map((a) => ({ ...a, playerId: "any" })) }],
    actionAllowedValues,
  );
  const stats2 = getStats2("any");
  const { categoriesMap: categories2, radarData: radar2 } = useMemo(
    () => computeCategoriesAndRadar(actions2),
    [actions2],
  );

  // Estados de expansión separados para cada conjunto
  const [expandedMatchId1, setExpandedMatchId1] = useState<string | null>(null);
  const [expandedMatchId2, setExpandedMatchId2] = useState<string | null>(null);
  const [expandedSets1, setExpandedSets1] = useState<Record<string, boolean>>(
    {},
  );
  const [expandedSets2, setExpandedSets2] = useState<Record<string, boolean>>(
    {},
  );
  const [expandedRallies1, setExpandedRallies1] = useState<
    Record<string, boolean>
  >({});
  const [expandedRallies2, setExpandedRallies2] = useState<
    Record<string, boolean>
  >({});

  const toggleSetExpanded1 = (matchId: string, setNumber: number) => {
    const key = `${matchId}-set-${setNumber}`;
    setExpandedSets1((prev) => ({ ...prev, [key]: !prev[key] }));
  };
  const toggleSetExpanded2 = (matchId: string, setNumber: number) => {
    const key = `${matchId}-set-${setNumber}`;
    setExpandedSets2((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleRallyExpanded1 = (
    matchId: string,
    setNumber: number,
    rallyIndex: number,
  ) => {
    const key = `${matchId}-set-${setNumber}-rally-${rallyIndex}`;
    setExpandedRallies1((prev) => ({ ...prev, [key]: !prev[key] }));
  };
  const toggleRallyExpanded2 = (
    matchId: string,
    setNumber: number,
    rallyIndex: number,
  ) => {
    const key = `${matchId}-set-${setNumber}-rally-${rallyIndex}`;
    setExpandedRallies2((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const describeFilter = (filters: ComparisonFilters) => {
    const parts = [];
    if (filters.playerName) parts.push(`Jugador: ${filters.playerName}`);
    if (filters.teamName) parts.push(`Equipo: ${filters.teamName}`);
    if (filters.denomination) parts.push(`Denom.: ${filters.denomination}`);
    if (filters.category) parts.push(`Cat.: ${filters.category}`);
    if (filters.eventType) parts.push(`Tipo: ${filters.eventType}`);
    if (filters.place) parts.push(`Lugar: ${filters.place}`);
    if (filters.meso) parts.push(`Meso: ${filters.meso}`);
    if (filters.micro) parts.push(`Micro: ${filters.micro}`);
    if (filters.gender) parts.push(`Género: ${filters.gender}`);
    return parts.join(" · ") || "Sin filtros activos";
  };

  if (!set1 || !set2) {
    return (
      <SafeAreaView style={tw`flex-1 bg-white`}>
        <HeaderMenu title="Comparativa" onBack={() => router.back()} />
        <View style={tw`flex-1 justify-center items-center`}>
          <Text style={tw`text-slate-500`}>
            No se encontraron datos para la comparación.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderMatchList = (
    matches: typeof matches1,
    filters: ComparisonFilters,
    expandedMatchId: string | null,
    setExpandedMatchId: (id: string | null) => void,
    expandedSets: Record<string, boolean>,
    toggleSetExpanded: (matchId: string, setNumber: number) => void,
    expandedRallies: Record<string, boolean>,
    toggleRallyExpanded: (
      matchId: string,
      setNumber: number,
      rallyIndex: number,
    ) => void,
  ) => {
    const playerName = filters.playerName;
    const teamName = filters.teamName;
    const hasActivePlayer = playerName !== "";
    const hasActiveTeam = teamName !== "";

    return matches.map((match) => {
      const isExpanded = expandedMatchId === match.id;
      const matchPlayerId = playerName
        ? (() => {
            const playerA = match.config.teamA.players.find(
              (p) => p.fullName === playerName,
            );
            if (playerA) return `A-${playerA.number}`;
            const playerB = match.config.teamB.players.find(
              (p) => p.fullName === playerName,
            );
            if (playerB) return `B-${playerB.number}`;
            return null;
          })()
        : null;
      let teamPrefix: string | null = null;
      if (teamName) {
        if (match.config.teamA.name === teamName) teamPrefix = "A";
        else if (match.config.teamB.name === teamName) teamPrefix = "B";
      }

      const setWinners: Record<number, string> = {};
      match.history.forEach((set) => {
        const lastRally = set.rallies[set.rallies.length - 1];
        if (lastRally?.winner) setWinners[set.set] = lastRally.winner;
      });

      return (
        <View key={match.id} style={tw`mb-2`}>
          <TouchableOpacity
            onPress={() => setExpandedMatchId(isExpanded ? null : match.id)}
            style={tw`flex-row justify-between items-center bg-slate-50 ${
              isMobile ? "p-2" : "p-3"
            } rounded-xl border border-slate-200`}
          >
            <View style={tw`flex-1`}>
              <Text
                style={tw`font-bold text-[#003366] ${
                  isMobile ? "text-xs" : "text-sm"
                }`}
              >
                {match.config.tournament ||
                  match.config.denomination ||
                  "Partido"}
              </Text>
              <Text
                style={tw`${
                  isMobile ? "text-[10px]" : "text-xs"
                } text-slate-500`}
              >
                {match.config.teamA.name} vs {match.config.teamB.name} · Set{" "}
                {match.score.currentSet}
              </Text>
            </View>
            <Ionicons
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={isMobile ? 14 : 18}
              color="#003366"
            />
          </TouchableOpacity>
          {isExpanded && (
            <View
              style={tw`bg-white ${
                isMobile ? "p-2" : "p-3"
              } rounded-xl border border-slate-200 mt-1`}
            >
              {!hasActivePlayer && !hasActiveTeam && (
                <Text
                  style={tw`${
                    isMobile ? "text-[10px]" : "text-xs"
                  } text-slate-400 italic mb-2`}
                >
                  Sin filtro activo.
                </Text>
              )}
              {match.history.map((set) => {
                const setKey = `${match.id}-set-${set.set}`;
                const isSetExpanded = expandedSets[setKey];
                const winner = setWinners[set.set];
                return (
                  <View key={set.set} style={tw`mb-3`}>
                    <TouchableOpacity
                      onPress={() => toggleSetExpanded(match.id, set.set)}
                      style={tw`flex-row justify-between items-center bg-slate-100 ${
                        isMobile ? "p-1.5" : "p-2"
                      } rounded-lg`}
                    >
                      <View style={tw`flex-row items-center gap-2`}>
                        <Text
                          style={tw`${
                            isMobile ? "text-xs" : "text-sm"
                          } font-bold text-[#003366]`}
                        >
                          Set {set.set}
                        </Text>
                        {winner && (
                          <Text
                            style={tw`${
                              isMobile ? "text-[10px]" : "text-xs"
                            } font-bold ${winner === "A" ? "text-blue-600" : "text-red-600"}`}
                          >
                            {winner === "A" ? "Gana A" : "Gana B"}
                          </Text>
                        )}
                      </View>
                      <Ionicons
                        name={isSetExpanded ? "chevron-up" : "chevron-down"}
                        size={isMobile ? 12 : 16}
                        color="#003366"
                      />
                    </TouchableOpacity>
                    {isSetExpanded && (
                      <View style={tw`mt-2`}>
                        {set.rallies.length === 0 ? (
                          <Text
                            style={tw`${
                              isMobile ? "text-[10px]" : "text-xs"
                            } text-slate-400`}
                          >
                            Sin rallies registrados
                          </Text>
                        ) : (
                          set.rallies.map((rally, idx) => {
                            const rallyKey = `${match.id}-set-${set.set}-rally-${idx}`;
                            const isRallyExpanded = expandedRallies[rallyKey];
                            return (
                              <View key={idx} style={tw`mb-2`}>
                                <TouchableOpacity
                                  onPress={() =>
                                    toggleRallyExpanded(match.id, set.set, idx)
                                  }
                                  style={tw`flex-row justify-between items-center bg-slate-50 ${
                                    isMobile ? "p-1.5" : "p-2"
                                  } rounded-lg border border-slate-100`}
                                >
                                  <View style={tw`flex-row items-center gap-2`}>
                                    <Text
                                      style={tw`${
                                        isMobile ? "text-[10px]" : "text-xs"
                                      } font-bold text-slate-600`}
                                    >
                                      Rally {idx + 1}
                                    </Text>
                                    <Text
                                      style={tw`${
                                        isMobile ? "text-[10px]" : "text-xs"
                                      } text-slate-500`}
                                    >
                                      {rally.scoreAtTheTime.A}-
                                      {rally.scoreAtTheTime.B}
                                    </Text>
                                  </View>
                                  <Ionicons
                                    name={
                                      isRallyExpanded
                                        ? "chevron-up"
                                        : "chevron-down"
                                    }
                                    size={isMobile ? 10 : 14}
                                    color="#94a3b8"
                                  />
                                </TouchableOpacity>
                                {isRallyExpanded && (
                                  <View style={tw`mt-1 ml-2`}>
                                    {rally.actions.map((action, aIdx) => {
                                      const isHighlighted =
                                        (hasActivePlayer &&
                                          action.playerId === matchPlayerId) ||
                                        (hasActiveTeam &&
                                          teamPrefix &&
                                          action.playerId.startsWith(
                                            teamPrefix,
                                          ));
                                      return (
                                        <Text
                                          key={aIdx}
                                          style={tw`${
                                            isMobile ? "text-[10px]" : "text-xs"
                                          } py-0.5 px-1 rounded ${
                                            isHighlighted
                                              ? "bg-blue-100 text-blue-900 font-bold"
                                              : "text-slate-700"
                                          }`}
                                        >
                                          {action.playerId} → {action.category}/
                                          {action.subAction}{" "}
                                          {action.value !== undefined
                                            ? `(${action.value})`
                                            : ""}{" "}
                                          {action.origin &&
                                            `desde ${action.origin} hacia ${action.destination}`}
                                        </Text>
                                      );
                                    })}
                                  </View>
                                )}
                              </View>
                            );
                          })
                        )}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      );
    });
  };

  // Contenido de cada conjunto (ajustado para móvil)
  const column1 = (
    <View style={tw`flex-1 ${isMobile ? "mb-6" : "mr-2"}`}>
      <Text
        style={tw`${isMobile ? "text-base" : "text-lg"} font-bold text-blue-600 mb-2`}
      >
        Conjunto 1
      </Text>
      <Text
        style={tw`${isMobile ? "text-[10px]" : "text-xs"} text-slate-500 mb-2`}
      >
        {describeFilter(filters1)}
      </Text>
      <View style={tw`bg-blue-50 ${isMobile ? "p-2" : "p-3"} rounded-xl mb-3`}>
        <Text style={tw`${isMobile ? "text-xs" : "text-sm"} text-slate-700`}>
          {stats1.general.totalActions} acciones | {stats1.general.errors}{" "}
          errores | {stats1.general.efficiency}% efect.
        </Text>
      </View>
      <StatsPanel
        radarData={radar1}
        categories={categories1}
        color="#3b82f6"
        radarSize={isMobile ? 140 : 220}
      />
      <Text
        style={tw`${isMobile ? "text-xs" : "text-sm"} font-bold text-slate-500 mt-4 mb-2`}
      >
        Partidos incluidos ({matches1.length})
      </Text>
      {renderMatchList(
        matches1,
        filters1,
        expandedMatchId1,
        setExpandedMatchId1,
        expandedSets1,
        toggleSetExpanded1,
        expandedRallies1,
        toggleRallyExpanded1,
      )}
    </View>
  );

  const column2 = (
    <View style={tw`flex-1 ${isMobile ? "mt-6" : "ml-2"}`}>
      <Text
        style={tw`${isMobile ? "text-base" : "text-lg"} font-bold text-red-600 mb-2`}
      >
        Conjunto 2
      </Text>
      <Text
        style={tw`${isMobile ? "text-[10px]" : "text-xs"} text-slate-500 mb-2`}
      >
        {describeFilter(filters2)}
      </Text>
      <View style={tw`bg-red-50 ${isMobile ? "p-2" : "p-3"} rounded-xl mb-3`}>
        <Text style={tw`${isMobile ? "text-xs" : "text-sm"} text-slate-700`}>
          {stats2.general.totalActions} acciones | {stats2.general.errors}{" "}
          errores | {stats2.general.efficiency}% efect.
        </Text>
      </View>
      <StatsPanel
        radarData={radar2}
        categories={categories2}
        color="#ef4444"
        radarSize={isMobile ? 140 : 220}
      />
      <Text
        style={tw`${isMobile ? "text-xs" : "text-sm"} font-bold text-slate-500 mt-4 mb-2`}
      >
        Partidos incluidos ({matches2.length})
      </Text>
      {renderMatchList(
        matches2,
        filters2,
        expandedMatchId2,
        setExpandedMatchId2,
        expandedSets2,
        toggleSetExpanded2,
        expandedRallies2,
        toggleRallyExpanded2,
      )}
    </View>
  );

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      <HeaderMenu
        title="Comparativa"
        dark={false}
        showQuickNav={false}
        onBack={() => router.replace("/(tabs)/results/statistics")}
        compact={isMobile}
      />
      <ScrollView
        contentContainerStyle={tw`${isMobile ? "p-2 pb-6" : "p-4 pb-10"}`}
      >
        <Text
          style={tw`${isMobile ? "text-lg" : "text-xl"} font-black text-[#003366] mb-6 text-center`}
        >
          Comparación de conjuntos
        </Text>
        {isMobile ? (
          <View style={tw`flex-col`}>
            <ScrollView
              style={{ height: height * 0.7 }}
              nestedScrollEnabled={true}
            >
              {column1}
            </ScrollView>
            <ScrollView
              style={{ height: height * 0.7, marginTop: 16 }}
              nestedScrollEnabled={true}
            >
              {column2}
            </ScrollView>
          </View>
        ) : (
          <View style={tw`flex-row`}>
            {column1}
            {column2}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
