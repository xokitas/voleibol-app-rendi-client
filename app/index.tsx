import { useRouter } from 'expo-router';
import React from 'react';
import { StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import tw from '../lib/tailwind';

// 1. Importamos el componente que creamos en la carpeta components
import UserMenu from '../components/UserMenu';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* 2. Colocamos el Menú aquí. 
          Como en su archivo de origen tiene "position: absolute", 
          se irá solito a la esquina superior derecha sin mover nada de la bienvenida.
      */}
      <UserMenu />

      <View style={styles.mainContent}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>RENDI</Text>
          <Text style={styles.subtitle}>Voleibol Playa Cubano</Text>
        </View>

        <View style={styles.buttonGroup}>
          <TouchableOpacity 
            activeOpacity={0.8}
            style={styles.primaryButton} 
            onPress={() => router.replace('/(tabs)/menu')} 
          >
            <Text style={styles.primaryButtonText}>Empezar a Anotar</Text>
          </TouchableOpacity>

          <Text style={styles.infoText}>
            Uso libre sin conexión. Inicia sesión en cualquier momento para sincronizar tus datos.
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerLabel}>Equipo Desarrollador</Text>
        <View style={styles.authorsList}>
          <Text style={styles.authorName}>Dr. C. Luciano Mesa Sánchez</Text>
          <Text style={styles.authorName}>Lic. Alain Hernández</Text>
          <Text style={styles.authorName}>Est. Dániells Lázaro García Parra</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

// Los estilos se mantienen igual que la versión "Wide & Premium" que te gustó
const styles = {
  container: tw`flex-1 bg-[#F8F8FF] justify-between items-center px-6 py-12`,
  mainContent: tw`flex-1 justify-center items-center w-full max-w-2xl`, 
  headerContainer: tw`items-center mb-16`,
  title: tw`text-7xl md:text-9xl font-black text-[#003366] tracking-tighter`,
  subtitle: tw`text-xs md:text-base font-bold text-slate-400 uppercase tracking-[0.5em] mt-4`,
  buttonGroup: tw`w-full max-w-md items-center`, 
  primaryButton: tw`bg-[#003366] py-5 rounded-2xl shadow-xl items-center w-full mb-6`,
  primaryButtonText: tw`text-white text-xl font-bold uppercase tracking-[0.2em]`,
  infoText: tw`text-slate-400 text-xs text-center font-medium leading-5 px-8`,
  footer: tw`w-full max-w-3xl items-center pt-8 border-t border-slate-200`,
  footerLabel: tw`text-[10px] font-black text-slate-400 mb-6 uppercase tracking-[0.4em]`,
  authorsList: tw`flex-row flex-wrap justify-center gap-x-8 gap-y-2`,
  authorName: tw`text-sm text-[#003366] font-semibold`,
};