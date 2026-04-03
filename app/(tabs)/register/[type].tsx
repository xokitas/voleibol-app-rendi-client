import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import QuickNav from '../../../components/QuickNav';
import UserMenu from '../../../components/UserMenu';
import tw from '../../../lib/tailwind';

// Componente para las filas de inputs compartidos (Estilo tu prototipo)
const FormRow = ({ children }: { children: React.ReactNode }) => (
  <View style={tw`flex-row gap-3 mb-4`}>{children}</View>
);

export default function RegisterDataScreen() {
  const { type } = useLocalSearchParams();
  const router = useRouter();

  // Estados basados en tu Django Models
  const [formData, setFormData] = useState({
    denomination: '', place: '', category: '', sex: 'M',
    date: new Date().toLocaleDateString(),
    start_time: '12:00',
    objective: '',
    meso: 'ENT', micro: 'ORD', micro_num: '1', week_day: 'LUN'
  });

  // Estado para los jugadores (2 por equipo como en tu prototipo)
  const [teamA, setTeamA] = useState('Equipo A');
  const [teamB, setTeamB] = useState('Equipo B');
  
  const initialPlayers = [
    { number: '1', fullName: '', position: 'B', zone: 'CEN' },
    { number: '2', fullName: '', position: 'D', zone: 'CEN' },
  ];

  const [playersA, setPlayersA] = useState(initialPlayers);
  const [playersB, setPlayersB] = useState(initialPlayers);

  const updatePlayer = (team: 'A' | 'B', index: number, field: string, value: string) => {
    const setter = team === 'A' ? setPlayersA : setPlayersB;
    const players = team === 'A' ? [...playersA] : [...playersB];
    // @ts-ignore
    players[index][field] = value;
    setter(players);
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-white`} edges={['top']}>
      {/* BOTÓN VOLVER (Esquina Superior Izquierda) */}
    <TouchableOpacity 
      onPress={() => router.back()}
      style={tw`absolute top-4 left-4 z-50 bg-white p-2 rounded-full shadow-sm border border-slate-100 flex-row items-center px-3`}
    >
      <Ionicons name="chevron-back" size={20} color="#003366" />
      <Text style={tw`text-[#003366] font-bold ml-1 text-xs uppercase`}>Menú</Text>
    </TouchableOpacity>
      <UserMenu />
      <QuickNav />

      <ScrollView contentContainerStyle={tw`p-5 pb-20`}>
        {/* TÍTULO ESTILO PROTOTIPO */}
        <Text style={tw`text-2xl font-black text-[#003366] text-center mb-6 uppercase`}>
          {type === 'oficial' ? 'Competencia Oficial' : `Control ${type}`}
        </Text>

        {/* --- SECCIÓN 1: DATOS GENERALES (Mapeado a Django) --- */}
        {type === 'oficial' ? (
          <>
            <FormRow>
              <TextInput style={tw`flex-1 border border-slate-300 rounded-lg p-3 h-12 bg-slate-50`} placeholder="Denominación" value={formData.denomination} />
              <TextInput style={tw`flex-1 border border-slate-300 rounded-lg p-3 h-12 bg-slate-50`} placeholder="Fecha" value={formData.date} />
            </FormRow>
            <FormRow>
              <TextInput style={tw`flex-1 border border-slate-300 rounded-lg p-3 h-12 bg-slate-50`} placeholder="Hora Inicio" value={formData.start_time} />
              <TextInput style={tw`flex-1 border border-slate-300 rounded-lg p-3 h-12 bg-slate-50`} placeholder="Lugar" value={formData.place} />
            </FormRow>
          </>
        ) : (
          <>
            <FormRow>
              <TextInput style={tw`flex-1 border border-slate-300 rounded-lg p-3 h-12 bg-slate-50`} placeholder="Mesociclo" value={formData.meso} />
              <TextInput style={tw`flex-1 border border-slate-300 rounded-lg p-3 h-12 bg-slate-50`} placeholder="Microciclo" value={formData.micro} />
            </FormRow>
            <FormRow>
              <TextInput style={tw`w-1/3 border border-slate-300 rounded-lg p-3 h-12 bg-slate-50`} placeholder="No. Micro" value={formData.micro_num} keyboardType="numeric" />
              <TextInput style={tw`flex-1 border border-slate-300 rounded-lg p-3 h-12 bg-slate-50`} placeholder="Objetivo" value={formData.objective} />
            </FormRow>
          </>
        )}

        <FormRow>
          <View style={tw`flex-1 border border-slate-300 rounded-lg bg-slate-50 justify-center px-3 h-12`}>
            <Text style={tw`text-slate-500`}>Categoría: Juvenil</Text>
          </View>
          <View style={tw`flex-1 border border-slate-300 rounded-lg bg-slate-50 justify-center px-3 h-12`}>
            <Text style={tw`text-slate-500`}>Sexo: Masculino</Text>
          </View>
        </FormRow>

        {/* --- SECCIÓN 2: EQUIPOS --- */}
        <View style={tw`flex-row items-center gap-3 my-4`}>
          <TextInput style={tw`flex-1 border-b-2 border-[#003366] p-2 text-lg font-bold`} placeholder="Equipo A" value={teamA} onChangeText={setTeamA} />
          <Text style={tw`font-black text-lg`}>VS</Text>
          <TextInput style={tw`flex-1 border-b-2 border-[#003366] p-2 text-lg font-bold text-right`} placeholder="Equipo B" value={teamB} onChangeText={setTeamB} />
        </View>

        {/* --- SECCIÓN 3: TABLAS DE JUGADORES (EQUIPO A) --- */}
        <Text style={tw`text-[#003366] font-bold mb-2`}>Jugadores {teamA}</Text>
        <View style={tw`bg-slate-200 flex-row p-2 rounded-t-lg`}>
          <Text style={tw`w-10 font-bold text-[10px] text-center`}>No</Text>
          <Text style={tw`flex-1 font-bold text-[10px] ml-2`}>Nombre y Apellidos</Text>
          <Text style={tw`w-16 font-bold text-[10px] text-center`}>Pos.</Text>
          <Text style={tw`w-16 font-bold text-[10px] text-center`}>Zona</Text>
        </View>
        {playersA.map((p, i) => (
          <View key={i} style={tw`flex-row border-x border-b border-slate-200 p-1 bg-white`}>
            <TextInput style={tw`w-10 text-center border border-slate-100 rounded`} value={p.number} onChangeText={(v) => updatePlayer('A', i, 'number', v)} />
            <TextInput style={tw`flex-1 ml-2 border border-slate-100 rounded px-2`} placeholder="Nombre..." value={p.fullName} onChangeText={(v) => updatePlayer('A', i, 'fullName', v)} />
            <TextInput style={tw`w-16 text-center border border-slate-100 rounded mx-1`} value={p.position} onChangeText={(v) => updatePlayer('A', i, 'position', v)} />
            <TextInput style={tw`w-16 text-center border border-slate-100 rounded`} value={p.zone} onChangeText={(v) => updatePlayer('A', i, 'zone', v)} />
          </View>
        ))}

        {/* --- SECCIÓN 4: TABLAS DE JUGADORES (EQUIPO B) --- */}
        <Text style={tw`text-[#003366] font-bold mt-6 mb-2`}>Jugadores {teamB}</Text>
        <View style={tw`bg-slate-200 flex-row p-2 rounded-t-lg`}>
          <Text style={tw`w-10 font-bold text-[10px] text-center`}>No</Text>
          <Text style={tw`flex-1 font-bold text-[10px] ml-2`}>Nombre y Apellidos</Text>
          <Text style={tw`w-16 font-bold text-[10px] text-center`}>Pos.</Text>
          <Text style={tw`w-16 font-bold text-[10px] text-center`}>Zona</Text>
        </View>
        {playersB.map((p, i) => (
          <View key={i} style={tw`flex-row border-x border-b border-slate-200 p-1 bg-white`}>
            <TextInput style={tw`w-10 text-center border border-slate-100 rounded`} value={p.number} onChangeText={(v) => updatePlayer('B', i, 'number', v)} />
            <TextInput style={tw`flex-1 ml-2 border border-slate-100 rounded px-2`} placeholder="Nombre..." value={p.fullName} onChangeText={(v) => updatePlayer('B', i, 'fullName', v)} />
            <TextInput style={tw`w-16 text-center border border-slate-100 rounded mx-1`} value={p.position} onChangeText={(v) => updatePlayer('B', i, 'position', v)} />
            <TextInput style={tw`w-16 text-center border border-slate-100 rounded`} value={p.zone} onChangeText={(v) => updatePlayer('B', i, 'zone', v)} />
          </View>
        ))}

        {/* BOTÓN SIGUIENTE */}
        <TouchableOpacity 
          style={tw`bg-[#003366] p-4 rounded-xl mt-10 items-center`}
          onPress={() => router.push('/GameScreen' as any)}
        >
          <Text style={tw`text-white font-bold text-lg`}>SIGUIENTE</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}