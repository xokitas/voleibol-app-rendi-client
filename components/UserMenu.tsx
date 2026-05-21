// components/UserMenu.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Modal, Text, TouchableOpacity, View } from "react-native";
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

  const bgColor = dark ? "bg-slate-800" : "bg-white";
  const borderColor = dark ? "border-slate-700" : "border-slate-200";
  const iconColor = dark ? "#FFFFFF" : "#003366";

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
      {/* Botón gatillo (siempre visible) */}
      <View style={[tw`relative z-50`, { pointerEvents: "auto" }]}>
        <TouchableOpacity
          onPress={() => setIsVisible(true)}
          activeOpacity={0.7}
          style={tw`flex-row items-center ${bgColor} p-2 px-3 rounded-xl border ${borderColor} shadow-sm`}
        >
          <Ionicons name="person-circle-outline" size={24} color={iconColor} />
        </TouchableOpacity>
      </View>

      {/* Panel modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isVisible}
        onRequestClose={() => setIsVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.menuPanel}>
            {/* Cabecera */}
            <View style={styles.menuHeader}>
              <Text style={styles.menuTitle}>Mi Perfil</Text>
              <TouchableOpacity onPress={() => setIsVisible(false)}>
                <Ionicons name="close" size={28} color="#003366" />
              </TouchableOpacity>
            </View>

            {/* Contenido principal */}
            <View style={styles.menuContent}>
              {isAuthenticated ? (
                <>
                  <View style={styles.userStatus}>
                    <Ionicons name="person-circle" size={40} color="#003366" />
                    <Text style={styles.statusText}>{user?.email}</Text>
                    <Text style={styles.infoText}>Sesión activa</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.loginBtn}
                    onPress={() => alert("Mi perfil aún no implementado")}
                  >
                    <Text style={styles.loginBtnText}>Mi Perfil</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.settingsBtn}
                    onPress={handleLogout}
                  >
                    <Text style={styles.settingsBtnText}>Cerrar Sesión</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <View style={styles.userStatus}>
                    <Ionicons
                      name="cloud-offline-outline"
                      size={40}
                      color="#94A3B8"
                    />
                    <Text style={styles.statusText}>Modo Invitado</Text>
                    <Text style={styles.infoText}>
                      Tus datos se guardan localmente. Inicia sesión para
                      respaldarlos en la nube.
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.loginBtn}
                    onPress={handleLoginPress}
                  >
                    <Text style={styles.loginBtnText}>Iniciar Sesión</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.settingsBtn}
                    onPress={() => alert("Ajustes aún no disponibles")}
                  >
                    <Text style={styles.settingsBtnText}>Ajustes de App</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>

            {/* Versión al pie */}
            <Text style={styles.versionText}>RENDI v1.0.0</Text>
          </SafeAreaView>
        </View>
      </Modal>
    </>
  );
}

const styles = {
  modalOverlay: tw`flex-1 bg-black/40 justify-end md:justify-start md:items-end`,
  menuPanel: tw`bg-[#F8F8FF] w-full md:w-80 h-3/4 md:h-full rounded-t-3xl md:rounded-l-3xl p-6 shadow-2xl`,
  menuHeader: tw`flex-row justify-between items-center mb-10`,
  menuTitle: tw`text-xl font-black text-[#003366]`,
  menuContent: tw`flex-1`,
  userStatus: tw`items-center mb-8`,
  statusText: tw`text-lg font-bold text-slate-700 mt-2`,
  infoText: tw`text-xs text-slate-400 text-center mt-2 leading-4 px-4`,
  loginBtn: tw`bg-[#003366] py-4 rounded-xl items-center mb-4`,
  loginBtnText: tw`text-white font-bold uppercase`,
  settingsBtn: tw`border-2 border-[#003366] py-3 rounded-xl items-center`,
  settingsBtnText: tw`text-[#003366] font-bold`,
  versionText: tw`text-center text-[10px] text-slate-300 font-bold uppercase mt-4`,
};
