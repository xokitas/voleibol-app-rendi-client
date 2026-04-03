import { Ionicons } from '@expo/vector-icons'; // Viene incluido en Expo
import React, { useState } from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import tw from '../lib/tailwind';


export default function UserMenu() {
  const [isVisible, setIsVisible] = useState(false);

  // Función para cerrar el menú y simular acción
  const handleLogin = () => {
    console.log("Abriendo Login...");
    setIsVisible(false);
  };

  return (
    <>
      {/* --- BOTÓN GATILLO (El que siempre se ve) --- */}
      <TouchableOpacity 
        onPress={() => setIsVisible(true)}
        style={styles.triggerBtn}
      >
        <Ionicons name="person-circle-outline" size={32} color="#003366" />
      </TouchableOpacity>

      {/* --- PANEL PLEGABLE (Modal) --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isVisible}
        onRequestClose={() => setIsVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.menuPanel}>
            
            {/* Cabecera del Menú */}
            <View style={styles.menuHeader}>
              <Text style={styles.menuTitle}>Mi Perfil</Text>
              <TouchableOpacity onPress={() => setIsVisible(false)}>
                <Ionicons name="close" size={28} color="#003366" />
              </TouchableOpacity>
            </View>

            {/* Contenido del Menú */}
            <View style={styles.menuContent}>
              <View style={styles.userStatus}>
                <Ionicons name="cloud-offline-outline" size={40} color="#94A3B8" />
                <Text style={styles.statusText}>Modo Invitado</Text>
                <Text style={styles.infoText}>
                  Tus datos se guardan localmente. Inicia sesión para respaldarlos en la nube.
                </Text>
              </View>

              {/* Botón de Login (Azul Corporativo) */}
              <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
                <Text style={styles.loginBtnText}>Iniciar Sesión</Text>
              </TouchableOpacity>

              {/* Botón de Ajustes (Borde Azul) */}
              <TouchableOpacity style={styles.settingsBtn}>
                <Text style={styles.settingsBtnText}>Ajustes de App</Text>
              </TouchableOpacity>
            </View>

            {/* Versión al final */}
            <Text style={styles.versionText}>RENDI v1.0.0</Text>
          </SafeAreaView>
        </View>
      </Modal>
    </>
  );
}

// --- ESTILOS CON ARQUITECTURA LIMPIA ---
const styles = {
  triggerBtn: tw`absolute top-4 right-4 z-50 p-2 `,
  
  modalOverlay: tw`flex-1 bg-black/40 justify-end md:justify-start md:items-end`, // En móvil sube desde abajo, en web a la derecha
  
  menuPanel: tw`bg-[#F8F8FF] w-full md:w-80 h-3/4 md:h-full rounded-t-3xl md:rounded-l-3xl p-6 shadow-2xl`,
  
  menuHeader: tw`flex-row justify-between items-center mb-10`,
  menuTitle: tw`text-xl font-black text-[#003366] tracking-tight`,
  
  menuContent: tw`flex-1`,
  userStatus: tw`items-center mb-8`,
  statusText: tw`text-lg font-bold text-slate-700 mt-2`,
  infoText: tw`text-xs text-slate-400 text-center mt-2 leading-4 px-4`,
  
  loginBtn: tw`bg-[#003366] py-4 rounded-xl items-center mb-4`,
  loginBtnText: tw`text-white font-bold uppercase tracking-widest`,
  
  settingsBtn: tw`border-2 border-[#003366] py-3 rounded-xl items-center`,
  settingsBtnText: tw`text-[#003366] font-bold`,
  
  versionText: tw`text-center text-[10px] text-slate-300 font-bold uppercase tracking-widest mt-4`,
};