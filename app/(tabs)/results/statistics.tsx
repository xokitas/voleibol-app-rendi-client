// app/(tabs)/results/statistics.tsx
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
import { useExportStatsPDF } from "../../../hooks/PDF/useExportStatsPDF";
import { useAggregatedStats } from "../../../hooks/useAggregatedStats";
import { useStats } from "../../../hooks/useStats";
import tw from "../../../lib/tailwind";
import { useMatchStore, type Match } from "../../../src/store/useMatchStore";

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

export default function StatisticsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 1024;
  const savedMatches = useMatchStore((s) => s.savedMatches);

  // Estados para los filtros
  const [playerName, setPlayerName] = useState<string>("");
  const [teamName, setTeamName] = useState<string>("");
  const [denomination, setDenomination] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [eventType, setEventType] = useState<string>("");
  const [place, setPlace] = useState<string>("");
  const [meso, setMeso] = useState<string>("");
  const [micro, setMicro] = useState<string>("");
  const [gender, setGender] = useState<string>("");

  const [modalVisible, setModalVisible] = useState<string | null>(null);
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

  const activeFilters = {
    playerName,
    teamName,
    denomination,
    category,
    eventType,
    place,
    meso,
    micro,
    gender,
  };

  // Función auxiliar para obtener el ID de un jugador en un partido específico
  const getPlayerIdInMatch = (match: Match, name: string): string | null => {
    const playerA = match.config.teamA.players.find((p) => p.fullName === name);
    if (playerA) return `A-${playerA.number}`;
    const playerB = match.config.teamB.players.find((p) => p.fullName === name);
    if (playerB) return `B-${playerB.number}`;
    return null;
  };

  // 1. Listas base
  const allUniqueValues = useMemo(() => {
    const players = new Set<string>();
    const teams = new Set<string>();
    const denominations = new Set<string>();
    const categories = new Set<string>();
    const eventTypes = new Set<string>();
    const places = new Set<string>();
    const mesos = new Set<string>();
    const micros = new Set<string>();
    const genders = new Set<string>();

    savedMatches.forEach((m) => {
      m.config.teamA.players.forEach((p) => players.add(p.fullName));
      m.config.teamB.players.forEach((p) => players.add(p.fullName));
      if (m.config.teamA.name) teams.add(m.config.teamA.name);
      if (m.config.teamB.name) teams.add(m.config.teamB.name);
      if (m.config.denomination?.trim())
        denominations.add(m.config.denomination.trim());
      if (m.config.category) categories.add(m.config.category);
      if (m.config.eventType) eventTypes.add(m.config.eventType);
      if (m.config.place) places.add(m.config.place);
      if (m.config.meso) mesos.add(m.config.meso);
      if (m.config.micro) micros.add(m.config.micro);
      if (m.config.gender) genders.add(m.config.gender);
    });

    return {
      players: Array.from(players).sort(),
      teams: Array.from(teams).sort(),
      denominations: Array.from(denominations).sort(),
      categories: Array.from(categories).sort(),
      eventTypes: Array.from(eventTypes).sort(),
      places: Array.from(places).sort(),
      mesos: Array.from(mesos).sort(),
      micros: Array.from(micros).sort(),
      genders: Array.from(genders).sort(),
    };
  }, [savedMatches]);

  // 2. Listas encadenadas
  const filteredLists = useMemo(() => {
    const matchesFor = (exceptKey: string) =>
      savedMatches.filter((m) => {
        if (
          exceptKey !== "denomination" &&
          denomination &&
          m.config.denomination !== denomination
        )
          return false;
        if (
          exceptKey !== "category" &&
          category &&
          m.config.category !== category
        )
          return false;
        if (
          exceptKey !== "eventType" &&
          eventType &&
          m.config.eventType !== eventType
        )
          return false;
        if (exceptKey !== "place" && place && m.config.place !== place)
          return false;
        if (exceptKey !== "meso" && meso && m.config.meso !== meso)
          return false;
        if (exceptKey !== "micro" && micro && m.config.micro !== micro)
          return false;
        if (exceptKey !== "gender" && gender && m.config.gender !== gender)
          return false;
        if (exceptKey !== "teamName" && teamName) {
          if (
            m.config.teamA.name !== teamName &&
            m.config.teamB.name !== teamName
          )
            return false;
        }
        if (exceptKey !== "playerName" && playerName) {
          const inA = m.config.teamA.players.some(
            (p) => p.fullName === playerName,
          );
          const inB = m.config.teamB.players.some(
            (p) => p.fullName === playerName,
          );
          if (!inA && !inB) return false;
        }
        return true;
      });

    const extract = (
      fn: (m: (typeof savedMatches)[0]) => (string | undefined)[],
    ) => {
      const set = new Set<string>();
      matchesFor("").forEach((m) => {
        fn(m).forEach((v) => {
          if (typeof v === "string" && v.length > 0) set.add(v);
        });
      });
      return Array.from(set).sort();
    };

    return {
      players: extract((m) => [
        ...m.config.teamA.players.map((p) => p.fullName),
        ...m.config.teamB.players.map((p) => p.fullName),
      ]),
      teams: extract((m) =>
        [m.config.teamA.name, m.config.teamB.name].filter(Boolean),
      ),
      denominations: extract((m) => [m.config.denomination].filter(Boolean)),
      categories: extract((m) => [m.config.category].filter(Boolean)),
      eventTypes: extract((m) => [m.config.eventType].filter(Boolean)),
      places: extract((m) => [m.config.place].filter(Boolean)),
      mesos: extract((m) => [m.config.meso].filter(Boolean)),
      micros: extract((m) => [m.config.micro].filter(Boolean)),
      genders: extract((m) => [m.config.gender].filter(Boolean)),
    };
  }, [
    savedMatches,
    playerName,
    teamName,
    denomination,
    category,
    eventType,
    place,
    meso,
    micro,
    gender,
  ]);

  // 3. Acciones agregadas
  const { aggregatedActions } = useAggregatedStats(savedMatches, activeFilters);

  // 4. Estadísticas generales
  const actionsMappedForStats = aggregatedActions.map((a) => ({
    ...a,
    playerId: "any",
  }));
  const { getPlayerStats: getGlobalStats } = useStats(
    [{ actions: actionsMappedForStats }],
    actionAllowedValues,
  );
  const generalStats = getGlobalStats("any");

  // 5. Categorías y radar
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

    aggregatedActions.forEach((action) => {
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
  }, [aggregatedActions]);

  // Partidos que cumplen los filtros (array completo + conteo)
  const filteredMatches = useMemo(() => {
    return savedMatches.filter((m) => {
      if (denomination && m.config.denomination !== denomination) return false;
      if (category && m.config.category !== category) return false;
      if (eventType && m.config.eventType !== eventType) return false;
      if (place && m.config.place !== place) return false;
      if (meso && m.config.meso !== meso) return false;
      if (micro && m.config.micro !== micro) return false;
      if (gender && m.config.gender !== gender) return false;
      if (
        teamName &&
        m.config.teamA.name !== teamName &&
        m.config.teamB.name !== teamName
      )
        return false;
      if (playerName) {
        const inA = m.config.teamA.players.some(
          (p) => p.fullName === playerName,
        );
        const inB = m.config.teamB.players.some(
          (p) => p.fullName === playerName,
        );
        if (!inA && !inB) return false;
        if (teamName) {
          const isTeamA = m.config.teamA.name === teamName;
          const playerInTeam = isTeamA
            ? m.config.teamA.players.some((p) => p.fullName === playerName)
            : m.config.teamB.players.some((p) => p.fullName === playerName);
          if (!playerInTeam) return false;
        }
      }
      return true;
    });
  }, [savedMatches, activeFilters]);

  const matchesPlayed = filteredMatches.length;

  // Hook de exportación a PDF
  const { handleExportPDF } = useExportStatsPDF({
    playerName,
    teamName,
    matchesPlayed,
    generalStats,
    categoriesMap,
  });

  // Modal de selección
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

  const FilterSelector = ({
    label,
    value,
    options,
    onPress,
  }: {
    label: string;
    value: string;
    options: string[];
    onPress: () => void;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      style={tw`flex-row justify-between items-center bg-white border border-slate-200 ${isMobile ? "p-1.5" : "p-3"} rounded-xl`}
    >
      <View>
        <Text
          style={tw`${isMobile ? "text-[7px]" : "text-[10px]"} font-bold text-slate-400 uppercase`}
        >
          {label}
        </Text>
        <Text
          style={tw`font-bold text-[#003366] ${!value ? "text-slate-400" : ""} ${isMobile ? "text-xs" : "text-base"}`}
        >
          {value || `Seleccionar ${label}...`}
        </Text>
      </View>
      <Ionicons name="chevron-down" size={isMobile ? 12 : 16} color="#94a3b8" />
    </TouchableOpacity>
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
            <FilterSelector
              label="Jugador"
              value={playerName}
              options={filteredLists.players}
              onPress={() => setModalVisible("player")}
            />
            <FilterSelector
              label="Equipo"
              value={teamName}
              options={filteredLists.teams}
              onPress={() => setModalVisible("team")}
            />
            <FilterSelector
              label="Denominación"
              value={denomination}
              options={filteredLists.denominations}
              onPress={() => setModalVisible("denomination")}
            />
            <FilterSelector
              label="Categoría"
              value={category}
              options={filteredLists.categories}
              onPress={() => setModalVisible("category")}
            />
            <FilterSelector
              label="Tipo de Evento"
              value={eventType}
              options={filteredLists.eventTypes}
              onPress={() => setModalVisible("eventType")}
            />
            <FilterSelector
              label="Lugar"
              value={place}
              options={filteredLists.places}
              onPress={() => setModalVisible("place")}
            />
            <FilterSelector
              label="Mesociclo"
              value={meso}
              options={filteredLists.mesos}
              onPress={() => setModalVisible("meso")}
            />
            <FilterSelector
              label="Microciclo"
              value={micro}
              options={filteredLists.micros}
              onPress={() => setModalVisible("micro")}
            />
            <FilterSelector
              label="Género"
              value={gender}
              options={filteredLists.genders}
              onPress={() => setModalVisible("gender")}
            />
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
                {playerName || teamName}
                {playerName && teamName ? ` (en ${teamName})` : ""}
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

            {aggregatedActions.length > 0 ? (
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

            {/* Lista de partidos relevantes */}
            {filteredMatches.length > 0 && (
              <View style={tw`mt-6`}>
                <Text
                  style={tw`text-lg font-black text-slate-400 uppercase mb-3`}
                >
                  Partidos ({filteredMatches.length})
                </Text>
                {filteredMatches.map((match) => {
                  const isExpanded = expandedMatchId === match.id;
                  const matchPlayerId = playerName
                    ? getPlayerIdInMatch(match, playerName)
                    : null;
                  let teamPrefix: string | null = null;
                  if (teamName && match.config.teamA.name === teamName)
                    teamPrefix = "A";
                  else if (teamName && match.config.teamB.name === teamName)
                    teamPrefix = "B";

                  // Determinar ganador de cada set basado en el último rally
                  const setWinners: Record<number, string> = {};
                  match.history.forEach((set) => {
                    const lastRally = set.rallies[set.rallies.length - 1];
                    if (lastRally?.winner) {
                      setWinners[set.set] = lastRally.winner;
                    }
                  });

                  return (
                    <View key={match.id} style={tw`mb-2`}>
                      <TouchableOpacity
                        onPress={() =>
                          setExpandedMatchId(isExpanded ? null : match.id)
                        }
                        style={tw`flex-row justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200`}
                      >
                        <View style={tw`flex-1`}>
                          <Text style={tw`font-bold text-[#003366] text-sm`}>
                            {match.config.tournament ||
                              match.config.denomination ||
                              "Partido"}
                          </Text>
                          <Text style={tw`text-xs text-slate-500`}>
                            {match.config.teamA.name} vs{" "}
                            {match.config.teamB.name} · Set{" "}
                            {match.score.currentSet}
                          </Text>
                        </View>
                        <Ionicons
                          name={isExpanded ? "chevron-up" : "chevron-down"}
                          size={18}
                          color="#003366"
                        />
                      </TouchableOpacity>
                      {isExpanded && (
                        <View
                          style={tw`bg-white p-3 rounded-xl border border-slate-200 mt-1`}
                        >
                          {match.history.map((set) => {
                            const setKey = `${match.id}-set-${set.set}`;
                            const isSetExpanded = expandedSets[setKey];
                            const winner = setWinners[set.set];

                            return (
                              <View key={set.set} style={tw`mb-3`}>
                                <TouchableOpacity
                                  onPress={() =>
                                    toggleSetExpanded(match.id, set.set)
                                  }
                                  style={tw`flex-row justify-between items-center bg-slate-100 p-2 rounded-lg`}
                                >
                                  <View style={tw`flex-row items-center gap-2`}>
                                    <Text
                                      style={tw`text-sm font-bold text-[#003366]`}
                                    >
                                      Set {set.set}
                                    </Text>
                                    {winner && (
                                      <Text
                                        style={tw`text-xs font-bold ${winner === "A" ? "text-blue-600" : "text-red-600"}`}
                                      >
                                        {winner === "A" ? "Gana A" : "Gana B"}
                                      </Text>
                                    )}
                                  </View>
                                  <Ionicons
                                    name={
                                      isSetExpanded
                                        ? "chevron-up"
                                        : "chevron-down"
                                    }
                                    size={16}
                                    color="#003366"
                                  />
                                </TouchableOpacity>
                                {isSetExpanded && (
                                  <View style={tw`mt-2`}>
                                    {set.rallies.length === 0 ? (
                                      <Text style={tw`text-xs text-slate-400`}>
                                        Sin rallies registrados
                                      </Text>
                                    ) : (
                                      set.rallies.map((rally, idx) => {
                                        const rallyKey = `${match.id}-set-${set.set}-rally-${idx}`;
                                        const isRallyExpanded =
                                          expandedRallies[rallyKey];
                                        return (
                                          <View key={idx} style={tw`mb-2`}>
                                            <TouchableOpacity
                                              onPress={() =>
                                                toggleRallyExpanded(
                                                  match.id,
                                                  set.set,
                                                  idx,
                                                )
                                              }
                                              style={tw`flex-row justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100`}
                                            >
                                              <View
                                                style={tw`flex-row items-center gap-2`}
                                              >
                                                <Text
                                                  style={tw`text-xs font-bold text-slate-600`}
                                                >
                                                  Rally {idx + 1}
                                                </Text>
                                                <Text
                                                  style={tw`text-xs text-slate-500`}
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
                                                size={14}
                                                color="#94a3b8"
                                              />
                                            </TouchableOpacity>
                                            {isRallyExpanded && (
                                              <View style={tw`mt-1 ml-2`}>
                                                {rally.actions.map(
                                                  (action, aIdx) => {
                                                    const isHighlighted =
                                                      (playerName &&
                                                        action.playerId ===
                                                          matchPlayerId) ||
                                                      (teamName &&
                                                        teamPrefix &&
                                                        action.playerId.startsWith(
                                                          teamPrefix,
                                                        ));
                                                    return (
                                                      <Text
                                                        key={aIdx}
                                                        style={tw`text-xs py-0.5 px-1 rounded ${
                                                          isHighlighted
                                                            ? "bg-blue-100 text-blue-900 font-bold"
                                                            : "text-slate-700"
                                                        }`}
                                                      >
                                                        {action.playerId} →{" "}
                                                        {action.category}/
                                                        {action.subAction}{" "}
                                                        {action.value !==
                                                        undefined
                                                          ? `(${action.value})`
                                                          : ""}{" "}
                                                        {action.origin &&
                                                          `desde ${action.origin} hacia ${action.destination}`}
                                                      </Text>
                                                    );
                                                  },
                                                )}
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
                })}
              </View>
            )}

            {/* Botón Exportar PDF */}
            <TouchableOpacity
              onPress={handleExportPDF}
              style={tw`flex-row items-center justify-center bg-red-600 ${isMobile ? "py-2 px-3" : "py-3 px-5"} rounded-xl mt-6 self-end`}
            >
              <Ionicons name="document-outline" size={18} color="white" />
              <Text style={tw`text-white font-bold ml-2`}>Exportar a PDF</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Modales de selección */}
      {modalVisible === "player" && (
        <SelectionModal
          visible={true}
          title="Seleccionar Jugador"
          options={filteredLists.players}
          onSelect={(val: string) => {
            setPlayerName(val);
            setModalVisible(null);
          }}
          onClose={() => setModalVisible(null)}
        />
      )}
      {modalVisible === "team" && (
        <SelectionModal
          visible={true}
          title="Seleccionar Equipo"
          options={filteredLists.teams}
          onSelect={(val: string) => {
            setTeamName(val);
            setModalVisible(null);
          }}
          onClose={() => setModalVisible(null)}
        />
      )}
      {modalVisible === "denomination" && (
        <SelectionModal
          visible={true}
          title="Filtrar por Denominación"
          options={filteredLists.denominations}
          onSelect={(val: string) => {
            setDenomination(val);
            setModalVisible(null);
          }}
          onClose={() => setModalVisible(null)}
        />
      )}
      {modalVisible === "category" && (
        <SelectionModal
          visible={true}
          title="Filtrar por Categoría"
          options={filteredLists.categories}
          onSelect={(val: string) => {
            setCategory(val);
            setModalVisible(null);
          }}
          onClose={() => setModalVisible(null)}
        />
      )}
      {modalVisible === "eventType" && (
        <SelectionModal
          visible={true}
          title="Filtrar por Tipo de Evento"
          options={filteredLists.eventTypes}
          onSelect={(val: string) => {
            setEventType(val);
            setModalVisible(null);
          }}
          onClose={() => setModalVisible(null)}
        />
      )}
      {modalVisible === "place" && (
        <SelectionModal
          visible={true}
          title="Filtrar por Lugar"
          options={filteredLists.places}
          onSelect={(val: string) => {
            setPlace(val);
            setModalVisible(null);
          }}
          onClose={() => setModalVisible(null)}
        />
      )}
      {modalVisible === "meso" && (
        <SelectionModal
          visible={true}
          title="Filtrar por Mesociclo"
          options={filteredLists.mesos}
          onSelect={(val: string) => {
            setMeso(val);
            setModalVisible(null);
          }}
          onClose={() => setModalVisible(null)}
        />
      )}
      {modalVisible === "micro" && (
        <SelectionModal
          visible={true}
          title="Filtrar por Microciclo"
          options={filteredLists.micros}
          onSelect={(val: string) => {
            setMicro(val);
            setModalVisible(null);
          }}
          onClose={() => setModalVisible(null)}
        />
      )}
      {modalVisible === "gender" && (
        <SelectionModal
          visible={true}
          title="Filtrar por Género"
          options={filteredLists.genders}
          onSelect={(val: string) => {
            setGender(val);
            setModalVisible(null);
          }}
          onClose={() => setModalVisible(null)}
        />
      )}
    </SafeAreaView>
  );
}
