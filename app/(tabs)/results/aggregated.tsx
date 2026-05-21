// app/(tabs)/results/aggregated.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
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
  const { width } = useWindowDimensions();
  const isMobile = width < 1024;
  const savedMatches = useMatchStore((s) => s.savedMatches);

  // Estados para los filtros
  const [playerName, setPlayerName] = useState<string>("");
  const [tournament, setTournament] = useState<string>("");
  const [teamName, setTeamName] = useState<string>("");

  // Estados para modales de selección
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);
  const [isTournamentModalOpen, setIsTournamentModalOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);

  // 1. Listas únicas para selectores
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
    const teams = new Set<string>();
    savedMatches.forEach((m) => {
      if (m.config.teamA.name) teams.add(m.config.teamA.name);
      if (m.config.teamB.name) teams.add(m.config.teamB.name);
    });
    return Array.from(teams).sort();
  }, [savedMatches]);

  // Partidos analizados
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

  // 2. Acciones agregadas
  const { aggregatedActions } = useAggregatedStats(savedMatches, {
    playerName: teamName ? "" : playerName,
    tournament,
  });

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
      const isTeamA = match.config.teamA.name === teamName;
      const prefix = isTeamA ? "A" : "B";
      match.history.forEach((set) => {
        set.rallies.forEach((rally) => {
          const teamActions = rally.actions.filter((a) =>
            a.playerId.startsWith(prefix),
          );
          actions.push(...teamActions);
        });
      });
    });
    return actions;
  }, [savedMatches, teamName, tournament, aggregatedActions]);

  // 3. Estadísticas generales
  const actionsMappedForStats = finalAggregatedActions.map((a) => ({
    ...a,
    playerId: "any",
  }));
  const { getPlayerStats: getGlobalStats } = useStats(
    [{ actions: actionsMappedForStats }],
    actionAllowedValues,
  );
  const generalStats = getGlobalStats("any");

  // 4. Categorías y radar
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

  // Componente Modal de selección (más compacto en móvil)
  const SelectionModal = ({
    visible,
    title,
    options,
    onSelect,
    onClose,
  }: any) => (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={tw`flex-1 justify-end bg-black/60`}>
        <View
          style={tw`bg-white rounded-t-3xl ${isMobile ? "h-3/4" : "h-2/3"} p-4`}
        >
          <View
            style={tw`flex-row justify-between items-center mb-3 border-b border-slate-200 pb-2`}
          >
            <Text
              style={tw`${isMobile ? "text-sm" : "text-lg"} font-black text-[#003366]`}
            >
              {title}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons
                name="close-circle"
                size={isMobile ? 22 : 28}
                color="#94a3b8"
              />
            </TouchableOpacity>
          </View>
          <ScrollView>
            <TouchableOpacity
              onPress={() => onSelect("")}
              style={tw`py-2 border-b border-slate-100`}
            >
              <Text
                style={tw`text-slate-500 font-bold ${isMobile ? "text-xs" : "text-base"}`}
              >
                Cualquiera (Limpiar filtro)
              </Text>
            </TouchableOpacity>
            {options.map((opt: string) => (
              <TouchableOpacity
                key={opt}
                onPress={() => onSelect(opt)}
                style={tw`py-2 border-b border-slate-100`}
              >
                <Text
                  style={tw`text-[#003366] font-semibold ${isMobile ? "text-xs" : "text-base"}`}
                >
                  {opt}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const hasActiveFilter = playerName !== "" || teamName !== "";

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      <HeaderMenu
        title="Estadísticas Agregadas"
        dark={false}
        showQuickNav={false}
        onBack={() => router.replace("/(tabs)/menu")}
        compact={isMobile}
      />

      <ScrollView
        contentContainerStyle={tw`${isMobile ? "px-2 py-1" : "p-5 pb-20"}`}
      >
        {/* Filtros */}
        <View
          style={tw`mb-4 bg-slate-50 ${isMobile ? "p-2" : "p-4"} rounded-2xl border border-slate-200`}
        >
          <Text
            style={tw`${isMobile ? "text-[9px]" : "text-xs"} font-black text-slate-400 uppercase mb-2`}
          >
            Filtros de Análisis
          </Text>

          <View style={tw`gap-2`}>
            {/* Jugador */}
            <TouchableOpacity
              onPress={() => {
                if (teamName) setTeamName("");
                setIsPlayerModalOpen(true);
              }}
              style={tw`flex-row justify-between items-center bg-white border border-slate-200 ${isMobile ? "p-1.5" : "p-3"} rounded-xl`}
            >
              <View>
                <Text
                  style={tw`${isMobile ? "text-[7px]" : "text-[10px]"} font-bold text-slate-400 uppercase`}
                >
                  Jugador
                </Text>
                <Text
                  style={tw`font-bold text-[#003366] ${!playerName ? "text-slate-400" : ""} ${isMobile ? "text-xs" : "text-base"}`}
                >
                  {playerName || "Seleccionar Jugador..."}
                </Text>
              </View>
              <Ionicons
                name="chevron-down"
                size={isMobile ? 12 : 16}
                color="#94a3b8"
              />
            </TouchableOpacity>

            {/* Equipo */}
            <TouchableOpacity
              onPress={() => {
                if (playerName) setPlayerName("");
                setIsTeamModalOpen(true);
              }}
              style={tw`flex-row justify-between items-center bg-white border border-slate-200 ${isMobile ? "p-1.5" : "p-3"} rounded-xl`}
            >
              <View>
                <Text
                  style={tw`${isMobile ? "text-[7px]" : "text-[10px]"} font-bold text-slate-400 uppercase`}
                >
                  Equipo
                </Text>
                <Text
                  style={tw`font-bold text-[#003366] ${!teamName ? "text-slate-400" : ""} ${isMobile ? "text-xs" : "text-base"}`}
                >
                  {teamName || "Seleccionar Equipo..."}
                </Text>
              </View>
              <Ionicons
                name="chevron-down"
                size={isMobile ? 12 : 16}
                color="#94a3b8"
              />
            </TouchableOpacity>

            {/* Torneo */}
            <TouchableOpacity
              onPress={() => setIsTournamentModalOpen(true)}
              style={tw`flex-row justify-between items-center bg-white border border-slate-200 ${isMobile ? "p-1.5" : "p-3"} rounded-xl`}
            >
              <View>
                <Text
                  style={tw`${isMobile ? "text-[7px]" : "text-[10px]"} font-bold text-slate-400 uppercase`}
                >
                  Torneo / Evento
                </Text>
                <Text
                  style={tw`font-bold text-[#003366] ${!tournament ? "text-slate-400" : ""} ${isMobile ? "text-xs" : "text-base"}`}
                >
                  {tournament || "Todos los torneos"}
                </Text>
              </View>
              <Ionicons
                name="chevron-down"
                size={isMobile ? 12 : 16}
                color="#94a3b8"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Resultados */}
        {!hasActiveFilter ? (
          <View style={tw`items-center justify-center py-16`}>
            <Ionicons
              name="analytics"
              size={isMobile ? 40 : 64}
              color="#e2e8f0"
            />
            <Text
              style={tw`text-slate-400 font-bold mt-4 text-center ${isMobile ? "text-xs" : "text-base"} px-8`}
            >
              Selecciona un jugador o un equipo para generar el reporte de
              rendimiento histórico.
            </Text>
          </View>
        ) : (
          <View>
            {/* Tarjeta resumen */}
            <View
              style={tw`bg-[#003366] ${isMobile ? "p-3" : "p-5"} rounded-2xl shadow-lg mb-4`}
            >
              <Text
                style={tw`text-blue-200 font-bold ${isMobile ? "text-[8px]" : "text-xs"} uppercase mb-1`}
              >
                Reporte Generado
              </Text>
              <Text
                style={tw`text-white font-black ${isMobile ? "text-lg" : "text-2xl"} mb-1`}
              >
                {teamName || playerName}
              </Text>
              <Text
                style={tw`text-blue-300 ${isMobile ? "text-[8px]" : "text-xs"} mb-3`}
              >
                Basado en {matchesPlayed} partido(s)
              </Text>

              <View
                style={tw`flex-row justify-between border-t border-blue-800/50 pt-3`}
              >
                <View style={tw`items-center`}>
                  <Text
                    style={tw`text-white font-black ${isMobile ? "text-base" : "text-xl"}`}
                  >
                    {generalStats.general.totalActions}
                  </Text>
                  <Text
                    style={tw`text-blue-300 ${isMobile ? "text-[7px]" : "text-[10px]"} uppercase font-bold`}
                  >
                    Acciones
                  </Text>
                </View>
                <View style={tw`items-center`}>
                  <Text
                    style={tw`text-red-400 font-black ${isMobile ? "text-base" : "text-xl"}`}
                  >
                    {generalStats.general.errors}
                  </Text>
                  <Text
                    style={tw`text-blue-300 ${isMobile ? "text-[7px]" : "text-[10px]"} uppercase font-bold`}
                  >
                    Errores
                  </Text>
                </View>
                <View style={tw`items-center`}>
                  <Text
                    style={tw`text-green-400 font-black ${isMobile ? "text-base" : "text-xl"}`}
                  >
                    {generalStats.general.efficiency}%
                  </Text>
                  <Text
                    style={tw`text-blue-300 ${isMobile ? "text-[7px]" : "text-[10px]"} uppercase font-bold`}
                  >
                    Efectividad
                  </Text>
                </View>
              </View>
            </View>

            {/* Radar + Categorías */}
            {finalAggregatedActions.length > 0 ? (
              <View
                style={tw`bg-white border border-slate-100 rounded-2xl p-2 shadow-sm`}
              >
                <StatsPanel
                  radarData={radarData}
                  categories={categoriesMap}
                  color="#3b82f6"
                  radarSize={isMobile ? 160 : 220}
                />
              </View>
            ) : (
              <Text
                style={tw`text-center text-slate-400 py-10 ${isMobile ? "text-xs" : "text-base"}`}
              >
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
