/**
 * Main Tabs - \u0130\u015F Listesi, Ba\u015Fvurular, \u0130lanlar (i\u015Fveren), Mesajlar, Profil
 */

import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { COLORS } from '../config'

import { JobsScreen } from '../screens/JobsScreen'
import { ApplicationsScreen } from '../screens/ApplicationsScreen'
import { MessagesScreen } from '../screens/MessagesScreen'
import { ProfileScreen } from '../screens/ProfileScreen'
import { useAuthStore } from '../store/auth'

export type MainTabsParamList = {
  Jobs: undefined
  Applications: undefined
  Messages: undefined
  Profile: undefined
}

const Tab = createBottomTabNavigator<MainTabsParamList>()

export function MainTabs() {
  const { user } = useAuthStore()
  const isEmployer = user?.role === 'EMPLOYER'

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
          borderTopColor: COLORS.border,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Jobs"
        component={JobsScreen}
        options={{
          title: '\u0130\u015Fler',
          tabBarIcon: ({ color, size }) => (
            <Icon name="briefcase-search" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Applications"
        component={ApplicationsScreen}
        options={{
          title: isEmployer ? '\u0130lanlar\u0131m' : 'Ba\u015Fvurular',
          tabBarIcon: ({ color, size }) => (
            <Icon name="clipboard-text" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Messages"
        component={MessagesScreen}
        options={{
          title: 'Mesajlar',
          tabBarIcon: ({ color, size }) => (
            <Icon name="chat" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => (
            <Icon name="account" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  )
}
