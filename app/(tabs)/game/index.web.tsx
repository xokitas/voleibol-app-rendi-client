import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import tw from '../../../lib/tailwind';

type ScoreValue = number | null;
interface GameState {
  scores: Record<string, ScoreValue>; 
  zones: Record<string, boolean>;    
}

export default function GameScreenWeb() {
  const router = useRouter();
  const { data } = useLocalSearchParams();
  const eventData = data ? JSON.parse(data as string) : null;

  const [gameState, setGameState] = useState<GameState>({
    scores: {},
    zones: {}
  });

  const handleScoreToggle = (playerNum: string, teamKey: string, actionKey: string) => {
    const key = `${teamKey}-${playerNum}-${actionKey}`;
    const current = gameState.scores[key];
    let next: ScoreValue = current === null ? 4 : (current > 0 ? current - 1 : null);
    setGameState(prev => ({ ...prev, scores: { ...prev.scores, [key]: next } }));
  };

  const handleZoneToggle = (playerNum: string, teamKey: string, zoneKey: string) => {
    const key = `${teamKey}-${playerNum}-${zoneKey}`;
    setGameState(prev => ({ ...prev, zones: { ...prev.zones, [key]: !prev.zones[key] } }));
  };

  const getCellBg = (value: ScoreValue) => {
    if (value === null) return 'bg-white';
    if (value >= 3) return 'bg-green-100';
    if (value === 2) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const sections = [
    { title: 'SERVICIO', subs: ['BAJ', 'FLO', 'SAL', 'SAF'], color: 'bg-cyan-50' },
    { title: 'RECEPCIÓN', subs: ['2ma', 'Ppm', 'P2a', 'P2b'], color: 'bg-green-50' },
    { title: 'ACOMODADA', subs: ['Rm', 'Rca'], color: 'bg-purple-50' },
    { title: 'ATAQUE', subs: ['Ub', 'Tr', 'Acd', 'Rdjn', 'Rdpmp', 'Rd'], color: 'bg-yellow-50' },
    { title: 'BLOQUEO', subs: ['Bl', 'Bd', 'Bn'], color: 'bg-red-50' },
    { title: 'DEFENSA', subs: ['Dd', 'Dltd', 'Ld', 'Cc'], color: 'bg-indigo-50' },
    { title: 'E.N. FORZADOS', subs: ['Ens', 'Enr', 'Enp', 'Enm'], color: 'bg-orange-50' },
  ];

  const renderTeamRows = (team: any, teamKey: string) => {
    const teamColor = teamKey === 'A' ? 'text-red-700' : 'text-blue-700';
    return (team?.players || [1, 2]).map((player: any) => {
      const pNum = player.number || player;
      return (
        <View key={`${teamKey}-${pNum}`} style={tw`flex-row`}>
          <View style={tw`w-14 h-10 border-r border-b border-slate-300 justify-center items-center bg-slate-50`}>
            <Text style={tw`font-black text-base ${teamColor}`}>{pNum}</Text>
          </View>
          {sections.flatMap(s => s.subs).map(sub => {
            const val = gameState.scores[`${teamKey}-${pNum}-${sub}`];
            return (
              <TouchableOpacity 
                key={sub}
                onPress={() => handleScoreToggle(pNum, teamKey, sub)}
                style={[tw`w-[42px] h-10 border-r border-b border-slate-300 justify-center items-center`, tw`${getCellBg(val)}`]}
              >
                <Text style={tw`text-sm font-bold ${val !== null ? 'text-slate-900' : 'text-slate-200'}`}>{val !== null ? val : '-'}</Text>
              </TouchableOpacity>
            );
          })}
          {['IZ-A', 'CE-A', 'DE-A', 'IZ-E', 'CE-E', 'DE-E'].map(z => {
            const active = gameState.zones[`${teamKey}-${pNum}-${z}`];
            return (
              <TouchableOpacity 
                key={z}
                onPress={() => handleZoneToggle(pNum, teamKey, z)}
                style={tw`w-[34px] h-10 border-r border-b border-slate-300 justify-center items-center ${active ? 'bg-blue-600' : 'bg-slate-50'}`}
              >
                <Text style={tw`text-[10px] font-bold ${active ? 'text-white' : 'text-slate-300'}`}>X</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      );
    });
  };

  return (
    <View style={tw`flex-1 bg-white`}>
      {/* HEADER RENDI */}
      <View style={tw`h-16 bg-[#003366] flex-row items-center justify-between px-6 z-50`}>
        <TouchableOpacity onPress={() => router.back()} style={tw`flex-row items-center`}>
          <Ionicons name="arrow-back" size={24} color="white" />
          <Text style={tw`text-white ml-2 font-medium`}>Atrás</Text>
        </TouchableOpacity>
        <Text style={tw`text-white text-2xl font-black tracking-widest`}>RENDI</Text>
        <View style={tw`flex-row items-center gap-4`}><Ionicons name="person-circle-outline" size={28} color="white" /><Ionicons name="menu" size={28} color="white" /></View>
      </View>

      {/* PANEL SUPERIOR: ORGANIZACIÓN DISPERSA */}
      <View style={tw`bg-slate-50 py-5 px-8 border-b border-slate-200 flex-row justify-between items-center`}>
        {/* IZQUIERDA: Tiempo Muerto y Cronómetros */}
        <View style={tw`flex-row gap-6 w-1/3 items-center`}>
          <TouchableOpacity style={tw`bg-slate-800 px-5 py-3 rounded-xl shadow-md flex-row items-center`}>
            <Ionicons name="pause-circle" size={18} color="white" style={tw`mr-2`} />
            <Text style={tw`text-white font-black text-xs uppercase tracking-tighter`}>Tiempo Muerto</Text>
          </TouchableOpacity>
          <View style={tw`flex-row gap-5`}>
            <View><Text style={tw`text-slate-400 text-[10px] font-black uppercase`}>Total</Text><Text style={tw`text-slate-800 font-mono font-bold text-base`}>00:00:00</Text></View>
            <View><Text style={tw`text-green-600 text-[10px] font-black uppercase`}>Real</Text><Text style={tw`text-green-700 font-mono font-bold text-base`}>00:00:00</Text></View>
          </View>
        </View>

        {/* CENTRO: Marcador y Evento */}
        <View style={tw`items-center flex-1`}>
          <Text style={tw`text-slate-400 font-black uppercase text-[10px] tracking-widest mb-2`}>{eventData?.type || 'COMPETENCIA OFICIAL'}</Text>
          <View style={tw`flex-row items-center gap-6`}>
            <Text style={tw`text-base font-black text-[#003366] text-right w-32 uppercase`}>{eventData?.teamA?.name || 'EQUIPO A'}</Text>
            <View style={tw`flex-row items-center bg-white border-2 border-slate-200 rounded-2xl px-8 py-3 shadow-sm`}>
              <Text style={tw`text-4xl font-black text-[#003366]`}>0</Text>
              <Text style={tw`text-2xl font-bold text-slate-200 mx-4`}>-</Text>
              <Text style={tw`text-4xl font-black text-[#003366]`}>0</Text>
            </View>
            <Text style={tw`text-base font-black text-[#003366] text-left w-32 uppercase`}>{eventData?.teamB?.name || 'EQUIPO B'}</Text>
          </View>
          <View style={tw`flex-row gap-12 mt-1`}><Text style={tw`text-red-600 font-black text-xs`}>SETS: 0</Text><Text style={tw`text-blue-600 font-black text-xs`}>SETS: 0</Text></View>
        </View>

        {/* DERECHA: Viento y Cambio de Cancha */}
        <View style={tw`flex-row items-center justify-end gap-4 w-1/3`}>
          <View style={tw`bg-slate-200 p-2 rounded-xl flex-row items-center`}>
            <Text style={tw`text-slate-500 font-black text-[10px] uppercase mr-3 ml-2`}>Viento</Text>
            <TouchableOpacity style={tw`bg-red-500 w-9 h-9 rounded-lg justify-center items-center mr-1.5 shadow-sm`}><Text style={tw`text-white font-bold`}>C</Text></TouchableOpacity>
            <TouchableOpacity style={tw`bg-green-500 w-9 h-9 rounded-lg justify-center items-center shadow-sm`}><Text style={tw`text-white font-bold`}>F</Text></TouchableOpacity>
          </View>
          <TouchableOpacity style={tw`bg-orange-500 px-5 py-3 rounded-xl shadow-md`}>
            <Text style={tw`text-white font-black text-xs uppercase`}>Cambio Cancha</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ÁREA DE REGISTRO (Ajuste "Justo") */}
      <View style={tw`flex-1 overflow-hidden`}>
        <View style={tw`flex-col`}>
          {/* Header Categorías */}
          <View style={tw`flex-row bg-slate-100 h-10`}>
            <View style={tw`w-14 border-r border-b border-slate-300 justify-center items-center`}><Text style={tw`text-[10px] font-bold`}>JUG</Text></View>
            {sections.map(s => (
              <View key={s.title} style={[tw`border-r border-b border-slate-300 justify-center items-center`, { width: s.subs.length * 42 }, tw`${s.color}`]}>
                <Text style={tw`text-[10px] font-black`}>{s.title}</Text>
              </View>
            ))}
            <View style={tw`w-[102px] bg-blue-100 border-r border-b border-slate-300 justify-center items-center`}><Text style={tw`text-[10px] font-black`}>Z.R.A</Text></View>
            <View style={tw`w-[102px] bg-blue-100 border-r border-b border-slate-300 justify-center items-center`}><Text style={tw`text-[10px] font-black`}>Z.RE.A</Text></View>
          </View>

          {/* Header Acciones (11px) */}
          <View style={tw`flex-row bg-slate-50 h-10`}>
            <View style={tw`w-14 border-r border-b border-slate-300`} />
            {sections.flatMap(s => s.subs).map(sub => (
              <View key={sub} style={tw`w-[42px] border-r border-b border-slate-300 justify-center items-center`}>
                <Text style={tw`text-[11px] font-black text-slate-600`}>{sub}</Text>
              </View>
            ))}
            {['IZ', 'CE', 'DE', 'IZ', 'CE', 'DE'].map((z, i) => (
              <View key={i} style={tw`w-[34px] border-r border-b border-slate-300 justify-center items-center`}><Text style={tw`text-[9px] font-bold text-blue-500`}>{z}</Text></View>
            ))}
          </View>

          {/* Cuerpo Equipos */}
          <View style={tw`bg-red-100/60 border-b border-red-200 py-2 px-4`}><Text style={tw`font-black text-red-900 uppercase text-xs tracking-wider`}>{eventData?.teamA?.name}</Text></View>
          {renderTeamRows(eventData?.teamA, 'A')}

          <View style={tw`bg-blue-100/60 border-b border-t border-blue-200 py-2 px-4 mt-3`}><Text style={tw`font-black text-blue-900 uppercase text-xs tracking-wider`}>{eventData?.teamB?.name}</Text></View>
          {renderTeamRows(eventData?.teamB, 'B')}
        </View>
      </View>

      {/* FOOTER: FINAL PARCIAL Y GUARDAR */}
      <View style={tw`p-5 bg-white border-t border-slate-200 flex-row justify-between items-center`}>
        <TouchableOpacity style={tw`bg-red-600 px-10 py-4 rounded-2xl shadow-lg`}><Text style={tw`text-white font-black uppercase text-sm`}>Final Parcial</Text></TouchableOpacity>
        
        <View style={tw`flex-row gap-4`}>
          <TouchableOpacity style={tw`bg-green-600 px-8 py-4 rounded-2xl shadow-md`}><Text style={tw`text-white font-bold text-sm uppercase`}>Final Set</Text></TouchableOpacity>
          <TouchableOpacity style={tw`bg-[#003366] px-12 py-4 rounded-2xl shadow-xl`}><Text style={tw`text-white font-black uppercase text-sm`}>Guardar Acción</Text></TouchableOpacity>
        </View>
      </View>
    </View>
  );
}