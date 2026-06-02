// components/UserMenu.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Modal,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import tw from "../lib/tailwind";
import { useAuthStore } from "../src/store/useAuthStore";

interface UserMenuProps {
  dark?: boolean;
  size?: number;
}

export default function UserMenu({ dark = false, size = 24 }: UserMenuProps) {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const { user, isAuthenticated, logout } = useAuthStore();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const bgColor = dark ? "bg-slate-800" : "bg-white";
  const borderColor = dark ? "border-slate-700" : "border-slate-200";
  const iconColor = dark ? "#FFFFFF" : "#003366";

  const authBgColor = isAuthenticated ? "bg-green-600" : bgColor;
  const authIconColor = isAuthenticated ? "#FFFFFF" : iconColor;
  const authBorderColor = isAuthenticated ? "border-green-700" : borderColor;

  const handleLoginPress = () => {
    setIsVisible(false);
    router.push("/login");
  };

  const handleLogout = () => {
    logout();
    setIsVisible(false);
  };

  return (
    <>
      <View style={[tw`relative z-50`, { pointerEvents: "auto" }]}>
        <TouchableOpacity
          onPress={() => setIsVisible(true)}
          activeOpacity={0.7}
          style={tw`flex-row items-center ${authBgColor} p-2 px-3 rounded-xl border ${authBorderColor} shadow-sm`}
        >
          <Ionicons
            name={isAuthenticated ? "person-circle" : "person-circle-outline"}
            size={24}
            color={authIconColor}
          />
          {isAuthenticated && (
            <View
              style={tw`absolute top-1 right-1 w-2.5 h-2.5 bg-green-400 rounded-full border border-white`}
            />
          )}
        </TouchableOpacity>
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isVisible}
        onRequestClose={() => setIsVisible(false)}
      >
        <View
          style={tw`flex-1 bg-black/40 justify-end md:justify-start md:items-end`}
        >
          <SafeAreaView
            style={tw`bg-[#F8F8FF] w-full md:w-80 ${
              isMobile ? "h-auto max-h-72" : "h-3/4 md:h-full"
            } rounded-t-3xl md:rounded-l-3xl ${isMobile ? "p-4" : "p-6"} shadow-2xl`}
          >
            <View
              style={tw`flex-row justify-between items-center ${isMobile ? "mb-4" : "mb-10"}`}
            >
              <Text
                style={tw`${isMobile ? "text-base" : "text-xl"} font-black text-[#003366]`}
              >
                Mi Perfil
              </Text>
              <TouchableOpacity onPress={() => setIsVisible(false)}>
                <Ionicons
                  name="close"
                  size={isMobile ? 22 : 28}
                  color="#003366"
                />
              </TouchableOpacity>
            </View>

            <View style={tw`flex-1`}>
              {isAuthenticated ? (
                <>
                  <View style={tw`items-center ${isMobile ? "mb-4" : "mb-8"}`}>
                    <Ionicons
                      name="person-circle"
                      size={isMobile ? 32 : 40}
                      color="#003366"
                    />
                    <Text
                      style={tw`${isMobile ? "text-sm" : "text-lg"} font-bold text-slate-700 mt-2`}
                    >
                      {user?.email}
                    </Text>
                    <Text
                      style={tw`${isMobile ? "text-[10px]" : "text-xs"} text-slate-400 text-center mt-1`}
                    >
                      Sesión activa
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={tw`bg-[#003366] ${isMobile ? "py-3" : "py-4"} rounded-xl items-center mb-4`}
                    onPress={() => alert("Mi perfil aún no implementado")}
                  >
                    <Text
                      style={tw`text-white font-bold ${isMobile ? "text-xs" : "text-base"} uppercase`}
                    >
                      Mi Perfil
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={tw`border-2 border-[#003366] ${isMobile ? "py-2" : "py-3"} rounded-xl items-center`}
                    onPress={handleLogout}
                  >
                    <Text
                      style={tw`text-[#003366] font-bold ${isMobile ? "text-xs" : "text-base"}`}
                    >
                      Cerrar Sesión
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <View style={tw`items-center ${isMobile ? "mb-4" : "mb-8"}`}>
                    <Ionicons
                      name="cloud-offline-outline"
                      size={isMobile ? 32 : 40}
                      color="#94A3B8"
                    />
                    <Text
                      style={tw`${isMobile ? "text-sm" : "text-lg"} font-bold text-slate-700 mt-2`}
                    >
                      Modo Invitado
                    </Text>
                    <Text
                      style={tw`${isMobile ? "text-[10px]" : "text-xs"} text-slate-400 text-center mt-1 leading-4 px-4`}
                    >
                      Tus datos se guardan localmente. Inicia sesión para
                      respaldarlos en el servidor.
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={tw`bg-[#003366] ${isMobile ? "py-3" : "py-4"} rounded-xl items-center mb-4`}
                    onPress={handleLoginPress}
                  >
                    <Text
                      style={tw`text-white font-bold ${isMobile ? "text-xs" : "text-base"} uppercase`}
                    >
                      Iniciar Sesión
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>

            <Text
              style={tw`text-center ${isMobile ? "text-[8px]" : "text-[10px]"} text-slate-300 font-bold uppercase mt-4`}
            >
              RENDI v1.0.0
            </Text>
          </SafeAreaView>
        </View>
      </Modal>
    </>
  );
}
