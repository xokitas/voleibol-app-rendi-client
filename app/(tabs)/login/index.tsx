// app/(tabs)/login/index.tsx
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
import tw from "../../../lib/tailwind"; // ajusta la ruta si es necesario
import { useAuthStore } from "../../../src/store/useAuthStore";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const loginAction = useAuthStore((state) => state.login);
  const isLoading = useAuthStore((state) => state.isLoading);

  const handleLogin = async () => {
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("Por favor, completa todos los campos.");
      return;
    }

    try {
      await loginAction(email, password);
      router.back(); // vuelve a la pantalla anterior
    } catch (err: any) {
      setError(err.message || "Error al iniciar sesión");
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

        {/* Mensaje de error */}
        {error !== "" && (
          <Text style={tw`text-red-500 text-sm mb-4 text-center`}>{error}</Text>
        )}

        {/* Botón de inicio de sesión */}
        <TouchableOpacity
          style={tw`bg-[#003366] py-4 rounded-xl items-center mb-6 ${isLoading ? "opacity-70" : ""}`}
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
    </SafeAreaView>
  );
}
