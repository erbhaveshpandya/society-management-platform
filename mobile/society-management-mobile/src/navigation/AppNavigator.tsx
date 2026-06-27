import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { AuthStack } from './AuthStack';
import { ResidentStack } from './ResidentStack';
import { SecurityStack } from './SecurityStack';
import { AdminStack } from './AdminStack';
import { LoadingState } from '../components/LoadingState';

const Stack = createNativeStackNavigator();

export const AppNavigator: React.FC = () => {
  const { token, user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingState message="Restoring session..." fullScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {token === null || user === null ? (
          <Stack.Screen name="Auth" component={AuthStack} />
        ) : (
          <>
            {user.role === 'Resident' && (
              <Stack.Screen name="Resident" component={ResidentStack} />
            )}
            {user.role === 'SecurityGuard' && (
              <Stack.Screen name="Security" component={SecurityStack} />
            )}
            {(user.role === 'SuperAdmin' || user.role === 'SocietyAdmin') && (
              <Stack.Screen name="Admin" component={AdminStack} />
            )}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
