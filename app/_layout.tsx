import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

// Evita que la pantalla de carga se oculte antes de tiempo
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    // Puedes añadir tus fuentes personalizadas aquí si las tienes
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) return null;

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  return (
    // Usamos DefaultTheme para mantener nuestro Ghost White sin interferencias
    <ThemeProvider value={DefaultTheme}>
      <Stack screenOptions={{ 
        // 1. ESTO ES LO MÁS IMPORTANTE: Esconde el encabezado en TODA la app
        headerShown: false, 
        animation: 'fade' // Hace que el cambio entre pantallas sea elegante
      }}>
        {/* 2. Definimos la pantalla de Bienvenida (index.tsx) */}
        <Stack.Screen name="index" /> 
        
        {/* 3. Definimos el grupo de pestañas (tabs) */}
        <Stack.Screen name="(tabs)" />
      </Stack>
    </ThemeProvider>
  );
}