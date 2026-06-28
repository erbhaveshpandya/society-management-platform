import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Import Screens
import { ResidentDashboardScreen } from '../screens/resident/ResidentDashboardScreen';
import { DuesScreen } from '../screens/resident/DuesScreen';
import { ComplaintsScreen } from '../screens/resident/ComplaintsScreen';
import { MoreScreen } from '../screens/resident/MoreScreen';
import { NoticesScreen } from '../screens/resident/NoticesScreen';
import { PollsScreen } from '../screens/resident/PollsScreen';
import { AmenityBookingScreen } from '../screens/resident/AmenityBookingScreen';
import { StaffScreen } from '../screens/resident/StaffScreen';
import { VehiclesScreen } from '../screens/resident/VehiclesScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const ResidentTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Dues') {
            iconName = focused ? 'wallet' : 'wallet-outline';
          } else if (route.name === 'Complaints') {
            iconName = focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline';
          } else if (route.name === 'More') {
            iconName = focused ? 'grid' : 'grid-outline';
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
      <Tab.Screen name="Home" component={ResidentDashboardScreen} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="Dues" component={DuesScreen} options={{ tabBarLabel: 'Dues' }} />
      <Tab.Screen name="Complaints" component={ComplaintsScreen} options={{ tabBarLabel: 'Complaints' }} />
      <Tab.Screen name="More" component={MoreScreen} options={{ tabBarLabel: 'More' }} />
    </Tab.Navigator>
  );
};

export const ResidentStack: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ResidentTabs" component={ResidentTabNavigator} />
      <Stack.Screen name="Notices" component={NoticesScreen} />
      <Stack.Screen name="Polls" component={PollsScreen} />
      <Stack.Screen name="Amenities" component={AmenityBookingScreen} />
      <Stack.Screen name="Staff" component={StaffScreen} />
      <Stack.Screen name="Vehicles" component={VehiclesScreen} />
    </Stack.Navigator>
  );
};
