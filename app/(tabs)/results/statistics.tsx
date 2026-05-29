// app/(tabs)/results/statistics.tsx
import CustomModal from "@/components/CustomModal";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Modal,
  Platform,
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
import { useComparative } from "../../../hooks/useComparative";
import { useStats } from "../../../hooks/useStats";
import tw from "../../../lib/tailwind";
import { useAuthStore } from "../../../src/store/useAuthStore";
import { useMatchStore } from "../../../src/store/useMatchStore";
import {
  actionAllowedValues,
  computeCategoriesAndRadar,
} from "../../../utils/analytics";

export default function StatisticsScreen() {
  const fetchMatchesFromServer = useMatchStore((s) => s.fetchMatchesFromServer);
  useFocusEffect(
    React.useCallback(() => {
      fetchMatchesFromServer();
    }, []),
  );
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 1024;
  const savedMatches = useMatchStore((s) => s.savedMatches);
  const user = useAuthStore((s) => s.user);
  const [showViewStatsModal, setShowViewStatsModal] = useState(false);

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

  const [showOnlyMine, setShowOnlyMine] = useState(false);
  const [filterDate, setFilterDate] = useState<string>("");
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Selección de partidos
  const [selectedMatchIds, setSelectedMatchIds] = useState<Set<string>>(
    new Set(),
  );
  // Mostrar solo partidos seleccionados en la lista
  const [showOnlySelected, setShowOnlySelected] = useState(false);

  // Hook de comparativa
  const {
    set1,
    showModal,
    setShowModal,
    saveSet1,
    clearSet1,
    clearComparison,
    isComparisonMode,
  } = useComparative();

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

  const toggleMatchSelection = (matchId: string) => {
    setSelectedMatchIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(matchId)) {
        newSet.delete(matchId);
      } else {
        newSet.add(matchId);
      }
      return newSet;
    });
  };

  const selectAllFilteredMatches = () => {
    const allIds = new Set(filteredMatches.map((m) => m.id));
    setSelectedMatchIds(allIds);
  };

  const clearSelection = () => setSelectedMatchIds(new Set());

  // Partidos base
  const baseMatches = useMemo(() => {
    return savedMatches.filter((m) => {
      if (showOnlyMine && user?.email && m.config.createdBy !== user.email)
        return false;
      if (filterDate) {
        const matchDate = m.config.date?.split("T")[0];
        if (matchDate !== filterDate) return false;
      }
      return true;
    });
  }, [savedMatches, showOnlyMine, user, filterDate]);

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

  // Listas base (valores únicos)
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

    baseMatches.forEach((m) => {
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
  }, [baseMatches]);

  // Listas encadenadas
  const filteredLists = useMemo(() => {
    const matchesFor = (exceptKey: string) =>
      baseMatches.filter((m) => {
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
    baseMatches,
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

  // Partidos que cumplen todos los filtros
  const filteredMatches = useMemo(() => {
    return baseMatches.filter((m) => {
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
  }, [baseMatches, activeFilters]);

  // Partidos a mostrar en la lista (todos o solo seleccionados)
  const displayedMatches = useMemo(() => {
    return showOnlySelected
      ? filteredMatches.filter((m) => selectedMatchIds.has(m.id))
      : filteredMatches;
  }, [filteredMatches, selectedMatchIds, showOnlySelected]);

  // Partidos seleccionados para estadísticas
  const selectedMatches = useMemo(() => {
    return filteredMatches.filter((m) => selectedMatchIds.has(m.id));
  }, [filteredMatches, selectedMatchIds]);

  // Acciones agregadas de los partidos seleccionados
  const { aggregatedActions } = useAggregatedStats(
    selectedMatches,
    activeFilters,
  );

  // Estadísticas generales
  const actionsMappedForStats = aggregatedActions.map((a) => ({
    ...a,
    playerId: "any",
  }));
  const { getPlayerStats: getGlobalStats } = useStats(
    [{ actions: actionsMappedForStats }],
    actionAllowedValues,
  );
  const generalStats = getGlobalStats("any");

  // Categorías y radar
  const { categoriesMap, radarData } = useMemo(
    () => computeCategoriesAndRadar(aggregatedActions),
    [aggregatedActions],
  );

  const matchesPlayed = selectedMatches.length;

  // Guardar conjunto actual
  const handleSaveSet1 = () => {
    if (selectedMatches.length === 0) return;
    saveSet1(activeFilters, selectedMatchIds);
    setPlayerName("");
    setTeamName("");
    setDenomination("");
    setCategory("");
    setEventType("");
    setPlace("");
    setMeso("");
    setMicro("");
    setGender("");
    setSelectedMatchIds(new Set());
    setShowOnlySelected(false);
  };

  // Editar conjunto 1
  const handleEditSet1 = () => {
    if (!set1) return;
    const { filters, matchIds } = set1;
    setPlayerName(filters.playerName);
    setTeamName(filters.teamName);
    setDenomination(filters.denomination);
    setCategory(filters.category);
    setEventType(filters.eventType);
    setPlace(filters.place);
    setMeso(filters.meso);
    setMicro(filters.micro);
    setGender(filters.gender);
    setSelectedMatchIds(new Set(matchIds));
    clearSet1();
  };

  // Ir a comparación
  const handleGoToComparison = () => {
    if (!set1 || selectedMatches.length === 0) return;
    setShowModal(false);
    router.push({
      pathname: "/(tabs)/results/comparative",
      params: {
        set1Data: JSON.stringify({
          filters: set1.filters,
          matchIds: set1.matchIds,
        }),
        set2Data: JSON.stringify({
          filters: activeFilters,
          matchIds: Array.from(selectedMatchIds),
        }),
      },
    });
  };

  const hasActiveFilter = playerName !== "" || teamName !== "";

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

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      <HeaderMenu
        title="Estadísticas Avanzadas"
        dark={false}
        showQuickNav={false}
        onBack={() => router.replace("/(tabs)/menu")}
        compact={isMobile}
      />

      <ScrollView
        contentContainerStyle={tw`${isMobile ? "px-2 py-1" : "p-5 pb-20"}`}
      >
        {/* Filtro Mis partidos */}
        {user?.email && (
          <View style={tw`flex-row gap-2 mb-4`}>
            <TouchableOpacity
              onPress={() => setShowOnlyMine(false)}
              style={tw`${!showOnlyMine ? "bg-[#003366]" : "bg-slate-200"} px-4 py-2 rounded-full`}
            >
              <Text
                style={tw`${!showOnlyMine ? "text-white" : "text-slate-600"} text-xs font-bold`}
              >
                Todos
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowOnlyMine(true)}
              style={tw`${showOnlyMine ? "bg-[#003366]" : "bg-slate-200"} px-4 py-2 rounded-full`}
            >
              <Text
                style={tw`${showOnlyMine ? "text-white" : "text-slate-600"} text-xs font-bold`}
              >
                Mis partidos
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Filtro por fecha */}
        <View style={tw`flex-row items-center gap-2 mb-4`}>
          <Text style={tw`text-xs font-bold text-slate-500`}>Fecha:</Text>
          {Platform.OS === "web" ? (
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              style={{
                border: "1px solid #cbd5e1",
                borderRadius: 8,
                padding: "4px 8px",
                fontSize: 12,
                color: "#334155",
                backgroundColor: "white",
                outline: "none",
              }}
            />
          ) : (
            <>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                style={tw`bg-white border border-slate-200 px-3 py-1.5 rounded-lg`}
              >
                <Text style={tw`text-xs text-slate-600`}>
                  {filterDate || "Seleccionar fecha"}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={filterDate ? new Date(filterDate) : new Date()}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) {
                      const yyyy = selectedDate.getFullYear();
                      const mm = String(selectedDate.getMonth() + 1).padStart(
                        2,
                        "0",
                      );
                      const dd = String(selectedDate.getDate()).padStart(
                        2,
                        "0",
                      );
                      setFilterDate(`${yyyy}-${mm}-${dd}`);
                    }
                  }}
                />
              )}
            </>
          )}
          {filterDate !== "" && (
            <TouchableOpacity onPress={() => setFilterDate("")}>
              <Ionicons name="close-circle" size={18} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Aviso de conjunto 1 guardado */}
        {isComparisonMode && (
          <View
            style={tw`bg-green-50 border border-green-200 rounded-xl p-3 mb-4`}
          >
            <Text style={tw`text-green-800 font-bold text-sm`}>
              Conjunto 1 guardado correctamente.
            </Text>
            <Text style={tw`text-green-700 text-xs mt-1`}>
              Ahora selecciona los filtros y partidos para el segundo conjunto.
            </Text>
            <TouchableOpacity
              onPress={clearComparison}
              style={tw`mt-2 self-end`}
            >
              <Text style={tw`text-red-500 text-xs font-bold`}>
                Cancelar comparativa
              </Text>
            </TouchableOpacity>
          </View>
        )}

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
                Basado en {matchesPlayed} partido(s) seleccionado(s)
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

            {selectedMatches.length === 0 && (
              <View
                style={tw`bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4`}
              >
                <Text style={tw`text-yellow-700 text-sm font-bold`}>
                  No has seleccionado ningún partido.
                </Text>
                <Text style={tw`text-yellow-600 text-xs mt-1`}>
                  Marca los partidos en la lista de abajo para calcular las
                  estadísticas.
                </Text>
              </View>
            )}

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
            ) : selectedMatches.length > 0 ? (
              <Text
                style={tw`text-center text-slate-400 py-10 ${isMobile ? "text-xs" : "text-base"}`}
              >
                No se registraron acciones para los partidos seleccionados.
              </Text>
            ) : null}

            {/* Lista de partidos con toggle "Ver seleccionados" */}
            {displayedMatches.length > 0 && (
              <View style={tw`mt-6`}>
                <View style={tw`flex-row justify-between items-center mb-3`}>
                  <Text style={tw`text-lg font-black text-slate-400 uppercase`}>
                    Partidos ({displayedMatches.length})
                  </Text>
                  <View style={tw`flex-row gap-2`}>
                    {!showOnlySelected && (
                      <>
                        <TouchableOpacity
                          onPress={selectAllFilteredMatches}
                          style={tw`bg-slate-200 px-3 py-1 rounded-full`}
                        >
                          <Text style={tw`text-xs font-bold text-slate-600`}>
                            Seleccionar todos
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={clearSelection}
                          style={tw`bg-slate-200 px-3 py-1 rounded-full`}
                        >
                          <Text style={tw`text-xs font-bold text-slate-600`}>
                            Limpiar
                          </Text>
                        </TouchableOpacity>
                      </>
                    )}
                    <TouchableOpacity
                      onPress={() => setShowOnlySelected(!showOnlySelected)}
                      style={tw`${showOnlySelected ? "bg-green-600" : "bg-green-200"} px-3 py-1 rounded-full`}
                    >
                      <Text
                        style={tw`text-xs font-bold ${showOnlySelected ? "text-white" : "text-green-800"}`}
                      >
                        {showOnlySelected ? "Ver todos" : "Ver seleccionados"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
                {displayedMatches.map((match) => {
                  const isExpanded = expandedMatchId === match.id;
                  const isSelected = selectedMatchIds.has(match.id);
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
                  if (teamName && match.config.teamA.name === teamName)
                    teamPrefix = "A";
                  else if (teamName && match.config.teamB.name === teamName)
                    teamPrefix = "B";

                  const setWinners: Record<number, string> = {};
                  match.history.forEach((set) => {
                    const lastRally = set.rallies[set.rallies.length - 1];
                    if (lastRally?.winner)
                      setWinners[set.set] = lastRally.winner;
                  });

                  return (
                    <View key={match.id} style={tw`mb-2`}>
                      <View style={tw`flex-row items-center`}>
                        <TouchableOpacity
                          onPress={() => toggleMatchSelection(match.id)}
                          style={tw`mr-2`}
                        >
                          <Ionicons
                            name={isSelected ? "checkbox" : "square-outline"}
                            size={20}
                            color={isSelected ? "#003366" : "#94a3b8"}
                          />
                        </TouchableOpacity>

                        <View style={tw`flex-1`}>
                          <TouchableOpacity
                            onPress={() =>
                              setExpandedMatchId(isExpanded ? null : match.id)
                            }
                            style={tw`flex-row justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200`}
                          >
                            <View style={tw`flex-1`}>
                              <Text
                                style={tw`font-bold text-[#003366] text-sm`}
                              >
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
                                      <View
                                        style={tw`flex-row items-center gap-2`}
                                      >
                                        <Text
                                          style={tw`text-sm font-bold text-[#003366]`}
                                        >
                                          Set {set.set}
                                        </Text>
                                        {winner && (
                                          <Text
                                            style={tw`text-xs font-bold ${winner === "A" ? "text-blue-600" : "text-red-600"}`}
                                          >
                                            {winner === "A"
                                              ? "Gana A"
                                              : "Gana B"}
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
                                          <Text
                                            style={tw`text-xs text-slate-400`}
                                          >
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
                                                            style={tw`text-xs py-0.5 px-1 rounded ${isHighlighted ? "bg-blue-100 text-blue-900 font-bold" : "text-slate-700"}`}
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
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Botones de acción */}
            <View style={tw`flex-row justify-end gap-3 mt-6`}>
              <TouchableOpacity
                onPress={() => {
                  if (selectedMatches.length === 0) return;
                  setShowViewStatsModal(true);
                }}
                disabled={selectedMatches.length === 0 || isComparisonMode} // ← añadir isComparisonMode
                style={tw`flex-row items-center justify-center bg-green-600 ${isMobile ? "py-2 px-3" : "py-3 px-5"} rounded-xl ${
                  selectedMatches.length === 0 || isComparisonMode
                    ? "opacity-50"
                    : ""
                }`}
              >
                <Ionicons name="eye-outline" size={18} color="white" />
                <Text style={tw`text-white font-bold ml-2`}>
                  Ver estadísticas
                </Text>
              </TouchableOpacity>
              {isComparisonMode ? (
                <TouchableOpacity
                  onPress={() => setShowModal(true)}
                  disabled={selectedMatches.length === 0}
                  style={tw`flex-row items-center justify-center bg-blue-600 ${isMobile ? "py-2 px-3" : "py-3 px-5"} rounded-xl ${selectedMatches.length === 0 ? "opacity-50" : ""}`}
                >
                  <Ionicons
                    name="git-compare-outline"
                    size={18}
                    color="white"
                  />
                  <Text style={tw`text-white font-bold ml-2`}>
                    Comparar conjuntos
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={handleSaveSet1}
                  disabled={selectedMatches.length === 0}
                  style={tw`flex-row items-center justify-center bg-blue-600 ${isMobile ? "py-2 px-3" : "py-3 px-5"} rounded-xl ${selectedMatches.length === 0 ? "opacity-50" : ""}`}
                >
                  <Ionicons name="add-circle-outline" size={18} color="white" />
                  <Text style={tw`text-white font-bold ml-2`}>
                    Guardar conjunto actual
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Modal de comparación */}
      <CustomModal
        visible={showViewStatsModal}
        title="Ver estadísticas"
        message="¿Desea ver las estadísticas detalladas de todos los partidos seleccionados?"
        type="info"
        onConfirm={() => {
          setShowViewStatsModal(false);
          router.push({
            pathname: "/(tabs)/results/selected-stats",
            params: {
              filters: JSON.stringify(activeFilters),
              matchIds: JSON.stringify(Array.from(selectedMatchIds)),
            },
          });
        }}
        onCancel={() => setShowViewStatsModal(false)}
        confirmText="Ver"
        cancelText="Cancelar"
      />
      <Modal visible={showModal} transparent animationType="fade">
        <View style={tw`flex-1 justify-center items-center bg-black/60 p-4`}>
          <View style={tw`bg-white rounded-2xl w-full max-w-lg p-5`}>
            <Text
              style={tw`text-xl font-black text-[#003366] mb-4 text-center`}
            >
              Comparativa de estadísticas
            </Text>
            <View style={tw`flex-row justify-between mb-6`}>
              <View style={tw`flex-1 bg-slate-50 rounded-xl p-3 mr-2`}>
                <Text style={tw`text-sm font-bold text-slate-700 mb-2`}>
                  Conjunto 1
                </Text>
                <Text style={tw`text-xs text-slate-500`}>
                  {set1?.matchIds.length ?? 0} partido(s)
                </Text>
              </View>
              <View style={tw`flex-1 bg-slate-50 rounded-xl p-3 ml-2`}>
                <Text style={tw`text-sm font-bold text-slate-700 mb-2`}>
                  Conjunto 2
                </Text>
                <Text style={tw`text-xs text-slate-500`}>
                  {selectedMatches.length} partido(s)
                </Text>
              </View>
            </View>
            <View style={tw`flex-row justify-center gap-3`}>
              <TouchableOpacity
                onPress={handleEditSet1}
                style={tw`bg-yellow-500 px-4 py-2 rounded-xl`}
              >
                <Text style={tw`text-white font-bold text-xs`}>
                  Editar Conjunto 1
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                style={tw`bg-slate-400 px-4 py-2 rounded-xl`}
              >
                <Text style={tw`text-white font-bold text-xs`}>
                  Editar Conjunto 2
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleGoToComparison}
                style={tw`bg-[#003366] px-4 py-2 rounded-xl`}
              >
                <Text style={tw`text-white font-bold text-xs`}>
                  Ir a comparación
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
