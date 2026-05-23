// components/QuickNav.tsx
import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import React from "react";
import { TouchableOpacity } from "react-native";
import tw from "../lib/tailwind";
import { useMatchStore } from "../src/store/useMatchStore";

interface QuickNavProps {
  dark?: boolean;
}

export default function QuickNav({ dark = false }: QuickNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const currentMatch = useMatchStore((s) => s.currentMatch);

  // No mostrar si ya estamos en la pantalla de juego
  if (pathname.includes("game")) return null;

  // Solo mostrar si hay partido en curso
  if (!currentMatch) return null;

  return (
    <TouchableOpacity
      onPress={() => router.replace("/(tabs)/game")}
      style={tw`p-2 rounded-xl ${dark ? "bg-slate-800" : "bg-[#003366]"}`}
    >
      <Ionicons name="play" size={24} color="white" />
    </TouchableOpacity>
  );
}
