import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Platform, ScrollView, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import QuickNav from '../../../components/QuickNav';
import UserMenu from '../../../components/UserMenu';
import tw from '../../../lib/tailwind';

// --- 1. COMPONENTE PARA FILAS ---
const FormRow = ({ children, zIndex }: { children: React.ReactNode, zIndex?: number }) => (
  <View style={[tw`flex-row gap-3 mb-4`, { zIndex: zIndex || 1, elevation: zIndex || 1 }]}>
    {children}
  </View>
);

// --- 2. COMPONENTE PARA TEXTO ---
const SmartInput = ({ label, value, onChangeText, keyboardType = 'default' }: any) => {
  const { width } = useWindowDimensions();
  const isPC = width >= 768;
  return (
    <View style={tw`flex-1 flex-row items-center border border-slate-300 rounded-lg h-12 bg-slate-50 px-3`}>
      {isPC && <Text style={tw`font-bold text-[#003366] text-xs mr-2 uppercase`}>{label}:</Text>}
      <TextInput 
        style={tw`flex-1 h-full text-slate-700 text-sm`} 
        value={value} 
        placeholder={isPC ? "" : label} 
        placeholderTextColor="#94A3B8" 
        onChangeText={onChangeText} 
        keyboardType={keyboardType} 
      />
    </View>
  );
};

