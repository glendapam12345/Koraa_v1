import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { THEME } from '@/constants/theme';
import { Home, Edit3, Heart, User, Calendar, FolderKanban } from 'lucide-react-native';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: THEME.colors.gradient.blue,
        tabBarInactiveTintColor: THEME.colors.text.secondary,
        tabBarStyle: {
          backgroundColor: THEME.colors.fill[100],
          borderTopWidth: 1,
          borderTopColor: THEME.colors.stroke[100],
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom + 6,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: THEME.fonts.heading.medium,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
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
        name="proyectos"
        options={{
          title: 'Proyectos',
          tabBarIcon: ({ size, color }) => (
            <FolderKanban size={size} color={color} />
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
