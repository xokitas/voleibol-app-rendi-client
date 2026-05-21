// components/results/StatsPanel.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import tw from "../../lib/tailwind";
import RadarChart from "./RadarChart";

export interface SubStats {
  total: number;
  positive: number;
  negative: number;
  effectiveness: number;
}

export interface CategoryStats {
  total: number;
  positive: number;
  negative: number;
  effectiveness: number;
  subs: Record<string, SubStats>;
}

const categoryColors: Record<string, string> = {
  SERVICIO: "bg-blue-200 text-blue-900",
  RECEPCION: "bg-green-200 text-green-900",
  ACOMODADA: "bg-pink-200 text-pink-900",
  ATAQUE: "bg-yellow-200 text-yellow-900",
  BLOQUEO: "bg-purple-200 text-purple-900",
  DEFENSA: "bg-emerald-200 text-emerald-900",
  ERRORES_SERV: "bg-gray-300 text-gray-900",
  ERRORES_COM: "bg-gray-300 text-gray-900",
  ERRORES_POS: "bg-gray-300 text-gray-900",
  ERRORES_TEC: "bg-gray-300 text-gray-900",
};

export default function StatsPanel({
  radarData,
  categories,
  color,
  radarSize = 200,
}: {
  radarData: { label: string; value: number }[];
  categories: Record<string, CategoryStats>;
  color: string;
  radarSize?: number;
}) {
  return (
    <View style={tw`flex-row`}>
      {/* Radar */}
      <View style={tw`w-50 h-50 items-center justify-center`}>
        <RadarChart data={radarData} size={radarSize} color={color} />
      </View>
      {/* Lista de categorías colapsables en dos columnas */}
      <View style={tw`flex-1 ml-2`}>
        <View style={tw`flex-row flex-wrap`}>
          {Object.entries(categories).map(([cat, data]) => {
            const [open, setOpen] = useState(false);
            return (
              <View key={cat} style={tw`w-1/2 pr-1 mb-1`}>
                <TouchableOpacity
                  onPress={() => setOpen(!open)}
                  style={tw`${
                    categoryColors[cat] || "bg-gray-200 text-gray-800"
                  } px-2 py-1 rounded-lg`}
                >
                  <View style={tw`flex-row justify-between items-center`}>
                    <Text style={tw`text-[9px] font-bold`}>
                      {cat} ({data.effectiveness.toFixed(0)}%)
                    </Text>
                    <Ionicons
                      name={open ? "chevron-up" : "chevron-down"}
                      size={10}
                      color="#334155"
                    />
                  </View>
                </TouchableOpacity>
                {open && (
                  <View style={tw`mt-1 ml-1`}>
                    {Object.entries(data.subs).map(([sub, subData]) => (
                      <View
                        key={sub}
                        style={tw`flex-row justify-between py-0.5`}
                      >
                        <Text style={tw`text-[8px] text-slate-600`}>{sub}</Text>
                        <Text style={tw`text-[8px] font-bold text-slate-700`}>
                          {subData.total} ({subData.effectiveness.toFixed(0)}%)
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}
