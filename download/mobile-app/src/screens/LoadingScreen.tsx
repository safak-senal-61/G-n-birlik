import React from 'react'
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native'
import { COLORS } from '../config'

export function LoadingScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.logo}>💼</Text>
        <Text style={styles.title}>G\u00FCn\u00FCbirlik \u0130\u015F Bul</Text>
        <Text style={styles.subtitle">Konum Bazl\u0131 \u0130\u015F Platformu</Text>
      </View>
      <ActivityIndicator size="large" color={COLORS.primary} style={styles.spinner} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  spinner: {
    marginTop: 20,
  },
})
