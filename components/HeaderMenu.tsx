import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import tw from "../lib/tailwind";
import QuickNav from "./QuickNav";
import UserMenu from "./UserMenu";

interface HeaderMenuProps {
  title?: string;
  onBack?: () => void;
  showQuickNav?: boolean;
  onNavigate?: (route: string) => void;
  dark?: boolean;
}

export default function HeaderMenu({
  title,
  onBack,
  showQuickNav = false,
  onNavigate,
  dark = false,
}: HeaderMenuProps) {
  // --- ESTILOS DINÁMICOS SEGÚN EL MODO ---
  const textColor = dark ? "text-white" : "text-[#003366]";
  const iconColor = dark ? "#FFFFFF" : "#003366";
  // Mantenemos el fondo transparente o alineado al fondo general (en modo oscuro usamos el slate-900)
  const bgColor = dark
    ? "bg-slate-900 border-slate-800"
    : "bg-[#F8F8FF] border-slate-200/50";

  return (
    <View
      style={tw`flex-row items-center justify-between px-6 py-4 ${bgColor} border-b z-50 w-full`}
    >
      {/* IZQUIERDA: Botón Atrás + Título */}
      <View style={tw`flex-1 flex-row items-center`}>
        {onBack && (
          <TouchableOpacity
            onPress={onBack}
            activeOpacity={0.7}
            style={tw`mr-4 p-1`} // Mismo padding sutil que te gustó
          >
            <Ionicons name="arrow-back" size={28} color={iconColor} />
          </TouchableOpacity>
        )}

        {/* Título y detallito amarillo */}
        {title && (
          <View>
            <Text style={tw`text-base font-black ${textColor} uppercase`}>
              {title}
            </Text>
            {/* La línea amarilla siempre resalta, sin importar si es fondo oscuro o claro */}
            <View style={tw`w-6 h-0.5 bg-[#FFCC00] mt-0.5`} />
          </View>
        )}
      </View>

      {/* DERECHA: QuickNav + UserMenu */}
      <View style={tw`flex-row items-center justify-end gap-x-4`}>
        {showQuickNav && <QuickNav onNavigate={onNavigate} dark={dark} />}
        <UserMenu dark={dark} />
      </View>
    </View>
  );
}
