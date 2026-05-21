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
  compact?: boolean;
}

export default function HeaderMenu({
  title,
  onBack,
  showQuickNav = false,
  onNavigate,
  dark = false,
  compact = false,
}: HeaderMenuProps) {
  const textColor = dark ? "text-white" : "text-[#003366]";
  const iconColor = dark ? "#FFFFFF" : "#003366";
  const bgColor = dark
    ? "bg-slate-900 border-slate-800"
    : "bg-[#F8F8FF] border-slate-200/50";

  return (
    <View
      style={tw`flex-row items-center justify-between ${
        compact ? "px-2 py-1" : "px-6 py-4"
      } ${bgColor} border-b z-50 w-full`}
    >
      {/* IZQUIERDA: Botón Atrás + Título */}
      <View style={tw`flex-1 flex-row items-center`}>
        {onBack && (
          <TouchableOpacity
            onPress={onBack}
            activeOpacity={0.7}
            style={tw`${compact ? "mr-1" : "mr-4"} p-1`}
          >
            <Ionicons
              name="arrow-back"
              size={compact ? 20 : 28}
              color={iconColor}
            />
          </TouchableOpacity>
        )}

        {title && (
          <View>
            <Text
              style={tw`${
                compact ? "text-xs" : "text-base"
              } font-black ${textColor} uppercase`}
            >
              {title}
            </Text>
            <View style={tw`w-6 h-0.5 bg-[#FFCC00] mt-0.5`} />
          </View>
        )}
      </View>

      {/* DERECHA: QuickNav + UserMenu */}
      <View style={tw`flex-row items-center justify-end gap-x-4`}>
        {showQuickNav && <QuickNav onNavigate={onNavigate} dark={dark} />}
        <UserMenu dark={dark} size={compact ? 18 : 24} />
      </View>
    </View>
  );
}
