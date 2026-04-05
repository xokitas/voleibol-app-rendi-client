import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import tw from '../../../lib/tailwind';

export default function GameScreenWeb() {
  const { data } = useLocalSearchParams();
  const eventData = data ? JSON.parse(data as string) : null;

  return (
    <View style={tw`flex-1 bg-slate-50 flex-col`}>
      
      {/* --- PANEL SUPERIOR: MARCADOR Y CRONÓMETRO --- */}
      <View style={tw`bg-[#003366] p-4 flex-row justify-between items-center shadow-lg z-50`}>
        {/* Viento y Cambio de Cancha */}
        <View style={tw`flex-row gap-4 items-center`}>
          <View style={tw`flex-row items-center bg-white/10 p-2 rounded`}>
            <Text style={tw`text-white font-bold mr-2 text-xs uppercase`}>Viento:</Text>
            <TouchableOpacity style={tw`bg-red-500 w-8 h-8 rounded justify-center items-center mr-1`}><Text style={tw`text-white font-bold`}>C</Text></TouchableOpacity>
            <TouchableOpacity style={tw`bg-green-500 w-8 h-8 rounded justify-center items-center`}><Text style={tw`text-white font-bold`}>F</Text></TouchableOpacity>
          </View>
          <TouchableOpacity style={tw`bg-orange-500 px-4 py-2 rounded shadow`}>
            <Text style={tw`text-white font-bold text-xs uppercase`}>C. Cancha</Text>
          </TouchableOpacity>
        </View>

        {/* Cronómetros */}
        <View style={tw`items-center`}>
          <View style={tw`flex-row items-center gap-4 bg-slate-800 p-2 rounded-lg border border-slate-600`}>
            <View style={tw`items-center`}>
              <Text style={tw`text-slate-400 text-[10px] uppercase font-bold`}>Tiempo Total</Text>
              <Text style={tw`text-white text-xl font-black`}>00:00:00</Text>
            </View>
            <TouchableOpacity style={tw`bg-slate-600 p-2 rounded-full`}>
              <Ionicons name="pause" size={16} color="white" />
            </TouchableOpacity>
            <View style={tw`items-center`}>
              <Text style={tw`text-green-400 text-[10px] uppercase font-bold`}>Tiempo Real</Text>
              <Text style={tw`text-green-400 text-xl font-black`}>00:00:00</Text>
            </View>
          </View>
        </View>

        {/* Marcador y Sets */}
        <View style={tw`flex-row items-center gap-6`}>
          <View style={tw`items-end`}>
            <Text style={tw`text-white font-bold`}>{eventData?.teamA?.name || 'Equipo A'}</Text>
            <Text style={tw`text-green-400 text-[10px] font-bold`}>SETS: 0</Text>
          </View>
          <View style={tw`bg-white px-4 py-2 rounded-lg flex-row items-center gap-3`}>
            <Text style={tw`text-3xl font-black text-[#003366]`}>0</Text>
            <Text style={tw`text-xl text-slate-300 font-bold`}>-</Text>
            <Text style={tw`text-3xl font-black text-[#003366]`}>0</Text>
          </View>
          <View style={tw`items-start`}>
            <Text style={tw`text-white font-bold`}>{eventData?.teamB?.name || 'Equipo B'}</Text>
            <Text style={tw`text-green-400 text-[10px] font-bold`}>SETS: 0</Text>
          </View>
        </View>
      </View>

      {/* --- ÁREA PRINCIPAL DE REGISTRO (ESTILO EXCEL) --- */}
      <ScrollView horizontal contentContainerStyle={tw`p-4`} style={tw`flex-1`}>
        <View style={tw`bg-white rounded-xl shadow-sm border border-slate-200 p-4`}>
          
          {/* Fila de Categorías Principales */}
          <View style={tw`flex-row mb-1`}>
            <View style={tw`w-16`} /> {/* Espacio para columna JUGADOR */}
            <View style={tw`w-48 bg-cyan-200 border border-slate-300 justify-center items-center py-2`}><Text style={tw`font-bold text-xs uppercase`}>Servicio</Text></View>
            <View style={tw`w-24 bg-green-200 border border-slate-300 justify-center items-center py-2`}><Text style={tw`font-bold text-xs uppercase`}>Recepción</Text></View>
            <View style={tw`w-24 bg-fuchsia-300 border border-slate-300 justify-center items-center py-2`}><Text style={tw`font-bold text-xs uppercase`}>Acomodada</Text></View>
            <View style={tw`w-[384px] bg-yellow-300 border border-slate-300 justify-center items-center py-2`}><Text style={tw`font-bold text-xs uppercase`}>Ataque</Text></View>
            <View style={tw`w-36 bg-purple-500 border border-slate-300 justify-center items-center py-2`}><Text style={tw`font-bold text-white text-xs uppercase`}>Bloqueo</Text></View>
            <View style={tw`w-48 bg-emerald-600 border border-slate-300 justify-center items-center py-2`}><Text style={tw`font-bold text-white text-xs uppercase`}>Defensa</Text></View>
            <View style={tw`w-48 bg-indigo-200 border border-slate-300 justify-center items-center py-2`}><Text style={tw`font-bold text-xs uppercase`}>E.N. Forzados</Text></View>
          </View>

          {/* Fila de Sub-Categorías (Elementos Técnicos) */}
          <View style={tw`flex-row mb-1`}>
            <View style={tw`w-16 border-b border-slate-300 justify-center items-center py-1`}><Text style={tw`font-bold text-[10px]`}>JUGADOR</Text></View>
            {/* Servicio */}
            {['BAJ', 'FLO', 'SAL', 'SAF'].map(sub => <View key={sub} style={tw`w-12 bg-cyan-100 border border-slate-300 justify-center items-center py-1`}><Text style={tw`text-[10px] font-bold`}>{sub}</Text></View>)}
            {/* Recepción */}
            {['2ma', 'Ppm'].map(sub => <View key={sub} style={tw`w-12 bg-green-100 border border-slate-300 justify-center items-center py-1`}><Text style={tw`text-[10px] font-bold`}>{sub}</Text></View>)}
            {/* Acomodada */}
            {['P2a', 'P2b'].map(sub => <View key={sub} style={tw`w-12 bg-fuchsia-200 border border-slate-300 justify-center items-center py-1`}><Text style={tw`text-[10px] font-bold`}>{sub}</Text></View>)}
            {/* Ataque */}
            {['Rm', 'Rca', 'Ub', 'Tr', 'Acd', 'Rdjn', 'Rdpmp', 'Rd'].map(sub => <View key={sub} style={tw`w-12 bg-yellow-200 border border-slate-300 justify-center items-center py-1`}><Text style={tw`text-[10px] font-bold`}>{sub}</Text></View>)}
            {/* Bloqueo */}
            {['Bl', 'Bd', 'Bn'].map(sub => <View key={sub} style={tw`w-12 bg-purple-400 border border-slate-300 justify-center items-center py-1`}><Text style={tw`text-white text-[10px] font-bold`}>{sub}</Text></View>)}
            {/* Defensa */}
            {['Dd', 'Dltd', 'Ld', 'Cc'].map(sub => <View key={sub} style={tw`w-12 bg-emerald-500 border border-slate-300 justify-center items-center py-1`}><Text style={tw`text-white text-[10px] font-bold`}>{sub}</Text></View>)}
            {/* Errores */}
            {['Ens', 'Enr', 'Enp', 'Enm'].map(sub => <View key={sub} style={tw`w-12 bg-indigo-100 border border-slate-300 justify-center items-center py-1`}><Text style={tw`text-[10px] font-bold`}>{sub}</Text></View>)}
          </View>

          {/* Fila del Jugador 1 */}
          <View style={tw`flex-row mb-1`}>
            <TouchableOpacity style={tw`w-16 bg-red-600 border border-slate-300 justify-center items-center h-8`}>
              <Text style={tw`text-white font-black`}>1</Text>
            </TouchableOpacity>
            {/* Placeholder para los valores (0-4) que el usuario clickeará. En el futuro, esto se mapeará dinámicamente */}
            <View style={tw`flex-1 flex-row`}>
               {/* Simulación de las celdas vacías esperando clic */}
               {Array.from({length: 27}).map((_, i) => (
                 <TouchableOpacity key={`p1-${i}`} style={tw`w-12 border border-slate-200 h-8 bg-slate-50 justify-center items-center active:bg-blue-200`}>
                    {/* Al clickear, aquí aparecería el valor según el documento */}
                 </TouchableOpacity>
               ))}
            </View>
          </View>

          {/* Fila del Jugador 2 */}
          <View style={tw`flex-row mb-4`}>
            <TouchableOpacity style={tw`w-16 bg-blue-600 border border-slate-300 justify-center items-center h-8`}>
              <Text style={tw`text-white font-black`}>2</Text>
            </TouchableOpacity>
            <View style={tw`flex-1 flex-row`}>
               {Array.from({length: 27}).map((_, i) => (
                 <TouchableOpacity key={`p2-${i}`} style={tw`w-12 border border-slate-200 h-8 bg-slate-50 justify-center items-center active:bg-blue-200`}>
                 </TouchableOpacity>
               ))}
            </View>
          </View>

          {/* Zonas de Ataque y Destino (Z.R.A y Z.RE.A) */}
          <View style={tw`flex-row mt-2`}>
             <View style={tw`w-16`} />
             <View style={tw`w-36 bg-pink-300 border border-slate-300 py-1 items-center`}><Text style={tw`font-bold text-[10px]`}>Z.R.A</Text></View>
             {['IZ', 'CE', 'DE'].map(z => <View key={`zra-${z}`} style={tw`w-12 bg-pink-100 border border-slate-300 py-1 items-center`}><Text style={tw`font-bold text-[10px]`}>{z}</Text></View>)}
             <View style={tw`w-36 bg-pink-400 border border-slate-300 py-1 items-center`}><Text style={tw`font-bold text-white text-[10px]`}>Z.RE.A</Text></View>
             {['IZ', 'CE', 'DE'].map(z => <View key={`zrea-${z}`} style={tw`w-12 bg-pink-200 border border-slate-300 py-1 items-center`}><Text style={tw`font-bold text-[10px]`}>{z}</Text></View>)}
          </View>

          {/* --- BOTONES DE CONTROL DE SECUENCIA Y PARTIDO --- */}
          <View style={tw`flex-row mt-8 justify-between items-center`}>
            <View style={tw`flex-row gap-4`}>
              <TouchableOpacity style={tw`bg-[#003366] px-8 py-3 rounded-lg shadow`}>
                <Text style={tw`text-white font-bold uppercase`}>Guardar Acción</Text>
              </TouchableOpacity>
            </View>

            <View style={tw`flex-row gap-4`}>
              <TouchableOpacity style={tw`bg-red-600 px-6 py-3 rounded-lg shadow`}>
                <Text style={tw`text-white font-bold uppercase`}>Final Set</Text>
              </TouchableOpacity>
              <TouchableOpacity style={tw`bg-green-600 px-6 py-3 rounded-lg shadow`}>
                <Text style={tw`text-white font-bold uppercase text-xs`}>Final Parcial del Partido</Text>
              </TouchableOpacity>
              <TouchableOpacity style={tw`bg-green-700 px-6 py-3 rounded-lg shadow`}>
                <Text style={tw`text-white font-bold uppercase`}>Final del Partido</Text>
              </TouchableOpacity>
            </View>
          </View>

        </View>
      </ScrollView>
    </View>
  );
}