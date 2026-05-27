// app/(tabs)/menu/index.tsx
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import HeaderMenu from "../../../components/HeaderMenu";
import tw from "../../../lib/tailwind";

export default function MenuScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 1024;

  const [activeTab, setActiveTab] = useState<string | null>(null);

  const typeOptions = [
    { id: "oficial", label: "Competencia oficial", icon: "trophy-outline" },
    { id: "interno", label: "Control interno", icon: "clipboard-outline" },
    { id: "entrenamiento", label: "Entrenamiento", icon: "fitness-outline" },
    { id: "externo", label: "Control externo", icon: "earth-outline" },
  ];

  const handleNavigation = (optionId: string) => {
    if (activeTab === "reg") {
      router.push(`/(tabs)/register/${optionId}` as any);
    } else {
      const route = activeTab === "vis" ? "/(tabs)/results" : "/(tabs)/load";
      router.push({
        pathname: route,
        params: { filter: optionId },
      } as any);
    }
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-[#F8F8FF]`} edges={["top"]}>
      <Image
        source={require("../../../assets/images/fondo.png")}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: isMobile ? 0.15 : 0.25,
        }}
        contentFit="contain"
      />
      <HeaderMenu
        title={isMobile ? "Menú" : "Menú de Opciones"}
        onBack={() => router.replace("/")}
        dark={false}
        showQuickNav={false}
        compact={isMobile}
      />

      <ScrollView
        contentContainerStyle={tw`${isMobile ? "px-2 py-1" : "p-6 pt-4"}`}
      >
        <View style={tw`${isMobile ? "mb-2" : "mb-8"}`}>
          <Text
            style={tw`${
              isMobile ? "text-xs" : "text-2xl"
            } font-black text-slate-400 uppercase`}
          >
            ¿Qué deseas hacer hoy?
          </Text>
        </View>

        <View
          style={tw`flex-row justify-between ${
            isMobile ? "gap-1 mb-2" : "gap-2 mb-8"
          }`}
        >
          <TouchableOpacity
            style={[
              tw`bg-white border border-slate-200 ${
                isMobile ? "p-1.5" : "p-4"
              } rounded-2xl items-center flex-1 shadow-sm ${
                isMobile ? "h-16" : "h-28"
              } justify-center`,
              activeTab === "reg" &&
                tw`bg-[#003366] border-[#003366] shadow-md`,
            ]}
            onPress={() => setActiveTab(activeTab === "reg" ? null : "reg")}
          >
            <Ionicons
              name="add-circle"
              size={isMobile ? 18 : 24}
              color={activeTab === "reg" ? "#FFF" : "#003366"}
            />
            <Text
              style={[
                tw`${
                  isMobile ? "text-[8px]" : "text-[11px]"
                } font-black text-[#003366] mt-1 uppercase text-center leading-3`,
                activeTab === "reg" && tw`text-white`,
              ]}
            >
              Registrar Datos
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              tw`bg-white border border-slate-200 ${
                isMobile ? "p-1.5" : "p-4"
              } rounded-2xl items-center flex-1 shadow-sm ${
                isMobile ? "h-16" : "h-28"
              } justify-center`,
              activeTab === "vis" &&
                tw`bg-[#003366] border-[#003366] shadow-md`,
            ]}
            onPress={() => setActiveTab(activeTab === "vis" ? null : "vis")}
          >
            <Ionicons
              name="eye"
              size={isMobile ? 18 : 24}
              color={activeTab === "vis" ? "#FFF" : "#003366"}
            />
            <Text
              style={[
                tw`${
                  isMobile ? "text-[8px]" : "text-[11px]"
                } font-black text-[#003366] mt-1 uppercase text-center leading-3`,
                activeTab === "vis" && tw`text-white`,
              ]}
            >
              Visualizar Resultados
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              tw`bg-white border border-slate-200 ${
                isMobile ? "p-1.5" : "p-4"
              } rounded-2xl items-center flex-1 shadow-sm ${
                isMobile ? "h-16" : "h-28"
              } justify-center`,
              activeTab === "load" &&
                tw`bg-[#003366] border-[#003366] shadow-md`,
            ]}
            onPress={() => setActiveTab(activeTab === "load" ? null : "load")}
          >
            <Ionicons
              name="cloud-upload"
              size={isMobile ? 18 : 24}
              color={activeTab === "load" ? "#FFF" : "#003366"}
            />
            <Text
              style={[
                tw`${
                  isMobile ? "text-[8px]" : "text-[11px]"
                } font-black text-[#003366] mt-1 uppercase text-center leading-3`,
                activeTab === "load" && tw`text-white`,
              ]}
            >
              Cargar Partido
            </Text>
          </TouchableOpacity>
        </View>

        {/* Desplegable dinámico */}
        {activeTab && (
          <View
            style={tw`bg-white rounded-3xl ${
              isMobile ? "p-2" : "p-4"
            } border border-slate-100 shadow-sm`}
          >
            <Text
              style={tw`${isMobile ? "text-[7px]" : "text-[10px]"} font-bold text-slate-400 uppercase mb-2 ml-1`}
            >
              Seleccione modalidad:
            </Text>
            {typeOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={tw`flex-row items-center bg-slate-50 ${
                  isMobile ? "p-1.5" : "p-4"
                } rounded-xl mb-1.5 border border-slate-100`}
                activeOpacity={0.6}
                onPress={() => handleNavigation(option.id)}
              >
                <Ionicons
                  name={option.icon as any}
                  size={isMobile ? 14 : 20}
                  color="#003366"
                />
                <Text
                  style={tw`flex-1 ml-2 text-slate-700 ${
                    isMobile ? "text-[10px]" : "text-sm"
                  } font-semibold`}
                >
                  {option.label}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={isMobile ? 12 : 16}
                  color="#CBD5E1"
                />
              </TouchableOpacity>
            ))}

            {/* Quinta opción solo para Visualizar Resultados */}
            {activeTab === "vis" && (
              <TouchableOpacity
                style={tw`flex-row items-center bg-slate-50 ${
                  isMobile ? "p-1.5" : "p-4"
                } rounded-xl mb-1.5 border border-slate-100`}
                activeOpacity={0.6}
                onPress={() => router.push("/(tabs)/results/statistics" as any)}
              >
                <Ionicons
                  name="stats-chart-outline"
                  size={isMobile ? 14 : 20}
                  color="#003366"
                />
                <Text
                  style={tw`flex-1 ml-2 text-slate-700 ${
                    isMobile ? "text-[10px]" : "text-sm"
                  } font-semibold`}
                >
                  Estadísticas avanzadas
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={isMobile ? 12 : 16}
                  color="#CBD5E1"
                />
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
