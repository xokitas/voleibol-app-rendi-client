// app/index.tsx
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React from "react";
import {
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import UserMenu from "../components/UserMenu";
import tw from "../lib/tailwind";

export default function WelcomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 1024;

  return (
    <SafeAreaView style={tw`flex-1 bg-[#F8F8FF]`}>
      <StatusBar barStyle="dark-content" />

      {/* Imagen de fondo */}
      <Image
        source={require("../assets/images/fondo.png")}
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

      {/* Contenedor principal */}
      <View
        style={tw`flex-1 justify-between items-center ${
          isMobile ? "px-2 py-1" : "px-6 py-12"
        }`}
      >
        {/* Bloque superior (icono + "Iniciar Sesión") */}
        <View
          style={tw`absolute ${
            isMobile ? "top-2" : "top-10"
          } left-0 right-0 items-center z-10`}
          pointerEvents="box-none"
        >
          {/* Icono corregido: contenedor más grande y sin pointerEvents que moleste */}
          <View
            style={tw`${isMobile ? "w-12 h-14" : "w-10 h-10"} items-center justify-center`}
          >
            <UserMenu />
          </View>
          <TouchableOpacity
            onPress={() => router.push("/login")}
            style={tw`z-50 mt-0.5 px-3 py-0.5`}
          >
            <Text
              style={tw`${
                isMobile ? "text-[8px]" : "text-[10px]"
              } font-black text-slate-400 uppercase`}
            >
              Iniciar Sesión
            </Text>
          </TouchableOpacity>
        </View>

        {/* Zona central – centrada verticalmente y con margen extra en móvil */}
        <View
          style={tw`flex-1 justify-center items-center w-full max-w-2xl ${
            isMobile ? "mt-12" : ""
          }`}
        >
          <View style={tw`items-center ${isMobile ? "mb-2" : "mb-16"}`}>
            <Text
              style={tw`${
                isMobile ? "text-3xl p-0" : "text-7xl p-8"
              } font-black text-[#003366]`}
            >
              RENDI
            </Text>
            <Text
              style={tw`${
                isMobile ? "text-[7px]" : "text-xs"
              } font-bold text-slate-400 uppercase mt-1`}
            >
              Voleibol Playa Cubano
            </Text>
          </View>

          <View style={tw`w-full max-w-md items-center`}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={tw`bg-[#003366] ${
                isMobile ? "py-2" : "py-5"
              } rounded-2xl shadow-xl items-center w-full mb-3`}
              onPress={() => router.push("/(tabs)/menu")}
            >
              <Text
                style={tw`text-white ${
                  isMobile ? "text-sm" : "text-xl"
                } font-bold uppercase`}
              >
                Empezar a Anotar
              </Text>
            </TouchableOpacity>

            <Text
              style={tw`text-slate-400 ${
                isMobile ? "text-[7px]" : "text-xs"
              } text-center font-medium leading-4 px-2`}
            >
              Uso libre sin conexión. Inicia sesión en cualquier momento para
              sincronizar tus datos.
            </Text>
          </View>
        </View>

        {/* Pie de página (nombres del equipo) */}
        <View
          style={tw`w-full max-w-3xl items-center ${
            isMobile ? "pt-1 pb-0.5" : "pt-8"
          } border-t border-slate-200`}
        >
          <Text
            style={tw`${
              isMobile ? "text-[5px]" : "text-[10px]"
            } font-black text-[#003366] mb-4 uppercase`}
          >
            Equipo Desarrollador
          </Text>
          <View
            style={tw`flex-row flex-nowrap justify-center ${
              isMobile ? "gap-6" : "gap-10"
            }`}
          >
            <Text
              style={tw`${
                isMobile ? "text-[5px]" : "text-xs"
              } text-[#003366] font-semibold`}
            >
              Dr. C. Luciano Mesa Sánchez
            </Text>
            <Text
              style={tw`${
                isMobile ? "text-[5px]" : "text-xs"
              } text-[#003366] font-semibold`}
            >
              Lic. Alain Hernández
            </Text>
            <Text
              style={tw`${
                isMobile ? "text-[5px]" : "text-xs"
              } text-[#003366] font-semibold`}
            >
              Est. Dániells Lázaro García Parra
            </Text>
            <Text
              style={tw`${
                isMobile ? "text-[5px]" : "text-xs"
              } text-[#003366] font-semibold`}
            >
              MSc. Yadel Camilo Mestre
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
