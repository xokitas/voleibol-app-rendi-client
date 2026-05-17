// app/index.tsx
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React from "react";
import { StatusBar, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import UserMenu from "../components/UserMenu";
import tw from "../lib/tailwind";

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={tw`flex-1 bg-[#F8F8FF]`}>
      <StatusBar barStyle="dark-content" />

      {/* Imagen de fondo que ocupa TODA la pantalla */}
      <Image
        source={require("../assets/images/fondo.png")}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.25, // ajusta la opacidad a tu gusto
        }}
        contentFit="contain" // muestra la imagen completa, sin recortar lados
      />

      {/* Contenido encima de la imagen */}
      <View style={tw`flex-1 justify-between items-center px-6 py-12`}>
        {/* Bloque superior centrado: icono + texto con áreas táctiles limpias */}
        <View
          style={tw`absolute top-10 left-0 right-0 items-center z-10`}
          pointerEvents="box-none"
        >
          {/* Icono: su contenedor no capturará toques */}
          <View
            style={tw`w-10 h-10 items-center justify-center`}
            pointerEvents="none"
          >
            <UserMenu />
          </View>
          {/* Texto presionable: recupera la recepción de eventos */}
          <TouchableOpacity
            onPress={() => router.push("/login")}
            style={tw`z-50 mt-1 px-4 py-2`}
          >
            <Text style={tw`text-[10px] font-black text-slate-400 uppercase`}>
              Iniciar Sesión
            </Text>
          </TouchableOpacity>
        </View>

        <View style={tw`flex-1 justify-center items-center w-full max-w-2xl`}>
          <View style={tw`items-center mb-16`}>
            <Text
              style={tw`text-7xl md:text-9xl font-black text-[#003366] p-8`}
            >
              RENDI
            </Text>
            <Text
              style={tw`text-xs md:text-base font-bold text-slate-400 uppercase mt-4`}
            >
              Voleibol Playa Cubano
            </Text>
          </View>

          <View style={tw`w-full max-w-md items-center`}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={tw`bg-[#003366] py-5 rounded-2xl shadow-xl items-center w-full mb-6`}
              onPress={() => router.push("/(tabs)/menu")}
            >
              <Text style={tw`text-white text-xl font-bold uppercase`}>
                Empezar a Anotar
              </Text>
            </TouchableOpacity>

            <Text
              style={tw`text-slate-400 text-xs text-center font-medium leading-5 px-8`}
            >
              Uso libre sin conexión. Inicia sesión en cualquier momento para
              sincronizar tus datos.
            </Text>
          </View>
        </View>

        {/* Pie de página con nombres alineados horizontalmente */}
        <View
          style={tw`w-full max-w-3xl items-center pt-8 border-t border-slate-200`}
        >
          <Text
            style={tw`text-[10px] font-black text-[#003366] mb-4 uppercase `}
          >
            Equipo Desarrollador
          </Text>
          <View style={tw`flex-row flex-nowrap justify-center gap-10 `}>
            <Text style={tw`text-xs text-[#003366] font-semibold`}>
              Dr. C. Luciano Mesa Sánchez
            </Text>
            <Text style={tw`text-xs text-[#003366] font-semibold`}>
              Lic. Alain Hernández
            </Text>
            <Text style={tw`text-xs text-[#003366] font-semibold`}>
              Est. Dániells Lázaro García Parra
            </Text>
            <Text style={tw`text-xs text-[#003366] font-semibold`}>
              MSc. Yadel Camilo Mestre
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
