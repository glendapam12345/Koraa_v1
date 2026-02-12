import { Tabs } from 'expo-router';
import { THEME } from '@/constants/theme';
import { Home, Edit3, Heart, User, Lightbulb, Calendar } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: THEME.colors.gradient.blue,
        tabBarInactiveTintColor: THEME.colors.text.secondary,
        tabBarStyle: {
          backgroundColor: THEME.colors.fill[100],
          borderTopColor: THEME.colors.stroke[100],
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          ...THEME.typography.caption,
          fontSize: 12,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accionar',
          tabBarIcon: ({ size, color }) => (
            <Home size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="vaciar"
        options={{
          title: 'Tareas',
          tabBarIcon: ({ size, color }) => (
            <Edit3 size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="sentir"
        options={{
          title: 'Sentir',
          tabBarIcon: ({ size, color }) => (
            <Heart size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="semana"
        options={{
          title: 'Semana',
          tabBarIcon: ({ size, color }) => (
            <Calendar size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="yo"
        options={{
          title: 'Yo',
          tabBarIcon: ({ size, color }) => (
            <User size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tips"
        options={{
          href: null, // Ocultar esta tab del tab bar
        }}
      />
    </Tabs>
  );
}
