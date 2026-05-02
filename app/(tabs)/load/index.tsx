import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import HeaderMenu from '../../../components/HeaderMenu';
import tw from '../../../lib/tailwind';

interface PendingMatch {
  id: string;
  type: string;
  match: string;
  progress: string;
}

const MOCK_PENDING: PendingMatch[] = [
  { id: '101', type: 'oficial', match: 'Equipo A vs Equipo B', progress: 'Set 2 (15-12)' },
  { id: '102', type: 'entrenamiento', match: 'Drills de Saque', progress: '40% completado' },
];

export default function LoadMatchScreen() {
  const { filter } = useLocalSearchParams();
  const router = useRouter();
  const [pending, setPending] = useState<PendingMatch[]>([]);

  useEffect(() => {
    const results = MOCK_PENDING.filter(item => item.type === filter);
    setPending(results);
  }, [filter]);

  return (
    <SafeAreaView style={tw`flex-1 bg-white`} edges={['top']}>
      <HeaderMenu 
        title={`CARGAR: ${String(filter).toUpperCase()}`}
        dark={false}
        showQuickNav={true}
        onBack={() => router.replace('/(tabs)/menu')}
      />

      <View style={tw`flex-1 p-5 pt-4`}>
        <Text style={tw`text-2xl font-black text-slate-400 uppercase tracking-tighter mb-6`}>
          Partidos Pendientes
        </Text>

        <FlatList
          data={pending}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={tw`bg-slate-50 p-4 rounded-2xl mb-3 border border-slate-100 shadow-sm`}>
              <Text style={tw`font-bold text-[#003366] text-lg`}>{item.match}</Text>
              <Text style={tw`text-orange-500 text-xs font-black uppercase`}>{item.progress}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={tw`text-center text-slate-400 mt-10`}>No hay sesiones para continuar</Text>
          }
        />
      </View>
    </SafeAreaView>
  );
}