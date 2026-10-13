import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import HomeNav from './HomeNav';
import ExploreNav from './ExploreNav';
import ChatNav from './ChatNav';

export default function NavigationBar() {
  const [activeTab, setActiveTab] = useState('Home');

  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const notificationsActive = pathname === '/notifications';

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: Math.max(insets.bottom, 10) },
      ]}
    >
      <HomeNav
        active={!notificationsActive && activeTab === 'Home'}
        onPress={() => {
          setActiveTab('Home');

          if (notificationsActive) {
            router.replace('/home_page');
          }
        }}
      />

      <ExploreNav
        active={!notificationsActive && activeTab === 'Explore'}
        onPress={() => setActiveTab('Explore')}
      />

      <ChatNav
        active={!notificationsActive && activeTab === 'Chats'}
        onPress={() => setActiveTab('Chats')}
      />

      <TouchableOpacity
        style={styles.notificationTab}
        activeOpacity={0.7}
        onPress={() => {
          if (!notificationsActive) {
            router.push('/notifications');
          }
        }}
        accessibilityRole="button"
        accessibilityLabel="Notifications"
        accessibilityState={{ selected: notificationsActive }}
      >
        <Ionicons
          name={
            notificationsActive
              ? 'notifications'
              : 'notifications-outline'
          }
          size={25}
          color={notificationsActive ? '#F97316' : '#858585'}
        />

        <Text
          style={[
            styles.label,
            notificationsActive && styles.activeLabel,
          ]}
        >
          Notifications
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFBEB',
    paddingTop: 10,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#FFEDD5',
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  notificationTab: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    gap: 5,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    color: '#858585',
  },
  activeLabel: {
    color: '#F97316',
  },
});