import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: '#003366', // Azul fuerte para la pestaña activa
      tabBarInactiveTintColor: '#94A3B8', // Gris para las inactivas
      tabBarStyle: {
        backgroundColor: '#F8F8FF', // Ghost White
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        height: 60,
        paddingBottom: 8,
      },
    }}>
      <Tabs.Screen name="index" options={{ title: 'Registrar', tabBarIcon: ({color}) => <Ionicons name="add-circle" size={24} color={color} /> }} />
      <Tabs.Screen name="results" options={{ title: 'Resultados', tabBarIcon: ({color}) => <Ionicons name="stats-chart" size={24} color={color} /> }} />
      <Tabs.Screen name="load" options={{ title: 'Cargar', tabBarIcon: ({color}) => <Ionicons name="cloud-download" size={24} color={color} /> }} />
    </Tabs>
  );
}