/**
 * Auth Stack - Login, Register, Forgot Password
 */

import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { LoginScreen } from '../screens/LoginScreen'
import { RegisterScreen } from '../screens/RegisterScreen'
import { ForgotPasswordScreen } from '../screens/ForgotPasswordScreen'

export type AuthStackParamList = {
  Login: undefined
  Register: undefined
  ForgotPassword: undefined
}

const Stack = createNativeStackNavigator<AuthStackParamList>()

export function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{
          headerShown: true,
          title: 'Kay\u0131t Ol',
          headerTintColor: '#10b981',
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={{
          headerShown: true,
          title: '\u015Eifre S\u0131f\u0131rlama',
          headerTintColor: '#10b981',
          headerShadowVisible: false,
        }}
      />
    </Stack.Navigator>
  )
}
