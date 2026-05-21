// app/(tabs)/results/[matchId].tsx
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import HeaderMenu from "../../../components/HeaderMenu";
import StatsPanel, {
  CategoryStats,
} from "../../../components/results/StatsPanel";
import tw from "../../../lib/tailwind";
import {
  useMatchStore,
  type RallyAction,
} from "../../../src/store/useMatchStore";

// Constantes (sin cambios)
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

const ALL_SUB_ACTIONS: Record<string, string[]> = {
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

const getMaxValue = (subAction: string): number => {
  const allowed = actionAllowedValues[subAction];
  if (!allowed) return 4;
  return Math.max(...allowed);
};

interface TeamStats {
  totalActions: number;
  errors: number;
  effectiveness: number;
  errorEffectiveness: number;
  categories: Record<string, CategoryStats>;
}

export default function MatchDetailScreen() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const router = useRouter();
  const match = useMatchStore((s) =>
    s.savedMatches.find((m) => m.id === matchId),
  );

  if (!match) {
    return (
      <SafeAreaView style={tw`flex-1 bg-white`}>
        <Text style={tw`text-center mt-10`}>Partido no encontrado</Text>
      </SafeAreaView>
    );
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getWinner = () => {
    if (match.score.setsA === 2) return match.config.teamA.name;
    if (match.score.setsB === 2) return match.config.teamB.name;
    return "No definido";
  };

  const teamAPlayers = match.config.teamA.players.map((p) => ({
    ...p,
    team: "A",
  }));
  const teamBPlayers = match.config.teamB.players.map((p) => ({
    ...p,
    team: "B",
  }));
  const allPlayers = [...teamAPlayers, ...teamBPlayers];

  // Estadísticas individuales
  const playerStats = useMemo(() => {
    const statsMap: Record<
      string,
      {
        totalActions: number;
        errors: number;
        effectiveness: number;
        errorEffectiveness: number;
        categories: Record<string, CategoryStats>;
      }
    > = {};

    allPlayers.forEach((p) => {
      const id = `${p.team}-${p.number}`;
      statsMap[id] = {
        totalActions: 0,
        errors: 0,
        effectiveness: 0,
        errorEffectiveness: 0,
        categories: {},
      };
      Object.entries(ALL_SUB_ACTIONS).forEach(([cat, subs]) => {
        if (!statsMap[id].categories[cat]) {
          statsMap[id].categories[cat] = {
            total: 0,
            positive: 0,
            negative: 0,
            effectiveness: 0,
            subs: {},
          };
        }
        subs.forEach((sub) => {
          if (!statsMap[id].categories[cat].subs[sub]) {
            statsMap[id].categories[cat].subs[sub] = {
              total: 0,
              positive: 0,
              negative: 0,
              effectiveness: 0,
            };
          }
        });
      });
    });

    match.history.forEach((set) => {
      set.rallies.forEach((rally) => {
        rally.actions.forEach((action: RallyAction) => {
          const playerId = action.playerId;
          if (!statsMap[playerId]) return;
          const player = statsMap[playerId];
          player.totalActions++;
          if (action.category.startsWith("ERRORES")) player.errors++;
          const cat = action.category;
          const sub = action.subAction;
          const maxVal = getMaxValue(sub);
          const isPositive = (action.value ?? 0) === maxVal;
          const isNegative = (action.value ?? 0) === 0;
          if (!player.categories[cat]) {
            player.categories[cat] = {
              total: 0,
              positive: 0,
              negative: 0,
              effectiveness: 0,
              subs: {},
            };
          }
          player.categories[cat].total++;
          if (isPositive) player.categories[cat].positive++;
          if (isNegative) player.categories[cat].negative++;
          if (!player.categories[cat].subs[sub]) {
            player.categories[cat].subs[sub] = {
              total: 0,
              positive: 0,
              negative: 0,
              effectiveness: 0,
            };
          }
          player.categories[cat].subs[sub].total++;
          if (isPositive) player.categories[cat].subs[sub].positive++;
          if (isNegative) player.categories[cat].subs[sub].negative++;
        });
      });
    });

    Object.keys(statsMap).forEach((id) => {
      const player = statsMap[id];
      let totalPos = 0,
        totalNeg = 0;
      let errorPos = 0,
        errorNeg = 0,
        errorTotal = 0;

      Object.entries(player.categories).forEach(([catName, catData]) => {
        catData.effectiveness =
          catData.total > 0
            ? ((catData.positive - catData.negative) / catData.total) * 100
            : 0;
        totalPos += catData.positive;
        totalNeg += catData.negative;

        Object.entries(catData.subs).forEach(([subName, subData]) => {
          subData.effectiveness =
            subData.total > 0
              ? ((subData.positive - subData.negative) / subData.total) * 100
              : 0;
        });

        if (catName.startsWith("ERRORES")) {
          errorPos += catData.positive;
          errorNeg += catData.negative;
          errorTotal += catData.total;
        }
      });

      player.effectiveness =
        player.totalActions > 0
          ? ((totalPos - totalNeg) / player.totalActions) * 100
          : 0;
      player.errorEffectiveness =
        errorTotal > 0 ? ((errorPos - errorNeg) / errorTotal) * 100 : 0;
    });

    return statsMap;
  }, [match, allPlayers]);

  // Agregaciones por equipo
  const teamAggregatedStats: { A: TeamStats; B: TeamStats } = useMemo(() => {
    const aggregate = (players: typeof teamAPlayers): TeamStats => {
      const categories: Record<string, CategoryStats> = {};
      let totalActions = 0,
        totalErrors = 0,
        totalPos = 0,
        totalNeg = 0;
      let errorPos = 0,
        errorNeg = 0,
        errorTotal = 0;

      Object.entries(ALL_SUB_ACTIONS).forEach(([cat, subs]) => {
        categories[cat] = {
          total: 0,
          positive: 0,
          negative: 0,
          effectiveness: 0,
          subs: {},
        };
        subs.forEach((sub) => {
          categories[cat].subs[sub] = {
            total: 0,
            positive: 0,
            negative: 0,
            effectiveness: 0,
          };
        });
      });

      players.forEach((p) => {
        const id = `${p.team}-${p.number}`;
        const s = playerStats[id];
        if (!s) return;
        totalActions += s.totalActions;
        totalErrors += s.errors;
        Object.entries(s.categories).forEach(([cat, data]) => {
          if (!categories[cat]) {
            categories[cat] = {
              total: 0,
              positive: 0,
              negative: 0,
              effectiveness: 0,
              subs: {},
            };
          }
          categories[cat].total += data.total;
          categories[cat].positive += data.positive;
          categories[cat].negative += data.negative;
          totalPos += data.positive;
          totalNeg += data.negative;
          if (cat.startsWith("ERRORES")) {
            errorPos += data.positive;
            errorNeg += data.negative;
            errorTotal += data.total;
          }
          Object.entries(data.subs).forEach(([sub, subData]) => {
            if (!categories[cat].subs[sub]) {
              categories[cat].subs[sub] = {
                total: 0,
                positive: 0,
                negative: 0,
                effectiveness: 0,
              };
            }
            categories[cat].subs[sub].total += subData.total;
            categories[cat].subs[sub].positive += subData.positive;
            categories[cat].subs[sub].negative += subData.negative;
          });
        });
      });

      Object.keys(categories).forEach((cat) => {
        const catData = categories[cat];
        catData.effectiveness =
          catData.total > 0
            ? ((catData.positive - catData.negative) / catData.total) * 100
            : 0;
        Object.keys(catData.subs).forEach((sub) => {
          const subData = catData.subs[sub];
          subData.effectiveness =
            subData.total > 0
              ? ((subData.positive - subData.negative) / subData.total) * 100
              : 0;
        });
      });
      const effectiveness =
        totalActions > 0 ? ((totalPos - totalNeg) / totalActions) * 100 : 0;
      const errorEffectiveness =
        errorTotal > 0 ? ((errorPos - errorNeg) / errorTotal) * 100 : 0;

      return {
        totalActions,
        errors: totalErrors,
        effectiveness,
        errorEffectiveness,
        categories,
      };
    };

    return { A: aggregate(teamAPlayers), B: aggregate(teamBPlayers) };
  }, [playerStats, teamAPlayers, teamBPlayers]);

  const PlayerCard = ({
    player,
    teamColor,
    teamBorder,
    teamBg,
  }: {
    player: (typeof allPlayers)[0];
    teamColor: string;
    teamBorder: string;
    teamBg: string;
  }) => {
    const pId = `${player.team}-${player.number}`;
    const stats = playerStats[pId];
    if (!stats) return null;
    const [expanded, setExpanded] = useState(false);

    const radarData = [
      ...Object.entries(stats.categories)
        .filter(([cat]) => !cat.startsWith("ERRORES"))
        .map(([cat, data]) => ({
          label: cat.substring(0, 4),
          value: Math.max(0, data.effectiveness),
        })),
      { label: "Errores", value: Math.max(0, stats.errorEffectiveness) },
    ];

    const color = player.team === "A" ? "#3b82f6" : "#ef4444";

    return (
      <View
        style={tw`mb-2 rounded-xl border ${teamBorder} ${teamBg} overflow-hidden`}
      >
        <TouchableOpacity
          onPress={() => setExpanded(!expanded)}
          style={tw`flex-row items-center justify-between p-2`}
        >
          <View style={tw`flex-1`}>
            <Text style={tw`font-bold text-[#003366] text-xs`}>
              #{player.number} {player.fullName}
            </Text>
            <Text style={tw`text-[10px] text-slate-500`}>
              {stats.totalActions} acc · {stats.errors} err · Efect.{" "}
              {stats.effectiveness.toFixed(0)}%
            </Text>
          </View>
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={16}
            color={color}
          />
        </TouchableOpacity>
        {expanded && (
          <View style={tw`px-3 pb-3`}>
            <StatsPanel
              radarData={radarData}
              categories={stats.categories}
              color={color}
              radarSize={180}
            />
          </View>
        )}
      </View>
    );
  };

  const TeamSection = ({
    teamName,
    players,
    teamColor,
    teamBorder,
    teamBg,
    stats,
  }: {
    teamName: string;
    players: typeof teamAPlayers;
    teamColor: string;
    teamBorder: string;
    teamBg: string;
    stats: TeamStats;
  }) => {
    const [open, setOpen] = useState(true);
    const color = teamBorder === "border-blue-500" ? "#3b82f6" : "#ef4444";

    const radarData = [
      ...Object.entries(stats.categories)
        .filter(([cat]) => !cat.startsWith("ERRORES"))
        .map(([cat, data]) => ({
          label: cat.substring(0, 4),
          value: Math.max(0, data.effectiveness),
        })),
      { label: "Errores", value: Math.max(0, stats.errorEffectiveness) },
    ];

    return (
      <View style={tw`mb-4`}>
        <TouchableOpacity
          onPress={() => setOpen(!open)}
          style={tw`flex-row items-center justify-between p-3 rounded-xl border ${teamBorder} ${teamBg}`}
        >
          <View style={tw`flex-1`}>
            <Text style={tw`font-bold text-[#003366] text-base`}>
              {teamName}
            </Text>
            <Text style={tw`text-xs text-slate-600`}>
              {stats.totalActions} acc · {stats.errors} err · Efect.{" "}
              {stats.effectiveness.toFixed(0)}%
            </Text>
          </View>
          <Ionicons
            name={open ? "chevron-up" : "chevron-down"}
            size={20}
            color={color}
          />
        </TouchableOpacity>
        {open && (
          <View style={tw`mt-2 px-3`}>
            <StatsPanel
              radarData={radarData}
              categories={stats.categories}
              color={color}
              radarSize={200}
            />
            <View style={tw`mt-3`}>
              {players.map((player, idx) => (
                <PlayerCard
                  key={idx}
                  player={player}
                  teamColor={teamColor}
                  teamBorder={teamBorder}
                  teamBg={teamBg}
                />
              ))}
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      <HeaderMenu
        title="Detalle del Partido"
        dark={false}
        showQuickNav={true}
        onBack={() => router.replace("/(tabs)/results")} // ← Ahora va a la lista de resultados
      />
      <ScrollView contentContainerStyle={tw`p-5 pb-20`}>
        {/* Datos de registro (igual que antes) */}
        <View
          style={tw`mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-200`}
        >
          <Text style={tw`text-2xl font-black text-[#003366] mb-2`}>
            {match.config.tournament || "Partido"}
          </Text>
          <View style={tw`flex-row flex-wrap gap-2 mb-3`}>
            <View style={tw`bg-[#003366]/10 px-3 py-1 rounded-full`}>
              <Text style={tw`text-xs font-bold text-[#003366]`}>
                {formatDate(match.config.date)}
              </Text>
            </View>
            {match.config.startTime && (
              <View style={tw`bg-[#003366]/10 px-3 py-1 rounded-full`}>
                <Text style={tw`text-xs font-bold text-[#003366]`}>
                  {match.config.startTime}
                </Text>
              </View>
            )}
            <View style={tw`bg-slate-200 px-3 py-1 rounded-full`}>
              <Text style={tw`text-xs font-bold text-slate-700`}>
                {match.config.category}
              </Text>
            </View>
            <View style={tw`bg-slate-200 px-3 py-1 rounded-full`}>
              <Text style={tw`text-xs font-bold text-slate-700`}>
                {match.config.branch === "M" ? "Masculino" : "Femenino"}
              </Text>
            </View>
            <View style={tw`bg-slate-200 px-3 py-1 rounded-full`}>
              <Text style={tw`text-xs font-bold text-slate-700`}>
                Partido #{match.config.matchNumber}
              </Text>
            </View>
            {match.config.place && (
              <View style={tw`bg-slate-200 px-3 py-1 rounded-full`}>
                <Text style={tw`text-xs font-bold text-slate-700`}>
                  Lugar: {match.config.place}
                </Text>
              </View>
            )}
            {match.config.denomination && (
              <View style={tw`bg-slate-200 px-3 py-1 rounded-full`}>
                <Text style={tw`text-xs font-bold text-slate-700`}>
                  {match.config.denomination}
                </Text>
              </View>
            )}
            {match.config.meso && (
              <View style={tw`bg-slate-200 px-3 py-1 rounded-full`}>
                <Text style={tw`text-xs font-bold text-slate-700`}>
                  {match.config.meso} / {match.config.micro} (
                  {match.config.weekDay} #{match.config.microNumber})
                </Text>
              </View>
            )}
            {match.config.objective && (
              <View style={tw`bg-slate-200 px-3 py-1 rounded-full`}>
                <Text style={tw`text-xs font-bold text-slate-700`}>
                  Objetivo: {match.config.objective}
                </Text>
              </View>
            )}
          </View>
          <View style={tw`flex-row justify-between items-center mt-4`}>
            <View style={tw`flex-1 items-center`}>
              <Text style={tw`text-lg font-bold text-[#003366]`}>
                {match.config.teamA.name}
              </Text>
              <Text style={tw`text-5xl font-black text-[#003366]`}>
                {match.score.setsA}
              </Text>
            </View>
            <Text style={tw`text-3xl font-black text-slate-400`}>-</Text>
            <View style={tw`flex-1 items-center`}>
              <Text style={tw`text-lg font-bold text-[#003366]`}>
                {match.config.teamB.name}
              </Text>
              <Text style={tw`text-5xl font-black text-[#003366]`}>
                {match.score.setsB}
              </Text>
            </View>
          </View>
          <Text style={tw`text-center mt-3 text-green-600 font-bold text-lg`}>
            🏆 Ganador: {getWinner()}
          </Text>
          <Text style={tw`text-center text-slate-500 text-sm`}>
            Último set: {match.score.currentSet} ({match.score.pointsA}-
            {match.score.pointsB})
          </Text>
        </View>

        <Text style={tw`text-xl font-black text-slate-400 uppercase mb-4`}>
          Rendimiento por Equipos
        </Text>
        <TeamSection
          teamName={match.config.teamA.name}
          players={teamAPlayers}
          teamColor="text-blue-400"
          teamBorder="border-blue-500"
          teamBg="bg-blue-900/20"
          stats={teamAggregatedStats.A}
        />
        <TeamSection
          teamName={match.config.teamB.name}
          players={teamBPlayers}
          teamColor="text-red-400"
          teamBorder="border-red-500"
          teamBg="bg-red-900/20"
          stats={teamAggregatedStats.B}
        />

        <Text style={tw`text-xl font-black text-slate-400 uppercase mt-8 mb-4`}>
          Desarrollo del Partido
        </Text>
        {match.history.map((set) => (
          <View key={set.set} style={tw`mb-4`}>
            <Text style={tw`text-lg font-bold text-[#003366] mb-2`}>
              Set {set.set}
            </Text>
            {set.rallies.length === 0 ? (
              <Text style={tw`text-slate-400 text-xs`}>
                Sin datos de rallies
              </Text>
            ) : (
              set.rallies.map((rally, idx) => (
                <View
                  key={idx}
                  style={tw`bg-slate-50 p-3 rounded-lg mb-2 border border-slate-200`}
                >
                  <View style={tw`flex-row justify-between`}>
                    <Text style={tw`text-xs font-bold text-slate-600`}>
                      Rally {idx + 1}
                    </Text>
                    <Text
                      style={tw`text-xs font-bold ${rally.winner === "A" ? "text-blue-600" : "text-red-600"}`}
                    >
                      {rally.winner === "A" ? "Gana A" : "Gana B"}
                    </Text>
                  </View>
                  <Text style={tw`text-xs text-slate-500`}>
                    Marcador al inicio: {rally.scoreAtTheTime.A}-
                    {rally.scoreAtTheTime.B}
                  </Text>
                  {rally.actions.map((action, aIdx) => (
                    <Text key={aIdx} style={tw`text-xs ml-2 text-slate-700`}>
                      {action.playerId} → {action.category}/{action.subAction}{" "}
                      {action.value !== undefined ? `(${action.value})` : ""}{" "}
                      {action.origin &&
                        `desde ${action.origin} hacia ${action.destination}`}
                    </Text>
                  ))}
                </View>
              ))
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
