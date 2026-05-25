// app/(tabs)/results/index.tsx
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import HeaderMenu from "../../../components/HeaderMenu";
import tw from "../../../lib/tailwind";
import { useAuthStore } from "../../../src/store/useAuthStore";
import { useMatchStore, type Match } from "../../../src/store/useMatchStore";

export default function ResultsScreen() {
  const fetchMatchesFromServer = useMatchStore((s) => s.fetchMatchesFromServer);

  useFocusEffect(
    React.useCallback(() => {
      fetchMatchesFromServer();
    }, []),
  );
  const { filter } = useLocalSearchParams<{ filter?: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 1024;

  const savedMatches = useMatchStore((s) => s.savedMatches);
  const user = useAuthStore((s) => s.user);

  // Filtros
  const [showOnlyMine, setShowOnlyMine] = useState(false);
  const [filterDate, setFilterDate] = useState<string>("");
  const [showDatePicker, setShowDatePicker] = useState(false);

  const finishedMatches = useMemo(() => {
    return savedMatches.filter((m) => {
      if (m.status !== "finished") return false;
      if (filter && m.config.eventType?.toLowerCase() !== filter.toLowerCase())
        return false;
      if (showOnlyMine && user?.email && m.config.createdBy !== user.email)
        return false;
      if (filterDate) {
        const matchDate = m.config.date?.split("T")[0];
        if (matchDate !== filterDate) return false;
      }
      return true;
    });
  }, [savedMatches, filter, showOnlyMine, user, filterDate]);

  const getWinnerText = (match: Match) => {
    if (match.score.setsA === 2) return `Ganador: ${match.config.teamA.name}`;
    if (match.score.setsB === 2) return `Ganador: ${match.config.teamB.name}`;
    return "Resultado no definido";
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleViewDetails = (match: Match) => {
    router.push({
      pathname: "/(tabs)/results/[matchId]",
      params: { matchId: match.id },
    });
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-white`} edges={["top"]}>
      <HeaderMenu
        title={`RESULTADOS${filter ? `: ${filter.toUpperCase()}` : ""}`}
        dark={false}
        showQuickNav={true}
        onBack={() => router.replace("/(tabs)/menu")}
        compact={isMobile}
      />

      <View style={tw`flex-1 ${isMobile ? "px-3 py-2" : "p-5 pt-4"}`}>
        <Text
          style={tw`${isMobile ? "text-[10px]" : "text-2xl"} font-black text-slate-400 uppercase mb-4`}
        >
          Historial de Eventos
        </Text>

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

        <FlatList
          data={finishedMatches}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleViewDetails(item)}
              style={tw`bg-slate-50 ${isMobile ? "p-3" : "p-4"} rounded-2xl mb-3 border border-slate-100 shadow-sm flex-row justify-between items-center`}
            >
              <View style={tw`flex-1`}>
                <Text
                  style={tw`font-bold text-[#003366] ${isMobile ? "text-sm" : "text-base"}`}
                >
                  {item.config.tournament || "Sin nombre"}
                </Text>
                <Text
                  style={tw`text-slate-500 ${isMobile ? "text-[10px]" : "text-xs"}`}
                >
                  {item.config.teamA.name} {item.score.setsA} -{" "}
                  {item.score.setsB} {item.config.teamB.name}
                </Text>
                <Text
                  style={tw`text-green-600 ${isMobile ? "text-[10px]" : "text-xs"} font-black uppercase`}
                >
                  {getWinnerText(item)}
                </Text>
                <Text
                  style={tw`text-slate-400 ${isMobile ? "text-[8px]" : "text-xs"} uppercase font-bold mt-1`}
                >
                  {formatDate(item.config.date)}
                </Text>
              </View>
              <Ionicons
                name="eye-outline"
                size={isMobile ? 18 : 20}
                color="#003366"
              />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text
              style={tw`text-center text-slate-400 ${isMobile ? "text-sm" : ""} mt-10`}
            >
              No hay resultados registrados
            </Text>
          }
        />
      </View>
    </SafeAreaView>
  );
}
