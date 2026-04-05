import { useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import tw from '../../../lib/tailwind';

// --- TYPES & INTERFACES ---
type ScoreValue = number | null;

interface GameState {
  scores: Record<string, ScoreValue>; 
  zones: Record<string, boolean>;    
}

export default function GameScreenWeb() {
  const { data } = useLocalSearchParams();
  const eventData = data ? JSON.parse(data as string) : null;

  const [gameState, setGameState] = useState<GameState>({
    scores: {},
    zones: {}
  });

  // --- LOGIC ---
  const handleScoreToggle = (playerNum: string, actionKey: string) => {
    const key = `${playerNum}-${actionKey}`;
    const current = gameState.scores[key];
    
    let next: ScoreValue = null;
    if (current === null) next = 4;
    else if (current > 0) next = current - 1;
    else next = null;

    setGameState(prev => ({
      ...prev,
      scores: { ...prev.scores, [key]: next }
    }));
  };

  const handleZoneToggle = (playerNum: string, zoneKey: string) => {
    const key = `${playerNum}-${zoneKey}`;
    setGameState(prev => ({
      ...prev,
      zones: { ...prev.zones, [key]: !prev.zones[key] }
    }));
  };

  // --- RENDER HELPERS ---
  const getCellBgColor = (value: ScoreValue): string => {
    if (value === null) return 'bg-white';
    if (value >= 3) return 'bg-green-100';
    if (value === 2) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const renderActionCell = (playerNum: string, action: string) => {
    const value = gameState.scores[`${playerNum}-${action}`];
    // Corrección de estilo: usamos tw`` dentro de un array para evitar el error de tipado
    return (
      <TouchableOpacity 
        onPress={() => handleScoreToggle(playerNum, action)}
        style={[
          tw`w-10 h-10 border-r border-b border-slate-300 justify-center items-center`,
          tw`${getCellBgColor(value)}`
        ]}
      >
        <Text style={tw`text-xs font-bold ${value !== null ? 'text-slate-900' : 'text-slate-200'}`}>
          {value !== null ? value : '-'}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderZoneCell = (playerNum: string, zoneId: string) => {
    const isActive = gameState.zones[`${playerNum}-${zoneId}`];
    return (
      <TouchableOpacity 
        onPress={() => handleZoneToggle(playerNum, zoneId)}
        style={[
          tw`w-8 h-10 border-r border-b border-slate-300 justify-center items-center`,
          isActive ? tw`bg-blue-500` : tw`bg-blue-50`
        ]}
      >
        <Text style={tw`text-[9px] font-bold ${isActive ? 'text-white' : 'text-blue-300'}`}>X</Text>
      </TouchableOpacity>
    );
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

  return (
    <View style={tw`flex-1 bg-white`}>
      <View style={tw`bg-[#003366] p-3 flex-row justify-between items-center`}>
        <Text style={tw`text-white font-black uppercase text-xs`}>Captar Datos de Juego</Text>
        <Text style={tw`text-white font-bold`}>{eventData?.teamA?.name || 'Equipo A'}</Text>
      </View>

      <ScrollView>
        <ScrollView horizontal>
          <View>
            {/* Header Nivel 1: Categorías */}
            <View style={tw`flex-row h-10 bg-slate-100`}>
              <View style={tw`w-16 border-r border-b border-slate-300 justify-center items-center`}>
                <Text style={tw`text-[9px] font-bold`}>JUG</Text>
              </View>
              {sections.map(s => (
                <View 
                  key={s.title} 
                  style={[
                    tw`border-r border-b border-slate-300 justify-center items-center`, 
                    { width: s.subs.length * 40 }, 
                    tw`${s.color}` // CORRECCIÓN AQUÍ: Envolviendo la variable en tw``
                  ]}
                >
                  <Text style={tw`text-[10px] font-black`}>{s.title}</Text>
                </View>
              ))}
              <View style={tw`w-24 bg-blue-100 border-r border-b border-slate-300 justify-center items-center`}>
                <Text style={tw`text-[10px] font-black text-blue-800`}>Z.R.A</Text>
              </View>
              <View style={tw`w-24 bg-blue-100 border-r border-b border-slate-300 justify-center items-center`}>
                <Text style={tw`text-[10px] font-black text-blue-800`}>Z.RE.A</Text>
              </View>
            </View>

            {/* Resto de la tabla permanece igual pero con el tipado corregido */}
            <View style={tw`flex-row h-8 bg-slate-50`}>
              <View style={tw`w-16 border-r border-b border-slate-300`} />
              {sections.flatMap(s => s.subs).map(sub => (
                <View key={sub} style={tw`w-10 border-r border-b border-slate-300 justify-center items-center`}>
                  <Text style={tw`text-[9px] font-bold text-slate-500`}>{sub}</Text>
                </View>
              ))}
              {['IZ', 'CE', 'DE', 'IZ', 'CE', 'DE'].map((z, i) => (
                <View key={`z-${i}`} style={tw`w-8 border-r border-b border-slate-300 justify-center items-center bg-blue-50/50`}>
                  <Text style={tw`text-[8px] font-bold text-blue-600`}>{z}</Text>
                </View>
              ))}
            </View>

            {(eventData?.teamA?.players || [1, 2, 3]).map((player: any) => {
              const pNum = player.number || player;
              return (
                <View key={pNum} style={tw`flex-row`}>
                  <View style={tw`w-16 h-10 border-r border-b border-slate-300 justify-center items-center bg-slate-50`}>
                    <Text style={tw`font-black text-[#003366]`}>{pNum}</Text>
                  </View>
                  {sections.flatMap(s => s.subs).map(sub => (
                    <React.Fragment key={`${pNum}-${sub}`}>
                      {renderActionCell(pNum, sub)}
                    </React.Fragment>
                  ))}
                  {['IZ-A', 'CE-A', 'DE-A', 'IZ-E', 'CE-E', 'DE-E'].map(z => (
                    <React.Fragment key={`${pNum}-${z}`}>
                      {renderZoneCell(pNum, z)}
                    </React.Fragment>
                  ))}
                </View>
              );
            })}
          </View>
        </ScrollView>
      </ScrollView>

      <View style={tw`p-4 border-t border-slate-200 bg-slate-50 items-end`}>
        <TouchableOpacity style={tw`bg-[#003366] px-10 py-3 rounded-xl shadow-lg`}>
          <Text style={tw`text-white font-bold uppercase`}>Guardar Secuencia</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}