// --- 3. SELECTOR ESTILIZADO (Sustituye al Picker feo) ---
const SmartSelect = ({ label, options, value, onSelect }: any) => {
  const { width } = useWindowDimensions();
  const isPC = width >= 768;
  const [open, setOpen] = useState(false);

  return (
    <View style={{ flex: 1, zIndex: 100 }}> 
      <TouchableOpacity 
        onPress={() => setOpen(!open)}
        activeOpacity={0.8}
        style={tw`flex-row items-center border border-slate-300 rounded-lg h-12 bg-slate-50 px-3`}
      >
        {isPC && <Text style={tw`font-bold text-[#003366] text-xs mr-2 uppercase`}>{label}:</Text>}
        <Text style={tw`text-slate-700 text-sm flex-1`}>{value || (isPC ? "Seleccionar" : label)}</Text>
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={14} color="#003366" />
      </TouchableOpacity>

      {open && (
        <View style={[
          tw`absolute left-0 right-0 bg-white border border-slate-300 rounded-lg shadow-xl`,
          { top: 50, zIndex: 999, elevation: 10 }
        ]}>
          {options.map((opt: string) => (
            <TouchableOpacity 
              key={opt} 
              onPress={() => { onSelect(opt); setOpen(false); }}
              style={tw`p-4 border-b border-slate-100 active:bg-slate-100`}
            >
              <Text style={tw`text-slate-700 text-sm font-medium`}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

// --- 4. FECHA Y HORA (Corregido el error de no abrirse) ---
const SmartDateTime = ({ label, value, mode, onChange }: any) => {
  const { width } = useWindowDimensions();
  const isPC = width >= 768;
  const [show, setShow] = useState(false);

  // Detectamos si es Web para usar el input nativo del navegador
  if (Platform.OS === 'web') {
    return (
      <View style={tw`flex-1 flex-row items-center border border-slate-300 rounded-lg h-12 bg-slate-50 px-3`}>
        {isPC && <Text style={tw`font-bold text-[#003366] text-xs mr-2 uppercase`}>{label}:</Text>}
        <input
          type={mode === 'date' ? 'date' : 'time'}
          style={{
            flex: 1,
            border: 'none',
            backgroundColor: 'transparent',
            color: '#334155',
            fontSize: '14px',
            outline: 'none',
          }}
          // Formateo de fecha para que el input HTML lo entienda (YYYY-MM-DD)
          value={value instanceof Date ? (mode === 'date' ? value.toISOString().split('T')[0] : value.toTimeString().substring(0,5)) : ""}
          onChange={(e) => {
            const val = e.target.value;
            if (!val) return;
            const newDate = new Date(value);
            if (mode === 'date') {
              const [y, m, d] = val.split('-').map(Number);
              newDate.setFullYear(y, m - 1, d);
            } else {
              const [h, min] = val.split(':').map(Number);
              newDate.setHours(h, min);
            }
            onChange(newDate);
          }}
        />
      </View>
    );
  }

  // --- CÓDIGO PARA MÓVIL (Android/iOS) ---
  return (
    <View style={tw`flex-1`}>
      <TouchableOpacity 
        onPress={() => setShow(true)}
        activeOpacity={0.7}
        style={tw`flex-row items-center border border-slate-300 rounded-lg h-12 bg-slate-50 px-3`}
      >
        {isPC && <Text style={tw`font-bold text-[#003366] text-xs mr-2 uppercase`}>{label}:</Text>}
        <Text style={tw`text-slate-700 text-sm`}>
          {value instanceof Date 
            ? (mode === 'date' ? value.toLocaleDateString() : value.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})) 
            : label}
        </Text>
      </TouchableOpacity>

      {show && (
        <DateTimePicker 
          value={value instanceof Date ? value : new Date()} 
          mode={mode} 
          display={Platform.OS === 'ios' ? 'spinner' : (mode === 'date' ? 'calendar' : 'clock')} 
          onChange={(event, selectedDate) => {
            setShow(false); 
            if (selectedDate) onChange(selectedDate);
          }} 
        />
      )}
    </View>
  );
};

export default function RegisterDataScreen() {
  const { type } = useLocalSearchParams();
  const router = useRouter();

  const [formData, setFormData] = useState({
    denomination: '', place: '', category: 'Juvenil', sex: 'Masculino',
    date: new Date(),
    start_time: new Date(),
    objective: '',
    meso: 'ENT', micro: 'ORD', micro_num: '1', week_day: 'LUN'
  });

  const updateForm = (key: string, value: any) => setFormData(prev => ({ ...prev, [key]: value }));

  const [teamA, setTeamA] = useState('Equipo A');
  const [teamB, setTeamB] = useState('Equipo B');
  const initialPlayers = [{ number: '1', fullName: '', position: 'B', zone: 'CEN' }, { number: '2', fullName: '', position: 'D', zone: 'CEN' }];
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
      
      {/* BOTÓN ATRÁS ORIGINAL */}
      <TouchableOpacity 
        onPress={() => router.back()} 
        style={tw`absolute top-4 left-4 z-50 bg-white p-2 rounded-full shadow-sm border border-slate-100 flex-row items-center px-3`}
      >
        <Ionicons name="chevron-back" size={20} color="#003366" />
        <Text style={tw`text-[#003366] font-bold ml-1 text-xs uppercase`}>Menú</Text>
      </TouchableOpacity>
      
      {/* COMPONENTES ORIGINALES */}
      <UserMenu />
      <QuickNav />

      {/* --- CONTENIDO DEL FORMULARIO --- */}
      
      <ScrollView contentContainerStyle={tw`p-5 pt-16 pb-20`} style={{ flex: 1 }}>
        <Text style={tw`text-2xl font-black text-[#003366] text-center mb-6 uppercase`}>
          {type === 'oficial' ? 'Competencia Oficial' : `Control ${type}`}
        </Text>

        {type === 'oficial' ? (
          <>
            <FormRow zIndex={50}>
              <SmartInput label="Denominación" value={formData.denomination} onChangeText={(v:any) => updateForm('denomination', v)} />
              <SmartDateTime label="Fecha" mode="date" value={formData.date} onChange={(v:any) => updateForm('date', v)} />
            </FormRow>
            <FormRow zIndex={40}>
              <SmartDateTime label="Hora Inicio" mode="time" value={formData.start_time} onChange={(v:any) => updateForm('start_time', v)} />
              <SmartInput label="Lugar" value={formData.place} onChangeText={(v:any) => updateForm('place', v)} />
            </FormRow>
          </>
        ) : (
          <>
            <FormRow zIndex={50}>
              <SmartInput label="Mesociclo" value={formData.meso} onChangeText={(v:any) => updateForm('meso', v)} />
              <SmartInput label="Microciclo" value={formData.micro} onChangeText={(v:any) => updateForm('micro', v)} />
            </FormRow>
            <FormRow zIndex={40}>
              <SmartInput label="No. Micro" value={formData.micro_num} keyboardType="numeric" onChangeText={(v:any) => updateForm('micro_num', v)} />
              <SmartInput label="Objetivo" value={formData.objective} onChangeText={(v:any) => updateForm('objective', v)} />
            </FormRow>
          </>
        )}

        <FormRow zIndex={30}>
          <SmartSelect label="Categoría" options={['Escolar', 'Juvenil', 'Mayores']} value={formData.category} onSelect={(v:any) => updateForm('category', v)} />
          <SmartSelect label="Sexo" options={['Masculino', 'Femenino']} value={formData.sex} onSelect={(v:any) => updateForm('sex', v)} />
        </FormRow>

        {/* --- SECCIÓN EQUIPOS --- */}
        <View style={tw`flex-row items-center gap-3 my-4`}>
          <TextInput style={tw`flex-1 border-b-2 border-[#003366] p-2 text-lg font-bold`} placeholder="Equipo A" value={teamA} onChangeText={setTeamA} />
          <Text style={tw`font-black text-lg`}>VS</Text>
          <TextInput style={tw`flex-1 border-b-2 border-[#003366] p-2 text-lg font-bold text-right`} placeholder="Equipo B" value={teamB} onChangeText={setTeamB} />
        </View>

        {/* --- TABLAS DE JUGADORES --- */}
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

        <TouchableOpacity style={tw`bg-[#003366] p-4 rounded-xl mt-10 items-center`} onPress={() => router.push('/GameScreen' as any)}>
          <Text style={tw`text-white font-bold text-lg uppercase`}>SIGUIENTE</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}