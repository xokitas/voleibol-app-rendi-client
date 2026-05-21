// app/(tabs)/game/index.tsx (Versión Mobile Android)
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useGameTimers } from "../../../hooks/useGameTimers";
import { useScoutingLogic } from "../../../hooks/useScoutingLogic";
import tw from "../../../lib/tailwind";

export default function GameScreenMobile() {
  const [showStats, setShowStats] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null); // Para sub-acciones

  // Importamos la misma lógica que en Web para mantener compatibilidad
  const logic = useScoutingLogic();
  const timers = useGameTimers();

  return (
    <View style={tw`flex-1 bg-slate-950 p-2`}>
      {/* HEADER: Marcador y Jugadores (Copia fiel de Web pero compacta) */}
      <View
        style={tw`flex-row justify-between items-center bg-slate-900 rounded-xl p-2 mb-2 border-b-2 border-slate-800`}
      >
        {/* Equipo A */}
        <View style={tw`flex-1 items-center`}>
          <Text style={tw`text-white font-black text-xs uppercase`}>
            Equipo A
          </Text>
          <View style={tw`flex-row gap-1 mt-1`}>
            {/* Jugadores A - Tarjetas pequeñas */}
            <TouchableOpacity
              style={tw`bg-blue-600/20 p-2 rounded-lg border border-blue-500`}
            >
              <Text style={tw`text-blue-400 font-bold text-[10px]`}>
                #10 JUAN
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={tw`bg-slate-800 p-2 rounded-lg`}>
              <Text style={tw`text-slate-400 font-bold text-[10px]`}>
                #2 PEDRO
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Marcador Central */}
        <View style={tw`items-center px-4`}>
          <View style={tw`flex-row items-center gap-3`}>
            <Text style={tw`text-white text-3xl font-black`}>12</Text>
            <View style={tw`bg-slate-800 px-2 py-1 rounded-md`}>
              <Text style={tw`text-yellow-500 font-bold text-xs`}>SET 2</Text>
            </View>
            <Text style={tw`text-white text-3xl font-black`}>08</Text>
          </View>
        </View>

        {/* Equipo B */}
        <View style={tw`flex-1 items-center`}>
          <Text style={tw`text-white font-black text-xs uppercase`}>
            Equipo B
          </Text>
          <View style={tw`flex-row gap-1 mt-1`}>
            <TouchableOpacity style={tw`bg-slate-800 p-2 rounded-lg`}>
              <Text style={tw`text-slate-400 font-bold text-[10px]`}>
                #1 LUIS
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={tw`bg-slate-800 p-2 rounded-lg`}>
              <Text style={tw`text-slate-400 font-bold text-[10px]`}>
                #5 JOSE
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* CONTENIDO PRINCIPAL: Cancha y Botones */}
      <View style={tw`flex-1 flex-row gap-2`}>
        {/* CANCHA (6 ZONAS) */}
        <View
          style={tw`flex-1 bg-orange-500/10 border-2 border-orange-500/30 rounded-2xl flex-row overflow-hidden`}
        >
          {/* Lado A */}
          <View style={tw`flex-1 flex-wrap flex-row`}>
            {[1, 2, 3, 4, 5, 6].map((z) => (
              <TouchableOpacity
                key={z}
                style={tw`w-1/2 h-1/3 border border-orange-500/20 justify-center items-center`}
              >
                <Text style={tw`text-orange-500/40 font-bold`}>Z{z}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {/* Red Central */}
          <View style={tw`w-1 bg-white/20 h-full`} />
          {/* Lado B */}
          <View style={tw`flex-1 flex-wrap flex-row`}>
            {[1, 2, 3, 4, 5, 6].map((z) => (
              <TouchableOpacity
                key={z}
                style={tw`w-1/2 h-1/3 border border-orange-500/20 justify-center items-center`}
              >
                <Text style={tw`text-orange-500/40 font-bold`}>Z{z}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* BOTONES DE ACCIÓN (Compactos) */}
        <View style={tw`w-1/3 gap-1`}>
          {[
            "SERVICIO",
            "RECEPCIÓN",
            "ACOMODADA",
            "ATAQUE",
            "BLOQUEO",
            "DEFENSA",
            "ERRORES",
          ].map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => setActiveMenu(cat)}
              style={tw`flex-1 bg-slate-800 rounded-lg justify-center px-4 border-l-4 border-blue-500`}
            >
              <Text style={tw`text-white font-black text-[10px] uppercase`}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* FOOTER: Controles y Tiempos */}
      <View
        style={tw`flex-row justify-between items-center mt-2 pt-2 border-t border-slate-800`}
      >
        <View style={tw`flex-row gap-4`}>
          <Text style={tw`text-slate-500 text-[10px] font-bold`}>
            REAL: 12:45
          </Text>
          <Text style={tw`text-slate-500 text-[10px] font-bold`}>
            TOTAL: 45:10
          </Text>
        </View>

        <View style={tw`flex-row gap-2`}>
          <TouchableOpacity
            onPress={() => setShowStats(true)}
            style={tw`bg-slate-800 p-2 rounded-lg`}
          >
            <Ionicons name="stats-chart" size={16} color="white" />
          </TouchableOpacity>

          <TouchableOpacity style={tw`bg-slate-800 p-2 rounded-lg`}>
            <Ionicons name="book" size={16} color="#fbbf24" />
          </TouchableOpacity>

          <TouchableOpacity style={tw`bg-red-600 px-4 py-2 rounded-lg`}>
            <Text style={tw`text-white font-black text-[10px] uppercase`}>
              Final Parcial
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={tw`bg-green-600 px-4 py-2 rounded-lg`}>
            <Text style={tw`text-white font-black text-[10px] uppercase`}>
              Guardar Punto
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* MODAL DE ESTADÍSTICAS (FULL SCREEN) */}
      <Modal visible={showStats} animationType="slide">
        <View style={tw`flex-1 bg-slate-950 p-6`}>
          <View style={tw`flex-row justify-between items-center mb-6`}>
            <Text style={tw`text-white text-2xl font-black uppercase`}>
              Análisis de Rendimiento
            </Text>
            <TouchableOpacity onPress={() => setShowStats(false)}>
              <Ionicons name="close-circle" size={32} color="white" />
            </TouchableOpacity>
          </View>
          <ScrollView>
            {/* Aquí iría el mapeo de tus estadísticas igual que en web */}
            <Text style={tw`text-slate-400`}>
              Cargando datos del historial...
            </Text>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
