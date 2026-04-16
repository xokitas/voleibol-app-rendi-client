import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import tw from '../lib/tailwind';

interface QuickNavProps {
  onNavigate?: (route: string) => void;
  dark?: boolean; // Prop para controlar el tema
}

export default function QuickNav({ onNavigate, dark = false }: QuickNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const navigateTo = (route: string) => {
    setIsOpen(false);

    if (onNavigate) {
      onNavigate(route);
    } else {
      router.replace(route as any);
  };
}

  // Definimos colores basados en el tema
  const bgColor = dark ? 'bg-slate-800' : 'bg-white';
  const borderColor = dark ? 'border-slate-700' : 'border-slate-200';
  const iconColor = dark ? '#FFFFFF' : '#003366';

  return (
    <View style={tw`relative z-50`}>
      <TouchableOpacity 
        onPress={() => setIsOpen(!isOpen)}
        activeOpacity={0.7}
        style={tw`flex-row items-center ${bgColor} p-2 px-3 rounded-xl border ${borderColor} shadow-sm`}
      >
        <Ionicons name="menu-outline" size={24} color={iconColor} />
      </TouchableOpacity>

      {isOpen && (
        <View style={tw` top-12 right-0 bg-white rounded-2xl shadow-xl border border-slate-100 w-52 overflow-hidden`}>
          <View style={tw`bg-slate-50 p-3 border-b border-slate-100`}>
            <Text style={tw`text-[10px] font-black text-slate-400 uppercase tracking-tighter`}>Navegación Rápida</Text>
          </View>
          <TouchableOpacity onPress={() => navigateTo('/(tabs)/menu')} style={tw`flex-row items-center p-4 border-b border-slate-50 active:bg-slate-50`}>
            <Ionicons name="add-circle-sharp" size={20} color="#003366" />
            <Text style={tw`ml-3 text-sm font-bold text-slate-700`}>Anotar Partido</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigateTo('/(tabs)/results')} style={tw`flex-row items-center p-4 border-b border-slate-50 active:bg-slate-50`}>
            <Ionicons name="stats-chart-sharp" size={20} color="#003366" />
            <Text style={tw`ml-3 text-sm font-bold text-slate-700`}>Resultados</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigateTo('/(tabs)/load')} style={tw`flex-row items-center p-4 active:bg-slate-50`}>
            <Ionicons name="cloud-download-sharp" size={20} color="#003366" />
            <Text style={tw`ml-3 text-sm font-bold text-slate-700`}>Cargar Datos</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}