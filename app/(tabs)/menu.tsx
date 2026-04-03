import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router'; // Necesario para navegar
import React, { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import UserMenu from '../../components/UserMenu';
import tw from '../../lib/tailwind';

export default function MenuScreen() {
  const router = useRouter(); // Instanciamos el router
  const [activeTab, setActiveTab] = useState<string | null>(null);

  const typeOptions = [
    { id: 'oficial', label: 'Competencia oficial', icon: 'trophy-outline' },
    { id: 'interno', label: 'Control interno', icon: 'clipboard-outline' },
    { id: 'entrenamiento', label: 'Entrenamiento', icon: 'fitness-outline' },
    { id: 'externo', label: 'Control externo', icon: 'earth-outline' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* El menú plegable de usuario (derecha) */}
      <UserMenu />

      {/* --- HEADER SUPERIOR (Atrás + Título) --- */}
      <View style={styles.topBar}>
        <TouchableOpacity 
          onPress={() => router.replace('/')} // Volvemos a la raíz (Bienvenida)
          activeOpacity={0.7}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={28} color="#003366" />
        </TouchableOpacity>
        
        <View>
          <Text style={styles.topBarTitle}>Menú de Opciones</Text>
          <View style={styles.accentLineSmall} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Título de Bienvenida al Menú */}
        <View style={styles.header}>
          <Text style={styles.title}>¿Qué deseas hacer hoy?</Text>
        </View>

        {/* Fila de 3 botones principales */}
        <View style={styles.mainRow}>
          <TouchableOpacity 
            style={[styles.mainBtn, activeTab === 'reg' && styles.mainBtnActive]}
            onPress={() => setActiveTab(activeTab === 'reg' ? null : 'reg')}
          >
            <Ionicons name="add-circle" size={24} color={activeTab === 'reg' ? "#FFF" : "#003366"} />
            <Text style={[styles.mainBtnText, activeTab === 'reg' && styles.textWhite]}>Registrar Datos</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.mainBtn, activeTab === 'vis' && styles.mainBtnActive]}
            onPress={() => setActiveTab(activeTab === 'vis' ? null : 'vis')}
          >
            <Ionicons name="eye" size={24} color={activeTab === 'vis' ? "#FFF" : "#003366"} />
            <Text style={[styles.mainBtnText, activeTab === 'vis' && styles.textWhite]}>Visualizar Resultados</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.mainBtn, activeTab === 'load' && styles.mainBtnActive]}
            onPress={() => setActiveTab(activeTab === 'load' ? null : 'load')}
          >
            <Ionicons name="cloud-upload" size={24} color={activeTab === 'load' ? "#FFF" : "#003366"} />
            <Text style={[styles.mainBtnText, activeTab === 'load' && styles.textWhite]}>Cargar Partido</Text>
          </TouchableOpacity>
        </View>

        {/* Desplegable dinámico */}
        {activeTab && (
          <View style={styles.dropdownContainer}>
            <Text style={styles.dropdownTitle}>
              Seleccione modalidad:
            </Text>
            {typeOptions.map((option) => (
              <TouchableOpacity 
                key={option.id}
                style={styles.dropItem} 
                activeOpacity={0.6}
                onPress={() => router.push(`/(tabs)/register/${option.id}` as any)}>
                
                <Ionicons name={option.icon as any} size={20} color="#003366" />
                <Text style={styles.dropText}>{option.label}</Text>
                <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = {
  container: tw`flex-1 bg-[#F8F8FF]`,
  
  // Estilos de la barra superior
  topBar: tw`flex-row items-center px-6 pt-4 pb-2`,
  backButton: tw`mr-4 p-1`,
  topBarTitle: tw`text-base font-black text-[#003366] uppercase tracking-[0.1em]`,
  accentLineSmall: tw`w-6 h-0.5 bg-[#FFCC00] mt-0.5`,

  scrollContent: tw`p-6 pt-4`,
  header: tw`mb-8`,
  title: tw`text-2xl font-black text-slate-400 uppercase tracking-tighter`, // Un gris elegante para no competir con el header

  mainRow: tw`flex-row justify-between gap-2 mb-8`,
  mainBtn: tw`bg-white border border-slate-200 p-4 rounded-2xl items-center flex-1 shadow-sm h-28 justify-center`,
  mainBtnActive: tw`bg-[#003366] border-[#003366] shadow-md`,
  mainBtnText: tw`text-[11px] font-black text-[#003366] mt-3 uppercase text-center leading-3`,
  textWhite: tw`text-white`,

  dropdownContainer: tw`bg-white rounded-3xl p-4 border border-slate-100 shadow-sm`,
  dropdownTitle: tw`text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 ml-2`,
  dropItem: tw`flex-row items-center bg-slate-50 p-4 rounded-xl mb-2 border border-slate-100`,
  dropText: tw`flex-1 ml-4 text-slate-700 font-semibold text-sm`,
};