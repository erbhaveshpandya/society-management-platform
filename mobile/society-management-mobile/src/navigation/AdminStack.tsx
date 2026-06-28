import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AdminDashboardScreen } from '../screens/admin/AdminDashboardScreen';
import { AdminComplaintsScreen } from '../screens/admin/AdminComplaintsScreen';
import { AdminNoticesScreen } from '../screens/admin/AdminNoticesScreen';
import { AdminFlatsScreen } from '../screens/admin/AdminFlatsScreen';
import { AdminStaffScreen } from '../screens/admin/AdminStaffScreen';

const Stack = createNativeStackNavigator();

export const AdminStack: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
      <Stack.Screen name="AdminComplaints" component={AdminComplaintsScreen} />
      <Stack.Screen name="AdminNotices" component={AdminNoticesScreen} />
      <Stack.Screen name="AdminFlats" component={AdminFlatsScreen} />
      <Stack.Screen name="AdminStaff" component={AdminStaffScreen} />
    </Stack.Navigator>
  );
};
