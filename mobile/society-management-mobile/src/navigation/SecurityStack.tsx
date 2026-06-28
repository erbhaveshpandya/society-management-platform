import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { SecurityDashboardScreen } from '../screens/security/SecurityDashboardScreen';
import { VisitorEntryScreen } from '../screens/security/VisitorEntryScreen';
import { LiveVisitorsScreen } from '../screens/security/LiveVisitorsScreen';
import { StaffAttendanceScreen } from '../screens/security/StaffAttendanceScreen';
import { WrongParkingScreen } from '../screens/security/WrongParkingScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const SecurityTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'shield';

          if (route.name === 'Terminal') {
            iconName = focused ? 'shield' : 'shield-outline';
          } else if (route.name === 'LiveVisitors') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'StaffAttendance') {
            iconName = focused ? 'time' : 'time-outline';
          } else if (route.name === 'WrongParking') {
            iconName = focused ? 'car' : 'car-outline';
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
      <Tab.Screen 
        name="Terminal" 
        component={SecurityDashboardScreen} 
        options={{ tabBarLabel: 'Terminal' }}
      />
      <Tab.Screen 
        name="LiveVisitors" 
        component={LiveVisitorsScreen} 
        options={{ tabBarLabel: 'Live Inside' }}
      />
      <Tab.Screen 
        name="StaffAttendance" 
        component={StaffAttendanceScreen} 
        options={{ tabBarLabel: 'Staff' }}
      />
      <Tab.Screen 
        name="WrongParking" 
        component={WrongParkingScreen} 
        options={{ tabBarLabel: 'Parking' }}
      />
    </Tab.Navigator>
  );
};

export const SecurityStack: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SecurityTabs" component={SecurityTabNavigator} />
      <Stack.Screen name="VisitorEntry" component={VisitorEntryScreen} />
      <Stack.Screen name="LiveVisitors" component={LiveVisitorsScreen} />
      <Stack.Screen name="StaffAttendance" component={StaffAttendanceScreen} />
      <Stack.Screen name="WrongParking" component={WrongParkingScreen} />
    </Stack.Navigator>
  );
};
