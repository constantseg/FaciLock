import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function Layout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: { height: 70, paddingBottom: 10 },
      }}
    >
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: 'Accueil',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size + 4} color={color} />,
        }} 
      />
      <Tabs.Screen 
        name="historique" 
        options={{ 
          title: 'Historique',
          tabBarIcon: ({ color, size }) => <Ionicons name="time-outline" size={size + 4} color={color} />,
        }} 
      />
      <Tabs.Screen 
        name="authorized" 
        options={{ 
          title: 'Personnes',
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size + 4} color={color} />,
        }} 
      />
    </Tabs>
  );
}
