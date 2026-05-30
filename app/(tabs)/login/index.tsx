// app/(tabs)/login/index.tsx
import CustomModal from "@/components/CustomModal";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import tw from "../../../lib/tailwind";
import { useAuthStore } from "../../../src/store/useAuthStore";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Modal de error
  const [modalError, setModalError] = useState<{
    visible: boolean;
    title: string;
    message: string;
  }>({ visible: false, title: "", message: "" });

  // Modal de éxito
  const [successModal, setSuccessModal] = useState(false);

  const loginAction = useAuthStore((state) => state.login);
  const isLoading = useAuthStore((state) => state.isLoading);

  const traducirError = (mensaje: string): string => {
    const msg = mensaje.toLowerCase();
    if (
      msg.includes("fetch") ||
      msg.includes("network") ||
      msg.includes("timeout")
    ) {
      return "No se pudo conectar con el servidor. Comprueba tu conexión a internet e inténtalo de nuevo.";
    }
    if (
      msg.includes("401") ||
      msg.includes("credenciales") ||
      msg.includes("incorrect")
    ) {
      return "Correo electrónico o contraseña incorrectos. Vuelve a intentarlo.";
    }
    if (msg.includes("500") || msg.includes("server")) {
      return "El servidor está experimentando problemas. Inténtalo más tarde.";
    }
    if (/[áéíóúñ]/i.test(mensaje)) return mensaje;
    return "Ha ocurrido un error inesperado. Inténtalo de nuevo más tarde.";
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setModalError({
        visible: true,
        title: "Campos incompletos",
        message: "Por favor, completa todos los campos.",
      });
      return;
    }

    try {
      await loginAction(email, password);
      // Mostrar modal de éxito en lugar de volver directamente
      setSuccessModal(true);
    } catch (err: any) {
      const mensajeOriginal = err.message || "Error desconocido";
      setModalError({
        visible: true,
        title: "Error de inicio de sesión",
        message: traducirError(mensajeOriginal),
      });
    }
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={tw`flex-1 justify-center px-8`}
      >
        {/* Encabezado */}
        <View style={tw`items-center mb-10`}>
          <Ionicons name="person-circle-outline" size={80} color="#003366" />
          <Text style={tw`text-3xl font-black text-[#003366] mt-4`}>
            Iniciar Sesión
          </Text>
          <Text style={tw`text-sm text-slate-500 mt-2 text-center`}>
            Accede para sincronizar tus datos y respaldarlos en la nube.
          </Text>
        </View>

        {/* Campos del formulario */}
        <View style={tw`mb-6`}>
          <Text style={tw`text-xs font-bold text-slate-500 uppercase mb-2`}>
            Correo electrónico
          </Text>
          <TextInput
            style={tw`border border-slate-300 rounded-xl px-4 py-3 text-base`}
            placeholder="tu@email.com"
            placeholderTextColor="#94a3b8"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View style={tw`mb-8`}>
          <Text style={tw`text-xs font-bold text-slate-500 uppercase mb-2`}>
            Contraseña
          </Text>
          <TextInput
            style={tw`border border-slate-300 rounded-xl px-4 py-3 text-base`}
            placeholder="••••••••"
            placeholderTextColor="#94a3b8"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        {/* Botón de inicio de sesión */}
        <TouchableOpacity
          style={tw`bg-[#003366] py-4 rounded-xl items-center mb-6 ${
            isLoading ? "opacity-70" : ""
          }`}
          onPress={handleLogin}
          disabled={isLoading}
        >
          <Text style={tw`text-white font-bold text-lg uppercase`}>
            {isLoading ? "Ingresando..." : "Entrar"}
          </Text>
        </TouchableOpacity>

        {/* Enlace para volver */}
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={tw`text-center text-[#003366] font-semibold`}>
            Cancelar
          </Text>
        </TouchableOpacity>

        <Text style={tw`text-xs text-slate-400 text-center mt-10`}>
          Tus datos se mantienen seguros. La sesión se conservará incluso sin
          conexión.
        </Text>
      </KeyboardAvoidingView>

      {/* Modal de error personalizado */}
      <CustomModal
        visible={modalError.visible}
        title={modalError.title}
        message={modalError.message}
        type="danger"
        onConfirm={() =>
          setModalError({ visible: false, title: "", message: "" })
        }
        onCancel={() =>
          setModalError({ visible: false, title: "", message: "" })
        }
        confirmText="Entendido"
        cancelText="Cerrar"
      />

      {/* Modal de éxito */}
      <CustomModal
        visible={successModal}
        title="¡Inicio de sesión exitoso!"
        message="Has iniciado sesión correctamente. Tus datos se respaldarán en el servidor."
        type="info"
        onConfirm={() => {
          setSuccessModal(false);
          router.back();
        }}
        onCancel={() => {
          setSuccessModal(false);
          router.back();
        }}
        confirmText="Continuar"
      />
    </SafeAreaView>
  );
}
