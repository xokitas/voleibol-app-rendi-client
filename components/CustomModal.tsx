// components/CustomModal.tsx
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Modal, Text, TouchableOpacity, View } from "react-native";
import tw from "../lib/tailwind";

interface CustomModalProps {
  visible: boolean;
  title: string;
  message: string;
  type?: "warning" | "danger" | "info";
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  // Botón secundario opcional
  onSecondary?: () => void;
  secondaryText?: string;
}

export default function CustomModal({
  visible,
  title,
  message,
  type = "warning",
  onConfirm,
  onCancel,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  onSecondary,
  secondaryText,
}: CustomModalProps) {
  if (!visible) return null;

  const colorMap = {
    warning: { icon: "warning", color: "text-yellow-500", bg: "bg-yellow-600" },
    danger: { icon: "alert-circle", color: "text-red-500", bg: "bg-red-600" },
    info: {
      icon: "information-circle",
      color: "text-blue-500",
      bg: "bg-blue-600",
    },
  };

  const config = colorMap[type];

  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View
        style={tw`flex-1 justify-center items-center bg-black/80 px-4 z-50`}
      >
        <View
          style={tw`w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl`}
        >
          <View style={tw`flex-row items-center gap-3 mb-4`}>
            <Ionicons
              name={config.icon as any}
              size={28}
              style={tw`${config.color}`}
            />
            <Text style={tw`text-white font-black text-lg uppercase flex-1`}>
              {title}
            </Text>
          </View>

          <Text style={tw`text-slate-300 text-sm mb-8 leading-5`}>
            {message}
          </Text>

          <View style={tw`flex-row justify-end gap-3 flex-wrap`}>
            <TouchableOpacity
              onPress={onCancel}
              style={tw`px-5 py-2.5 rounded-xl border border-slate-700 bg-slate-800`}
            >
              <Text style={tw`text-slate-300 font-bold text-xs uppercase`}>
                {cancelText}
              </Text>
            </TouchableOpacity>

            {onSecondary && secondaryText && (
              <TouchableOpacity
                onPress={() => {
                  onSecondary();
                  onCancel(); // cerrar modal después de la acción secundaria
                }}
                style={tw`px-5 py-2.5 rounded-xl border border-slate-600 bg-slate-700`}
              >
                <Text style={tw`text-white font-bold text-xs uppercase`}>
                  {secondaryText}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={() => {
                onConfirm();
                onCancel(); // cerrar modal después de confirmar
              }}
              style={tw`px-5 py-2.5 rounded-xl ${config.bg} shadow-lg`}
            >
              <Text style={tw`text-white font-black text-xs uppercase`}>
                {confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
