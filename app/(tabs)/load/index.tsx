// app/(tabs)/load/index.tsx
import CustomModal from "@/components/CustomModal";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { FlatList, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import HeaderMenu from "../../../components/HeaderMenu";
import tw from "../../../lib/tailwind";
import { useMatchStore } from "../../../src/store/useMatchStore";

export default function LoadMatchScreen() {
  const { filter } = useLocalSearchParams<{ filter?: string }>();
  const router = useRouter();

  const savedMatches = useMatchStore((s) => s.savedMatches);
  const loadMatch = useMatchStore((s) => s.loadMatch);
  const deleteMatch = useMatchStore((s) => s.deleteMatch);
  const currentMatch = useMatchStore((s) => s.currentMatch);

  // Estado unificado para el modal de confirmación
  const [modal, setModal] = useState<{
    visible: boolean;
    type: "resume" | "delete" | null;
    matchId: string;
    title: string;
    message: string;
    confirmText: string;
    typeModal: "warning" | "danger" | "info";
  }>({
    visible: false,
    type: null,
    matchId: "",
    title: "",
    message: "",
    confirmText: "",
    typeModal: "warning",
  });

  // Filtramos partidos 'parcial' y, opcionalmente, por tipo de evento
  const pendingMatches = savedMatches.filter((m) => {
    if (m.status !== "partial") return false;
    if (filter && m.config.eventType !== filter) return false;
    return true;
  });

  // Al pulsar Reanudar
  const handleResumePress = (matchId: string) => {
    if (currentMatch) {
      setModal({
        visible: true,
        type: "resume",
        matchId,
        title: "Partido en curso",
        message:
          "Si cargas este partido, el partido actual se perderá. ¿Deseas continuar?",
        confirmText: "Cargar",
        typeModal: "danger",
      });
    } else {
      loadMatch(matchId);
      router.push("/(tabs)/game");
    }
  };

  // Al pulsar Eliminar
  const handleDeletePress = (matchId: string) => {
    setModal({
      visible: true,
      type: "delete",
      matchId,
      title: "Eliminar partido",
      message: "¿Estás seguro de que quieres borrar este partido guardado?",
      confirmText: "Eliminar",
      typeModal: "danger",
    });
  };

  // Acción a ejecutar al confirmar el modal
  const handleModalConfirm = () => {
    if (modal.type === "resume") {
      loadMatch(modal.matchId);
      router.push("/(tabs)/game");
    } else if (modal.type === "delete") {
      deleteMatch(modal.matchId);
    }
    setModal({ ...modal, visible: false });
  };

  const getProgressText = (match: (typeof savedMatches)[0]) => {
    const { setsA, setsB, pointsA, pointsB, currentSet } = match.score;
    return `Set ${currentSet} (${pointsA}-${pointsB}) | Sets: ${setsA}-${setsB}`;
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-white`} edges={["top"]}>
      <HeaderMenu
        title={`CARGAR${filter ? `: ${filter.toUpperCase()}` : ""}`}
        dark={false}
        showQuickNav={true}
        onBack={() => router.replace("/(tabs)/menu")}
      />

      <View style={tw`flex-1 p-5 pt-4`}>
        <Text style={tw`text-2xl font-black text-slate-400 uppercase mb-6`}>
          Partidos Pendientes
        </Text>

        <FlatList
          data={pendingMatches}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View
              style={tw`bg-slate-50 p-4 rounded-2xl mb-3 border border-slate-100 shadow-sm flex-row justify-between items-center`}
            >
              <View style={tw`flex-1`}>
                <Text style={tw`font-bold text-[#003366] text-base`}>
                  {item.config.tournament ||
                    item.config.denomination ||
                    "Sin nombre"}
                </Text>
                <Text style={tw`text-slate-500 text-xs`}>
                  {item.config.teamA.name} vs {item.config.teamB.name}
                </Text>
                <Text style={tw`text-orange-500 text-xs font-black uppercase`}>
                  {getProgressText(item)}
                </Text>
              </View>
              <View style={tw`flex-row gap-2`}>
                <TouchableOpacity
                  onPress={() => handleResumePress(item.id)}
                  style={tw`bg-[#003366] px-3 py-2 rounded-lg`}
                >
                  <Text style={tw`text-white text-xs font-bold`}>Reanudar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDeletePress(item.id)}
                  style={tw`border border-red-300 px-3 py-2 rounded-lg`}
                >
                  <Text style={tw`text-red-500 text-xs font-bold`}>
                    Eliminar
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <Text style={tw`text-center text-slate-400 mt-10`}>
              No hay partidos para continuar
            </Text>
          }
        />
      </View>

      {/* Modal unificado para Reanudar y Eliminar */}
      <CustomModal
        visible={modal.visible}
        title={modal.title}
        message={modal.message}
        type={modal.typeModal}
        onConfirm={handleModalConfirm}
        onCancel={() => setModal({ ...modal, visible: false })}
        confirmText={modal.confirmText}
        cancelText="Cancelar"
      />
    </SafeAreaView>
  );
}
