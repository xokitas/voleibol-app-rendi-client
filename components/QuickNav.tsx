import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import tw from '../lib/tailwind';

export default function QuickNav() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const navigateTo = (route: any) => {
    setIsOpen(false);
    router.push(route);
  };

  return (
    <View style={tw`absolute top-4 right-16 z-50`}>
      {/* Botón Estilo Hamburguesa - Unificado con UserMenu */}
      <TouchableOpacity 
        onPress={() => setIsOpen(!isOpen)}
        activeOpacity={0.7}
        style={tw`flex-row items-center bg-white p-2 px-3 rounded-xl border border-slate-200 shadow-sm`}
      >
        <Ionicons name="menu-outline" size={24} color="#003366" />
        {/* Si quieres que sea idéntico al de login, puedes añadir un texto pequeño opcional */}
      </TouchableOpacity>

      {/* Menú Desplegable con Estilo Limpio */}
      {isOpen && (
        <View style={tw`absolute top-12 right-0 bg-white rounded-2xl shadow-xl border border-slate-100 w-52 overflow-hidden`}>
          
          <View style={tw`bg-slate-50 p-3 border-b border-slate-100`}>
            <Text style={tw`text-[10px] font-black text-slate-400 uppercase tracking-tighter`}>Navegación Rápida</Text>
          </View>

          <TouchableOpacity 
            onPress={() => navigateTo('/(tabs)/menu' as any)} 
            style={tw`flex-row items-center p-4 border-b border-slate-50 active:bg-slate-50`}
          >
            <Ionicons name="add-circle-sharp" size={20} color="#003366" />
            <Text style={tw`ml-3 text-sm font-bold text-slate-700`}>Anotar Partido</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => navigateTo('/(tabs)/results' as any)} 
            style={tw`flex-row items-center p-4 border-b border-slate-50 active:bg-slate-50`}
          >
            <Ionicons name="stats-chart-sharp" size={20} color="#003366" />
            <Text style={tw`ml-3 text-sm font-bold text-slate-700`}>Resultados</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => navigateTo('/(tabs)/load' as any)} 
            style={tw`flex-row items-center p-4 active:bg-slate-50`}
          >
            <Ionicons name="cloud-download-sharp" size={20} color="#003366" />
            <Text style={tw`ml-3 text-sm font-bold text-slate-700`}>Cargar Datos</Text>
          </TouchableOpacity>
          
        </View>
      )}
    </View>
  );
}