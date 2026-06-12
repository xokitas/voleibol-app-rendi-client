// app/(tabs)/results/selected-stats.tsx
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
import type { ComparisonFilters } from "../../../hooks/useComparative";
import { useStats } from "../../../hooks/useStats";
import tw from "../../../lib/tailwind";
import { useMatchStore } from "../../../src/store/useMatchStore";
import {
  actionAllowedValues,
  computeCategoriesAndRadar,
} from "../../../utils/analytics";
import { exportStatsToPDF } from "../../../utils/exportPDF";

export default function SelectedStatsScreen() {
  const { filters, matchIds } = useLocalSearchParams<{
    filters?: string;
    matchIds?: string;
  }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 1024;
  const savedMatches = useMatchStore((s) => s.savedMatches);

  const parsedFilters: ComparisonFilters = useMemo(() => {
    if (!filters)
      return {
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
    try {
      return JSON.parse(filters);
    } catch {
      return {} as ComparisonFilters;
    }
  }, [filters]);

  const parsedMatchIds: string[] = useMemo(() => {
    if (!matchIds) return [];
    try {
      return JSON.parse(matchIds);
    } catch {
      return [];
    }
  }, [matchIds]);

  const selectedMatches = useMemo(() => {
    return savedMatches.filter((m) => parsedMatchIds.includes(m.id));
  }, [savedMatches, parsedMatchIds]);

  const { aggregatedActions } = useAggregatedStats(
    selectedMatches,
    parsedFilters,
  );

  const actionsMappedForStats = aggregatedActions.map((a) => ({
    ...a,
    playerId: "any",
  }));
  const { getPlayerStats: getGlobalStats } = useStats(
    [{ actions: actionsMappedForStats }],
    actionAllowedValues,
  );
  const generalStats = getGlobalStats("any");
  const { categoriesMap, radarData } = useMemo(
    () => computeCategoriesAndRadar(aggregatedActions),
    [aggregatedActions],
  );

  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);
  const [expandedSets, setExpandedSets] = useState<Record<string, boolean>>({});
  const [expandedRallies, setExpandedRallies] = useState<
    Record<string, boolean>
  >({});

  const toggleSetExpanded = (matchId: string, setNumber: number) => {
    const key = `${matchId}-set-${setNumber}`;
    setExpandedSets((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleRallyExpanded = (
    matchId: string,
    setNumber: number,
    rallyIndex: number,
  ) => {
    const key = `${matchId}-set-${setNumber}-rally-${rallyIndex}`;
    setExpandedRallies((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleExportPDF = async () => {
    const title = `Estadísticas de ${parsedFilters.playerName || parsedFilters.teamName || "Conjunto seleccionado"}`;
    await exportStatsToPDF(
      title,
      generalStats.general.totalActions,
      generalStats.general.errors,
      generalStats.general.efficiency,
      categoriesMap,
      parsedMatchIds,
      selectedMatches,
    );
  };

  const playerName = parsedFilters.playerName;
  const teamName = parsedFilters.teamName;

  const renderMatchList = () => {
    return selectedMatches.map((match) => {
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
      if (teamName && match.config.teamA.name === teamName) teamPrefix = "A";
      else if (teamName && match.config.teamB.name === teamName)
        teamPrefix = "B";

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
                style={tw`text-slate-500 ${
                  isMobile ? "text-[10px]" : "text-xs"
                }`}
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
                                        (playerName &&
                                          action.playerId === matchPlayerId) ||
                                        (teamName &&
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

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      <HeaderMenu
        title="Estadísticas Seleccionadas"
        onBack={() => router.replace("/(tabs)/results/statistics")}
        dark={false}
        showQuickNav={false}
        compact={isMobile}
      />
      <ScrollView
        contentContainerStyle={tw`${isMobile ? "p-2 pb-6" : "p-4 pb-10"}`}
      >
        <Text
          style={tw`${isMobile ? "text-lg" : "text-xl"} font-black text-[#003366] mb-4`}
        >
          {parsedFilters.playerName || parsedFilters.teamName || "Estadísticas"}
        </Text>
        <Text
          style={tw`${isMobile ? "text-xs" : "text-sm"} text-slate-500 mb-2`}
        >
          {selectedMatches.length} partidos seleccionados
        </Text>

        <View
          style={tw`bg-blue-50 ${isMobile ? "p-2" : "p-3"} rounded-xl mb-4`}
        >
          <Text
            style={tw`${isMobile ? "text-sm" : "text-base"} font-bold text-blue-900`}
          >
            {generalStats.general.totalActions} acciones |{" "}
            {generalStats.general.errors} errores |{" "}
            {generalStats.general.efficiency}% efectividad
          </Text>
        </View>

        {aggregatedActions.length > 0 && (
          <View
            style={tw`bg-white border border-slate-100 rounded-2xl ${
              isMobile ? "p-1" : "p-2"
            } shadow-sm mb-4`}
          >
            <StatsPanel
              radarData={radarData}
              categories={categoriesMap}
              color="#3b82f6"
              radarSize={isMobile ? 140 : 220}
            />
          </View>
        )}

        <Text
          style={tw`${isMobile ? "text-base" : "text-lg"} font-bold text-[#003366] mb-2`}
        >
          Partidos incluidos
        </Text>
        {renderMatchList()}

        <View style={tw`flex-row justify-end gap-3 mt-6`}>
          <TouchableOpacity
            onPress={handleExportPDF}
            style={tw`flex-row items-center justify-center bg-red-600 ${
              isMobile ? "py-2 px-4" : "py-3 px-5"
            } rounded-xl`}
          >
            <Ionicons
              name="document-outline"
              size={isMobile ? 14 : 18}
              color="white"
            />
            <Text
              style={tw`text-white font-bold ${
                isMobile ? "text-xs ml-1" : "text-sm ml-2"
              }`}
            >
              Exportar a PDF (completo)
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
