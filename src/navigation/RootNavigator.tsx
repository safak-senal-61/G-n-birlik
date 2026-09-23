/**
 * Root Navigator - Auth durumuna g\u00F6re ekranlar\u0131 y\u00F6netir
 *
 * - Auth de\u011Filse: AuthStack (Login, Register, Forgot Password)
 * - Auth ise: MainTabs (\u0130\u015F Listesi, Ba\u015Fvurular, Mesajlar, Profil)
 * + Modal Stack: JobDetail, PostJob, Chat, Settings, 2FA
 */

import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'

import { useAuthStore } from '../store/auth'
import { AuthStack } from './AuthStack'
import { MainTabs } from './MainTabs'
import { JobDetailScreen } from '../screens/JobDetailScreen'
import { PostJobScreen } from '../screens/PostJobScreen'
import { ChatScreen } from '../screens/ChatScreen'
import { SecurityScreen } from '../screens/SecurityScreen'
import { TwoFASetupScreen } from '../screens/TwoFASetupScreen'

export type RootStackParamList = {
  MainTabs: undefined
  AuthStack: undefined
  JobDetail: { jobId: string }
  PostJob: undefined
  Chat: { conversationId: string; recipientName?: string }
  Security: undefined
  TwoFASetup: undefined
}

const Stack = createNativeStackNavigator<RootStackParamList>()

export function RootNavigator() {
  const { isAuthenticated } = useAuthStore()

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="AuthStack" component={AuthStack} />
        ) : (
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen
              name="JobDetail"
              component={JobDetailScreen}
              options={{
                headerShown: true,
                title: '\u0130\u015F Detay\u0131',
                headerTintColor: '#10b981',
              }}
            />
            <Stack.Screen
              name="PostJob"
              component={PostJobScreen}
              options={{
                headerShown: true,
                title: 'Yeni \u0130lan',
                headerTintColor: '#10b981',
              }}
            />
            <Stack.Screen
              name="Chat"
              component={ChatScreen}
              options={{
                headerShown: true,
                headerTintColor: '#10b981',
              }}
            />
            <Stack.Screen
              name="Security"
              component={SecurityScreen}
              options={{
                headerShown: true,
                title: 'G\u00FCvenlik',
                headerTintColor: '#10b981',
              }}
            />
            <Stack.Screen
              name="TwoFASetup"
              component={TwoFASetupScreen}
              options={{
                headerShown: true,
                title: '2FA Kurulumu',
                headerTintColor: '#10b981',
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}
