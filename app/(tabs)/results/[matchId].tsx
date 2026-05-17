import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import HeaderMenu from "../../../components/HeaderMenu";
import RadarChart from "../../../components/RadarChart";
import tw from "../../../lib/tailwind";
import {
    useMatchStore,
    type RallyAction,
} from "../../../src/store/useMatchStore";

// Mapa de valores máximos por sub‑acción (el mismo de la pantalla de juego)
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
  // Añade aquí cualquier otra sub‑acción que utilices
};

// Obtener el valor máximo de una sub‑acción
const getMaxValue = (subAction: string): number => {
  const allowed = actionAllowedValues[subAction];
  if (!allowed) return 4; // por defecto asume 4
  return Math.max(...allowed);
};

const categoryColors: Record<string, string> = {
  SERVICIO: "bg-blue-200 text-blue-900",
  RECEPCION: "bg-green-200 text-green-900",
  ACOMODADA: "bg-pink-200 text-pink-900",
  ATAQUE: "bg-yellow-200 text-yellow-900",
  BLOQUEO: "bg-purple-200 text-purple-900",
  DEFENSA: "bg-emerald-200 text-emerald-900",
  ERRORES_SERV: "bg-gray-300 text-gray-900",
  ERRORES_COM: "bg-gray-300 text-gray-900",
  ERRORES_POS: "bg-gray-300 text-gray-900",
  ERRORES_TEC: "bg-gray-300 text-gray-900",
};

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

  const allPlayers = [
    ...match.config.teamA.players.map((p) => ({ ...p, team: "A" })),
    ...match.config.teamB.players.map((p) => ({ ...p, team: "B" })),
  ];

  // ===== ESTADÍSTICAS CON EFECTIVIDAD NETA =====
  const playerStats = useMemo(() => {
    const statsMap: Record<
      string,
      {
        totalActions: number;
        errors: number;
        effectiveness: number; // efectividad global neta (%)
        categories: Record<
          string,
          {
            total: number;
            positive: number; // número de acciones con valor máximo
            negative: number; // número de acciones con valor 0
            effectiveness: number; // ((positive - negative) / total) * 100
            subs: Record<
              string,
              {
                total: number;
                positive: number;
                negative: number;
                effectiveness: number;
              }
            >;
          }
        >;
      }
    > = {};

    // Inicializar estructura para cada jugador
    allPlayers.forEach((p) => {
      const id = `${p.team}-${p.number}`;
      statsMap[id] = {
        totalActions: 0,
        errors: 0,
        effectiveness: 0,
        categories: {},
      };
    });

    // Recorrer todo el historial del partido
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

          // Inicializar categoría si no existe
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

          // Sub‑acción
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

    // Calcular efectividades netas
    Object.keys(statsMap).forEach((id) => {
      const player = statsMap[id];
      let totalPos = 0,
        totalNeg = 0;

      Object.values(player.categories).forEach((cat) => {
        cat.effectiveness =
          cat.total > 0 ? ((cat.positive - cat.negative) / cat.total) * 100 : 0;
        totalPos += cat.positive;
        totalNeg += cat.negative;

        Object.values(cat.subs).forEach((sub) => {
          sub.effectiveness =
            sub.total > 0
              ? ((sub.positive - sub.negative) / sub.total) * 100
              : 0;
        });
      });

      player.effectiveness =
        player.totalActions > 0
          ? ((totalPos - totalNeg) / player.totalActions) * 100
          : 0;
    });

    return statsMap;
  }, [match, allPlayers]);

  // ===== COMPONENTE DE TARJETA DE JUGADOR =====
  const PlayerCard = ({ player }: { player: (typeof allPlayers)[0] }) => {
    const pId = `${player.team}-${player.number}`;
    const stats = playerStats[pId];
    if (!stats) return null;
    const [expanded, setExpanded] = useState(false);

    // Datos para el radar: efectividad neta por categoría (puede ser negativo)
    const radarData = Object.entries(stats.categories).map(([cat, data]) => ({
      label: cat.replace("ERRORES_", "E.").substring(0, 4),
      value: Math.max(0, data.effectiveness), // el radar solo admite 0-100, trunca negativos a 0
    }));

    const color = player.team === "A" ? "#3b82f6" : "#ef4444";

    return (
      <View
        style={tw`bg-white border border-slate-200 rounded-xl mb-3 overflow-hidden`}
      >
        <TouchableOpacity
          onPress={() => setExpanded(!expanded)}
          style={tw`flex-row items-center justify-between p-4 bg-slate-50`}
        >
          <View style={tw`flex-1`}>
            <Text style={tw`font-bold text-[#003366]`}>
              #{player.number} {player.fullName}
            </Text>
            <Text style={tw`text-xs text-slate-500`}>
              {stats.totalActions} acciones · {stats.errors} errores · Efect.{" "}
              {stats.effectiveness.toFixed(0)}%
            </Text>
          </View>
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={20}
            color="#003366"
          />
        </TouchableOpacity>

        {expanded && (
          <View style={tw`px-4 pb-4 flex-row`}>
            {/* Radar a la izquierda */}
            <View style={tw`w-40 h-40 items-center justify-center`}>
              <RadarChart data={radarData} size={160} color={color} />
            </View>
            {/* Listado de sub‑acciones a la derecha */}
            <View style={tw`flex-1 ml-4`}>
              {Object.entries(stats.categories).map(([cat, data]) => (
                <View key={cat} style={tw`mb-2`}>
                  <Text
                    style={tw`text-xs font-bold ${categoryColors[cat] || "bg-gray-200 text-gray-800"} px-1 py-0.5 rounded`}
                  >
                    {cat} ({data.effectiveness.toFixed(0)}%)
                  </Text>
                  {Object.entries(data.subs).map(([sub, subData]) => (
                    <View
                      key={sub}
                      style={tw`flex-row justify-between ml-2 py-0.5`}
                    >
                      <Text style={tw`text-xs text-slate-600`}>{sub}</Text>
                      <Text style={tw`text-xs font-bold text-slate-700`}>
                        {subData.total} ({subData.effectiveness.toFixed(0)}%)
                      </Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    );
  };

  // ===== RENDERIZADO PRINCIPAL =====
  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      <HeaderMenu
        title="Detalle del Partido"
        dark={false}
        showQuickNav={true}
        onBack={() => router.back()}
      />
      <ScrollView contentContainerStyle={tw`p-5 pb-20`}>
        {/* ---------- DATOS DE REGISTRO ---------- */}
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
          </View>

          {/* Marcador final */}
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

          {/* Lista completa de jugadores */}
          <View style={tw`mt-4 flex-row gap-4`}>
            <View style={tw`flex-1`}>
              <Text style={tw`font-bold text-[#003366] text-sm mb-1`}>
                {match.config.teamA.name}
              </Text>
              {match.config.teamA.players.map((p, i) => (
                <Text key={i} style={tw`text-xs text-slate-600`}>
                  #{p.number} {p.fullName}
                </Text>
              ))}
            </View>
            <View style={tw`flex-1`}>
              <Text style={tw`font-bold text-[#003366] text-sm mb-1`}>
                {match.config.teamB.name}
              </Text>
              {match.config.teamB.players.map((p, i) => (
                <Text key={i} style={tw`text-xs text-slate-600`}>
                  #{p.number} {p.fullName}
                </Text>
              ))}
            </View>
          </View>
        </View>

        {/* ---------- ESTADÍSTICAS DETALLADAS ---------- */}
        <Text style={tw`text-xl font-black text-slate-400 uppercase mb-4`}>
          Rendimiento Individual Detallado
        </Text>
        {allPlayers.map((player, idx) => (
          <PlayerCard key={idx} player={player} />
        ))}

        {/* ---------- DESARROLLO RALLY POR RALLY ---------- */}
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
