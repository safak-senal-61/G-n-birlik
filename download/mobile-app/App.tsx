import React, { useEffect, useState } from 'react'
import { StatusBar } from 'expo-status-bar'
import { NavigationContainer } from '@react-navigation/native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'

import { useAuthStore } from './src/store/auth'
import { RootNavigator } from './src/navigation/RootNavigator'
import { LoadingScreen } from './src/screens/LoadingScreen'
import { toastConfig } from './src/components/ToastConfig'

export default function App() {
  const { initialize, isLoading } = useAuthStore()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    initialize().finally(() => setReady(true))
  }, [])

  if (!ready || isLoading) {
    return <LoadingScreen />
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <RootNavigator />
      </NavigationContainer>
      <Toast config={toastConfig} />
    </SafeAreaProvider>
  )
}
