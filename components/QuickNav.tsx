import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Modal, Pressable, Text, TouchableOpacity, View } from 'react-native';
import tw from '../lib/tailwind';

export default function QuickNav({ onNavigate, dark = false }: { onNavigate?: (route: string) => void, dark?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasSavedGame, setHasSavedGame] = useState(false);
  
  const router = useRouter();
  const pathname = usePathname();
  const isCurrentlyInGame = pathname.includes('game');

  useEffect(() => {
    if (isOpen) {
      const savedGame = localStorage.getItem('rendi_active_game');
      setHasSavedGame(!!savedGame);
    }
  }, [isOpen]);

  const navigateTo = (route: string) => {
    setIsOpen(false);
    if (onNavigate) onNavigate(route);
    else router.replace(route as any);
  };

  const menuBg = dark ? 'bg-slate-800' : 'bg-slate-100';
  const itemBorder = dark ? 'border-slate-700' : 'border-slate-200';
  const textColor = dark ? 'text-slate-200' : 'text-slate-600';
  const iconColor = dark ? '#94a3b8' : '#64748b';

  return (
    <View>
      <TouchableOpacity 
        onPress={() => setIsOpen(true)} 
        style={tw`p-2 rounded-xl ${dark ? 'bg-slate-800' : 'bg-slate-200'}`}
      >
        <Ionicons name="menu" size={24} color={dark ? 'white' : '#003366'} />
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent={true}
        animationType="none"
        onRequestClose={() => setIsOpen(false)}
      >
        {/* Este Pressable detecta el clic fuera y cierra el menú */}
        <Pressable 
          style={tw`flex-1`} 
          onPress={() => setIsOpen(false)} 
        >
          <View style={[tw`absolute top-20 right-6 w-56 ${menuBg} rounded-xl shadow-2xl border ${itemBorder} overflow-hidden`]}>
            
            {hasSavedGame && !isCurrentlyInGame && (
              <TouchableOpacity 
                onPress={() => navigateTo('/(tabs)/game')}
                style={tw`flex-row items-center p-4 border-b ${itemBorder} bg-slate-700/10`}
              >
                <Ionicons name="play" size={20} color="#eab308" />
                <Text style={tw`ml-3 font-black text-yellow-500`}>Volver al Juego</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity onPress={() => navigateTo('/(tabs)/menu')} style={tw`flex-row items-center p-4 border-b ${itemBorder}`}>
              <Ionicons name="home-outline" size={20} color={iconColor} />
              <Text style={tw`ml-3 font-bold ${textColor}`}>Inicio</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigateTo('/(tabs)/results')} style={tw`flex-row items-center p-4 border-b ${itemBorder}`}>
              <Ionicons name="stats-chart-outline" size={20} color={iconColor} />
              <Text style={tw`ml-3 font-bold ${textColor}`}>Resultados</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigateTo('/(tabs)/load')} style={tw`flex-row items-center p-4`}>
              <Ionicons name="cloud-download-outline" size={20} color={iconColor} />
              <Text style={tw`ml-3 font-bold ${textColor}`}>Cargar Partido</Text>
            </TouchableOpacity>

          </View>
        </Pressable>
      </Modal>
    </View>
  );
}