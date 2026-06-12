// components/ReferencePanel.tsx
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SUBACTIONS_METADATA } from "../constants/volleyball";
import tw from "../lib/tailwind";

interface ReferencePanelProps {
  dark?: boolean;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  hoveredAction: string | null; // en móvil recibirá la subacción tocada
  isMobile?: boolean; // nuevo prop
}

export default function ReferencePanel({
  dark,
  isOpen,
  setIsOpen,
  hoveredAction,
  isMobile = false,
}: ReferencePanelProps) {
  const metadata = hoveredAction ? SUBACTIONS_METADATA[hoveredAction] : null;

  const panelBg = dark ? "bg-slate-900" : "bg-white";
  const textColor = dark ? "text-slate-100" : "text-slate-900";
  const borderColor = dark ? "border-slate-800" : "border-slate-200";

  if (!isOpen) return null;

  // Pasos para el tutorial en móvil (sin atajos de teclado)
  const mobileSteps = [
    {
      step: "1",
      title: "JUGADOR",
      desc: "Toca al protagonista en el marcador.",
    },
    {
      step: "2",
      title: "ACCIÓN",
      desc: "Elige una categoría (Servicio, Ataque, etc.) y luego una subacción.",
    },
    {
      step: "3",
      title: "CALIFICAR",
      desc: "Selecciona un valor (0‑4) en el selector emergente.",
    },
    {
      step: "4",
      title: "TRAYECTORIA",
      desc: "Marca la zona de salida y luego la de destino en la cancha.",
    },
    {
      step: "5",
      title: "GUARDAR",
      desc: "Pulsa GUARDAR para cerrar el rally y asignar el punto.",
    },
  ];

  const desktopSteps = [
    {
      step: "1",
      title: "JUGADOR",
      desc: "Selecciona al protagonista en la cancha. Atajo: teclas 1,2,3,4.",
    },
    {
      step: "2",
      title: "ACCIÓN",
      desc: "Elige la técnica ejecutada (Servicio, Ataque, etc.).",
    },
    {
      step: "3",
      title: "CALIFICAR",
      desc: "Presiona un número (0-4) según el éxito de la acción.",
    },
    {
      step: "4",
      title: "TRAYECTORIA",
      desc: "Marca posición de salida y destino en el campo.",
    },
    {
      step: "5",
      title: "GUARDAR",
      desc: "Finaliza el rally y asigna el punto. Atajo: Ctrl+S.",
    },
  ];

  const steps = isMobile ? mobileSteps : desktopSteps;

  return (
    <View
      style={tw`${isMobile ? "w-64 h-full" : "w-80 h-full"} ${panelBg} shadow-2xl p-6 border-r ${borderColor}`}
    >
      {/* CABECERA */}
      <View style={tw`flex-row justify-between items-center mb-6`}>
        <View>
          <Text style={tw`text-xl font-black ${textColor}`}>MANUAL</Text>
          <View style={tw`w-8 h-1 bg-yellow-500 mt-1`} />
        </View>
        <TouchableOpacity onPress={() => setIsOpen(false)} style={tw`p-2`}>
          <Ionicons
            name="chevron-back"
            size={24}
            color={dark ? "#94a3b8" : "#003366"}
          />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {metadata ? (
          /* --- ESTADO: EXPLICACIÓN DE ACCIÓN --- */
          <View>
            <View
              style={tw`bg-blue-500/10 p-4 rounded-xl mb-6 border border-blue-500/20`}
            >
              <Text
                style={tw`text-blue-500 text-[10px] font-black uppercase mb-1`}
              >
                Acción Seleccionada
              </Text>
              <Text style={tw`text-xl font-black ${textColor}`}>
                {metadata.name}
              </Text>

              {metadata.description && (
                <Text style={tw`text-slate-400 text-xs mt-2 italic leading-5`}>
                  {metadata.description}
                </Text>
              )}
            </View>

            <Text style={tw`text-xs font-bold text-slate-500 uppercase mb-4`}>
              Criterios de Evaluación:
            </Text>

            {Object.entries(metadata.criteria)
              .sort(([valA], [valB]) => Number(valB) - Number(valA))
              .map(([val, desc]) => (
                <View key={val} style={tw`mb-4 flex-row items-start`}>
                  <View
                    style={tw`w-8 h-8 rounded bg-slate-800 border border-slate-700 items-center justify-center mr-2 mt-0.5`}
                  >
                    <Text style={tw`text-yellow-500 font-black text-xs`}>
                      {val === "0" ? "`" : val}
                    </Text>
                  </View>
                  <View style={tw`flex-1`}>
                    <Text
                      style={tw`text-[13px] ${textColor} font-medium leading-5`}
                    >
                      <Text style={tw`font-bold`}>V{val}: </Text>
                      {desc as string}
                    </Text>
                  </View>
                </View>
              ))}
          </View>
        ) : (
          /* --- ESTADO: MINI TUTORIAL --- */
          <View>
            <Text style={tw`text-slate-500 text-xs italic mb-6`}>
              {isMobile
                ? "Toca una subacción para ver sus criterios de evaluación."
                : "Pasa el ratón sobre una acción para ver sus detalles técnicos."}
            </Text>

            <Text
              style={tw`text-[10px] font-black text-yellow-500 uppercase mb-4`}
            >
              Guía de Registro de Acciones
            </Text>

            {steps.map((item) => (
              <View key={item.step} style={tw`mb-6 flex-row items-start`}>
                <Text style={tw`text-2xl font-black text-slate-800 mr-4`}>
                  {item.step}
                </Text>
                <View style={tw`flex-1`}>
                  <Text style={tw`font-black ${textColor} text-sm mb-1`}>
                    {item.title}
                  </Text>
                  <Text
                    style={tw`text-[11px] ${dark ? "text-slate-400" : "text-slate-500"} leading-4`}
                  >
                    {item.desc}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
