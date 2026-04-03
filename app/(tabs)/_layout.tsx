import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: '#003366',
      tabBarInactiveTintColor: '#94A3B8',
      tabBarStyle: {
        display: 'none',
        backgroundColor: '#F8F8FF',
        height: 60,
        paddingBottom: 8,
      },
    }}>
      {/* Pestaña Principal: El Menú de Acciones */}
      <Tabs.Screen name="menu" options={{ 
        title: 'Menú', 
        tabBarIcon: ({color}) => <Ionicons name="grid" size={24} color={color} /> 
      }} />
      
      {/* Pestaña de Resultados Directos */}
      <Tabs.Screen name="results" options={{ 
        title: 'Resultados', 
        tabBarIcon: ({color}) => <Ionicons name="stats-chart" size={24} color={color} /> 
      }} />

      {/* Pestaña de Carga */}
      <Tabs.Screen name="load" options={{ 
        title: 'Cargar', 
        tabBarIcon: ({color}) => <Ionicons name="cloud-download" size={24} color={color} /> 
      }} />
    </Tabs>
  );
}