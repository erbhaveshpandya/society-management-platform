import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { ResidentDashboardScreen } from '../screens/resident/ResidentDashboardScreen';
import { ComplaintsScreen } from '../screens/resident/ComplaintsScreen';

const Tab = createBottomTabNavigator();

export const ResidentStack: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Complaints') {
            iconName = focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4F46E5',
        tabBarInactiveTintColor: '#94A3B8',
        headerShown: false,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#F1F5F9',
          paddingTop: 8,
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={ResidentDashboardScreen} />
      <Tab.Screen name="Complaints" component={ComplaintsScreen} />
    </Tab.Navigator>
  );
};
