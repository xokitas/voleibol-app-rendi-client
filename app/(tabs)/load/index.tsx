// app/(tabs)/load/index.tsx
import CustomModal from "@/components/CustomModal";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
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
import { useMatchStore } from "../../../src/store/useMatchStore";

export default function LoadMatchScreen() {
  const { filter } = useLocalSearchParams<{ filter?: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 1024;
  const currentPlatform: "web" | "mobile" =
    Platform.OS === "web" ? "web" : "mobile";

  const savedMatches = useMatchStore((s) => s.savedMatches);
  const loadMatch = useMatchStore((s) => s.loadMatch);
  const deleteMatch = useMatchStore((s) => s.deleteMatch);
  const currentMatch = useMatchStore((s) => s.currentMatch);

  const [modal, setModal] = useState<{
    visible: boolean;
    type: "resume" | "delete" | "platform" | null;
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

  const pendingMatches = savedMatches.filter((m) => {
    if (m.status !== "partial") return false;
    if (filter && m.config.eventType !== filter) return false;
    return true;
  });

  const handleResumePress = (matchId: string) => {
    const match = savedMatches.find((m) => m.id === matchId);
    if (!match) return;

    const matchPlatform = match.config.platform || "web";
    if (matchPlatform !== currentPlatform) {
      setModal({
        visible: true,
        type: "platform",
        matchId,
        title: "Plataforma incompatible",
        message:
          currentPlatform === "web"
            ? "Este partido fue registrado en el móvil. Solo puede reanudarse en un dispositivo móvil."
            : "Este partido fue registrado en la web. Solo puede reanudarse en la versión de escritorio.",
        confirmText: "Entendido",
        typeModal: "warning",
      });
      return;
    }

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
        compact={isMobile}
      />

      <View style={tw`flex-1 ${isMobile ? "px-3 py-2" : "p-5 pt-4"}`}>
        <Text
          style={tw`${
            isMobile ? "text-[10px]" : "text-2xl"
          } font-black text-slate-400 uppercase mb-4`}
        >
          Partidos Pendientes
        </Text>

        <FlatList
          data={pendingMatches}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const platform = item.config.platform || "web";
            const platformColor = platform === "web" ? "#003366" : "#16a34a";
            return (
              <View
                style={tw`bg-slate-50 ${
                  isMobile ? "p-3" : "p-4"
                } rounded-2xl mb-3 border border-slate-100 shadow-sm flex-row items-center`}
              >
                {/* Columna 1: Datos del partido – ocupa la mitad del espacio disponible */}
                <View style={tw`flex-1`}>
                  <Text
                    style={tw`font-bold text-[#003366] ${isMobile ? "text-sm" : "text-base"}`}
                  >
                    {item.config.tournament ||
                      item.config.denomination ||
                      "Sin nombre"}
                  </Text>
                  <Text
                    style={tw`text-slate-500 ${isMobile ? "text-[10px]" : "text-xs"}`}
                  >
                    {item.config.teamA.name} vs {item.config.teamB.name}
                  </Text>
                  <Text
                    style={tw`text-orange-500 ${isMobile ? "text-[10px]" : "text-xs"} font-black uppercase`}
                  >
                    {getProgressText(item)}
                  </Text>
                </View>

                {/* Columna 2: Indicador de plataforma – ancho fijo, centrado vertical y horizontalmente */}
                <View
                  style={tw`items-center justify-center ${
                    isMobile ? "w-16" : "w-20"
                  }`}
                >
                  <Text
                    style={tw`${
                      isMobile ? "text-[7px]" : "text-[9px]"
                    } text-slate-400 mb-0.5 text-center`}
                  >
                    Se registró en:
                  </Text>
                  <Ionicons
                    name={
                      platform === "web"
                        ? "desktop-outline"
                        : "phone-portrait-outline"
                    }
                    size={isMobile ? 16 : 20}
                    color={platformColor}
                  />
                </View>

                {/* Columna 3: Contenedor flexible que empuja los botones a la derecha */}
                <View style={tw`flex-1 flex-row justify-end`}>
                  <View style={tw`flex-row gap-2`}>
                    <TouchableOpacity
                      onPress={() => handleResumePress(item.id)}
                      style={tw`bg-[#003366] ${
                        isMobile ? "px-2 py-1.5" : "px-3 py-2"
                      } rounded-lg`}
                    >
                      <Text
                        style={tw`text-white ${
                          isMobile ? "text-[10px]" : "text-xs"
                        } font-bold`}
                      >
                        Reanudar
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeletePress(item.id)}
                      style={tw`border border-red-300 ${
                        isMobile ? "px-2 py-1.5" : "px-3 py-2"
                      } rounded-lg`}
                    >
                      <Text
                        style={tw`text-red-500 ${
                          isMobile ? "text-[10px]" : "text-xs"
                        } font-bold`}
                      >
                        Eliminar
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <Text
              style={tw`text-center text-slate-400 ${
                isMobile ? "text-sm" : ""
              } mt-10`}
            >
              No hay partidos para continuar
            </Text>
          }
        />
      </View>

      <CustomModal
        visible={modal.visible}
        title={modal.title}
        message={modal.message}
        type={modal.typeModal}
        onConfirm={handleModalConfirm}
        onCancel={() => setModal({ ...modal, visible: false })}
        confirmText={modal.confirmText}
        cancelText={modal.type !== "platform" ? "Cancelar" : undefined}
      />
    </SafeAreaView>
  );
}
