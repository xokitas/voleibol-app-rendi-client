// app/(tabs)/results/aggregated.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import StatsPanel, {
    CategoryStats,
} from "../../../components/results/StatsPanel";
import { useAggregatedStats } from "../../../hooks/useAggregatedStats";
import { useStats } from "../../../hooks/useStats";
import tw from "../../../lib/tailwind";
import {
    useMatchStore,
    type RallyAction,
} from "../../../src/store/useMatchStore";

// ----------------------------------------------------------------
// Constantes (sin cambios)
// ----------------------------------------------------------------
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

export default function AggregatedStatsScreen() {
  const router = useRouter();
  const savedMatches = useMatchStore((s) => s.savedMatches);

  // Estados para los filtros
  const [playerName, setPlayerName] = useState<string>("");
  const [tournament, setTournament] = useState<string>("");
  const [teamName, setTeamName] = useState<string>(""); // NUEVO

  // Estados para modales de selección
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);
  const [isTournamentModalOpen, setIsTournamentModalOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false); // NUEVO

  // 1. Obtener listas únicas para los selectores
  const uniquePlayers = useMemo(() => {
    const players = new Set<string>();
    savedMatches.forEach((m) => {
      m.config.teamA.players.forEach((p) => players.add(p.fullName));
      m.config.teamB.players.forEach((p) => players.add(p.fullName));
    });
    return Array.from(players).sort();
  }, [savedMatches]);

  const uniqueTournaments = useMemo(() => {
    const tours = new Set<string>();
    savedMatches.forEach((m) => {
      if (m.config.tournament) tours.add(m.config.tournament);
    });
    return Array.from(tours).sort();
  }, [savedMatches]);

  const uniqueTeams = useMemo(() => {
    // NUEVO
    const teams = new Set<string>();
    savedMatches.forEach((m) => {
      if (m.config.teamA.name) teams.add(m.config.teamA.name);
      if (m.config.teamB.name) teams.add(m.config.teamB.name);
    });
    return Array.from(teams).sort();
  }, [savedMatches]);

  // Número de partidos analizados según el filtro activo (jugador o equipo)
  const matchesPlayed = useMemo(() => {
    if (teamName) {
      return savedMatches.filter((m) => {
        if (tournament && m.config.tournament !== tournament) return false;
        return (
          m.config.teamA.name === teamName || m.config.teamB.name === teamName
        );
      }).length;
    }
    if (!playerName) return 0;
    return savedMatches.filter((m) => {
      if (tournament && m.config.tournament !== tournament) return false;
      const inA = m.config.teamA.players.some((p) => p.fullName === playerName);
      const inB = m.config.teamB.players.some((p) => p.fullName === playerName);
      return inA || inB;
    }).length;
  }, [savedMatches, playerName, tournament, teamName]);

  // 2. Extraer acciones agregadas
  // Si hay equipo, usamos una extracción manual; si no, usamos el hook existente para jugador
  const { aggregatedActions } = useAggregatedStats(savedMatches, {
    playerName: teamName ? "" : playerName, // si hay equipo, no buscamos jugador
    tournament,
  });

  // Acciones específicas del equipo (sobrescribe si teamName está presente)
  const finalAggregatedActions = useMemo(() => {
    if (!teamName) return aggregatedActions;
    let actions: RallyAction[] = [];
    const filteredMatches = savedMatches.filter((m) => {
      if (tournament && m.config.tournament !== tournament) return false;
      return (
        m.config.teamA.name === teamName || m.config.teamB.name === teamName
      );
    });
    filteredMatches.forEach((match) => {
      // Determinar si el equipo fue A o B en este partido
      const isTeamA = match.config.teamA.name === teamName;
      const prefix = isTeamA ? "A" : "B";
      match.history.forEach((set) => {
        set.rallies.forEach((rally) => {
          // Filtrar acciones de jugadores cuyo ID empiece con el prefijo del equipo
          const teamActions = rally.actions.filter((a) =>
            a.playerId.startsWith(prefix),
          );
          actions.push(...teamActions);
        });
      });
    });
    return actions;
  }, [savedMatches, teamName, tournament, aggregatedActions]);

  // 3. Obtener totales generales usando useStats (simulando un único partido)
  const actionsMappedForStats = finalAggregatedActions.map((a) => ({
    ...a,
    playerId: "any",
  }));
  const { getPlayerStats: getGlobalStats } = useStats(
    [{ actions: actionsMappedForStats }],
    actionAllowedValues,
  );
  const generalStats = getGlobalStats("any");

  // 4. Transformar los datos al formato CategoryStats que requiere StatsPanel
  const { categoriesMap, radarData } = useMemo(() => {
    const categories: Record<string, CategoryStats> = {};

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

    let errorPos = 0,
      errorNeg = 0,
      errorTotal = 0;

    finalAggregatedActions.forEach((action) => {
      const cat = action.category;
      const sub = action.subAction;
      const allowed = actionAllowedValues[sub];
      const maxVal = allowed ? Math.max(...allowed) : 4;

      const isPositive = action.value === maxVal;
      const isNegative = action.value === 0;

      if (!categories[cat])
        categories[cat] = {
          total: 0,
          positive: 0,
          negative: 0,
          effectiveness: 0,
          subs: {},
        };
      categories[cat].total++;
      if (isPositive) categories[cat].positive++;
      if (isNegative) categories[cat].negative++;

      if (!categories[cat].subs[sub])
        categories[cat].subs[sub] = {
          total: 0,
          positive: 0,
          negative: 0,
          effectiveness: 0,
        };
      categories[cat].subs[sub].total++;
      if (isPositive) categories[cat].subs[sub].positive++;
      if (isNegative) categories[cat].subs[sub].negative++;

      if (cat.startsWith("ERRORES")) {
        errorTotal++;
        if (isPositive) errorPos++;
        if (isNegative) errorNeg++;
      }
    });

    Object.values(categories).forEach((catData) => {
      catData.effectiveness =
        catData.total > 0
          ? ((catData.positive - catData.negative) / catData.total) * 100
          : 0;
      Object.values(catData.subs).forEach((subData) => {
        subData.effectiveness =
          subData.total > 0
            ? ((subData.positive - subData.negative) / subData.total) * 100
            : 0;
      });
    });

    const errorEff =
      errorTotal > 0 ? ((errorPos - errorNeg) / errorTotal) * 100 : 0;

    const radar = [
      ...Object.entries(categories)
        .filter(([cat]) => !cat.startsWith("ERRORES"))
        .map(([cat, data]) => ({
          label: cat.substring(0, 4),
          value: Math.max(0, data.effectiveness),
        })),
      { label: "Errores", value: Math.max(0, errorEff) },
    ];

    return { categoriesMap: categories, radarData: radar };
  }, [finalAggregatedActions]);

  // Componente interno para Modales de Selección
  const SelectionModal = ({
    visible,
    title,
    options,
    onSelect,
    onClose,
  }: any) => (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={tw`flex-1 justify-end bg-black/60`}>
        <View style={tw`bg-white rounded-t-3xl h-2/3 p-5`}>
          <View
            style={tw`flex-row justify-between items-center mb-4 border-b border-slate-200 pb-3`}
          >
            <Text style={tw`text-lg font-black text-[#003366]`}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={28} color="#94a3b8" />
            </TouchableOpacity>
          </View>
          <ScrollView>
            <TouchableOpacity
              onPress={() => onSelect("")}
              style={tw`py-3 border-b border-slate-100`}
            >
              <Text style={tw`text-slate-500 font-bold`}>
                Cualquiera (Limpiar filtro)
              </Text>
            </TouchableOpacity>
            {options.map((opt: string) => (
              <TouchableOpacity
                key={opt}
                onPress={() => onSelect(opt)}
                style={tw`py-3 border-b border-slate-100`}
              >
                <Text style={tw`text-[#003366] font-semibold`}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  // Determinar si hay filtro activo (jugador o equipo)
  const hasActiveFilter = playerName !== "" || teamName !== "";

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      {/* Header Fijo */}
      <View
        style={tw`flex-row items-center justify-between px-5 py-3 border-b border-slate-200 bg-slate-50`}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={tw`bg-white p-2 rounded-lg shadow-sm`}
        >
          <Ionicons name="arrow-back" size={20} color="#003366" />
        </TouchableOpacity>
        <Text
          style={tw`text-lg font-black text-[#003366] uppercase tracking-wide`}
        >
          Estadísticas Agregadas
        </Text>
        <View style={tw`w-10`} />
      </View>

      <ScrollView contentContainerStyle={tw`p-5 pb-20`}>
        {/* Sección de Filtros */}
        <View
          style={tw`mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-200`}
        >
          <Text style={tw`text-xs font-black text-slate-400 uppercase mb-3`}>
            Filtros de Análisis
          </Text>

          <View style={tw`gap-3`}>
            {/* Selector de Jugador */}
            <TouchableOpacity
              onPress={() => {
                if (teamName) setTeamName(""); // limpiar equipo si se elige jugador
                setIsPlayerModalOpen(true);
              }}
              style={tw`flex-row justify-between items-center bg-white border border-slate-200 p-3 rounded-xl`}
            >
              <View>
                <Text
                  style={tw`text-[10px] font-bold text-slate-400 uppercase`}
                >
                  Jugador
                </Text>
                <Text
                  style={tw`font-bold text-[#003366] ${!playerName ? "text-slate-400" : ""}`}
                >
                  {playerName || "Seleccionar Jugador..."}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={16} color="#94a3b8" />
            </TouchableOpacity>

            {/* Selector de Equipo (NUEVO) */}
            <TouchableOpacity
              onPress={() => {
                if (playerName) setPlayerName(""); // limpiar jugador si se elige equipo
                setIsTeamModalOpen(true);
              }}
              style={tw`flex-row justify-between items-center bg-white border border-slate-200 p-3 rounded-xl`}
            >
              <View>
                <Text
                  style={tw`text-[10px] font-bold text-slate-400 uppercase`}
                >
                  Equipo
                </Text>
                <Text
                  style={tw`font-bold text-[#003366] ${!teamName ? "text-slate-400" : ""}`}
                >
                  {teamName || "Seleccionar Equipo..."}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={16} color="#94a3b8" />
            </TouchableOpacity>

            {/* Selector de Torneo */}
            <TouchableOpacity
              onPress={() => setIsTournamentModalOpen(true)}
              style={tw`flex-row justify-between items-center bg-white border border-slate-200 p-3 rounded-xl`}
            >
              <View>
                <Text
                  style={tw`text-[10px] font-bold text-slate-400 uppercase`}
                >
                  Torneo / Evento
                </Text>
                <Text
                  style={tw`font-bold text-[#003366] ${!tournament ? "text-slate-400" : ""}`}
                >
                  {tournament || "Todos los torneos"}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={16} color="#94a3b8" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Zona de Resultados */}
        {!hasActiveFilter ? (
          <View style={tw`items-center justify-center py-20`}>
            <Ionicons name="analytics" size={64} color="#e2e8f0" />
            <Text style={tw`text-slate-400 font-bold mt-4 text-center px-10`}>
              Selecciona un jugador o un equipo para generar el reporte de
              rendimiento histórico.
            </Text>
          </View>
        ) : (
          <View>
            {/* Tarjeta de Resumen */}
            <View style={tw`bg-[#003366] p-5 rounded-2xl shadow-lg mb-6`}>
              <Text style={tw`text-blue-200 font-bold text-xs uppercase mb-1`}>
                Reporte Generado
              </Text>
              <Text style={tw`text-white font-black text-2xl mb-1`}>
                {teamName || playerName}
              </Text>
              <Text style={tw`text-blue-300 text-xs mb-4`}>
                Basado en {matchesPlayed} partido(s) analizado(s)
              </Text>

              <View
                style={tw`flex-row justify-between border-t border-blue-800/50 pt-4`}
              >
                <View style={tw`items-center`}>
                  <Text style={tw`text-white font-black text-xl`}>
                    {generalStats.general.totalActions}
                  </Text>
                  <Text
                    style={tw`text-blue-300 text-[10px] uppercase font-bold`}
                  >
                    Acciones
                  </Text>
                </View>
                <View style={tw`items-center`}>
                  <Text style={tw`text-red-400 font-black text-xl`}>
                    {generalStats.general.errors}
                  </Text>
                  <Text
                    style={tw`text-blue-300 text-[10px] uppercase font-bold`}
                  >
                    Errores
                  </Text>
                </View>
                <View style={tw`items-center`}>
                  <Text style={tw`text-green-400 font-black text-xl`}>
                    {generalStats.general.efficiency}%
                  </Text>
                  <Text
                    style={tw`text-blue-300 text-[10px] uppercase font-bold`}
                  >
                    Efectividad
                  </Text>
                </View>
              </View>
            </View>

            {/* Componente Extraído: Radar y Panel de Categorías */}
            {finalAggregatedActions.length > 0 ? (
              <View
                style={tw`bg-white border border-slate-100 rounded-2xl p-2 shadow-sm`}
              >
                <StatsPanel
                  radarData={radarData}
                  categories={categoriesMap}
                  color="#3b82f6"
                  radarSize={220}
                />
              </View>
            ) : (
              <Text style={tw`text-center text-slate-400 py-10`}>
                No se registraron acciones para este filtro.
              </Text>
            )}
          </View>
        )}
      </ScrollView>

      {/* Modales */}
      <SelectionModal
        visible={isPlayerModalOpen}
        title="Seleccionar Jugador"
        options={uniquePlayers}
        onSelect={(val: string) => {
          setPlayerName(val);
          setIsPlayerModalOpen(false);
        }}
        onClose={() => setIsPlayerModalOpen(false)}
      />
      <SelectionModal
        visible={isTeamModalOpen}
        title="Seleccionar Equipo"
        options={uniqueTeams}
        onSelect={(val: string) => {
          setTeamName(val);
          setIsTeamModalOpen(false);
        }}
        onClose={() => setIsTeamModalOpen(false)}
      />
      <SelectionModal
        visible={isTournamentModalOpen}
        title="Filtrar por Torneo"
        options={uniqueTournaments}
        onSelect={(val: string) => {
          setTournament(val);
          setIsTournamentModalOpen(false);
        }}
        onClose={() => setIsTournamentModalOpen(false)}
      />
    </SafeAreaView>
  );
}
