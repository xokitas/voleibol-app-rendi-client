import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { FlatList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import HeaderMenu from "../../../components/HeaderMenu";
import tw from "../../../lib/tailwind";

// Definimos la forma de nuestros datos para que TS no se queje
interface EventResult {
  id: string;
  type: string;
  title: string;
  date: string;
}

const MOCK_RESULTS: EventResult[] = [
  { id: "1", type: "oficial", title: "Final Copa Verano", date: "2026-04-20" },
  {
    id: "2",
    type: "entrenamiento",
    title: "Sesión Técnica Recepción",
    date: "2026-04-21",
  },
  { id: "3", type: "interno", title: "Amistoso A vs B", date: "2026-04-22" },
  { id: "4", type: "oficial", title: "Liga Regional J1", date: "2026-04-23" },
];

export default function ResultsScreen() {
  const { filter } = useLocalSearchParams(); // Recibe el parámetro del menú
  const router = useRouter();
  const [filteredData, setFilteredData] = useState<EventResult[]>([]);

  useEffect(() => {
    // Filtramos los datos falsos basándonos en el 'filter' que llega por URL
    const results = MOCK_RESULTS.filter((item) => item.type === filter);
    setFilteredData(results);
  }, [filter]);

  return (
    <SafeAreaView style={tw`flex-1 bg-white`} edges={["top"]}>
      <HeaderMenu
        title={`RESULTADOS: ${String(filter).toUpperCase()}`}
        dark={false}
        showQuickNav={true}
        onBack={() => router.replace("/(tabs)/menu")}
      />

      <View style={tw`flex-1 p-5 pt-4`}>
        <Text style={tw`text-2xl font-black text-slate-400 uppercase mb-6`}>
          Historial de Eventos
        </Text>

        <FlatList
          data={filteredData}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View
              style={tw`bg-slate-50 p-4 rounded-2xl mb-3 border border-slate-100 shadow-sm`}
            >
              <Text style={tw`font-bold text-[#003366] text-lg`}>
                {item.title}
              </Text>
              <Text style={tw`text-slate-400 text-xs uppercase font-bold`}>
                {item.date}
              </Text>
            </View>
          )}
          ListEmptyComponent={
            <Text style={tw`text-center text-slate-400 mt-10`}>
              No hay resultados registrados
            </Text>
          }
        />
      </View>
    </SafeAreaView>
  );
}
