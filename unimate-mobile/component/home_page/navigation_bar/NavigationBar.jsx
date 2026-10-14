import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TABS = [
  {
    label: 'Home',
    route: '/home_page',
    icon: 'home-outline',
    activeIcon: 'home',
  },
  {
    label: 'Explore',
    route: '/explore',
    icon: 'compass-outline',
    activeIcon: 'compass',
  },
  {
    label: 'Orders',
    route: '/my-orders',
    icon: 'receipt-outline',
    activeIcon: 'receipt',
  },
  {
    label: 'Notifications',
    route: '/notifications',
    icon: 'notifications-outline',
    activeIcon: 'notifications',
  },
];

export default function NavigationBar() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const openTab = (route) => {
    if (pathname === route) return;

    if (route === '/home_page') {
      router.replace('/home_page');
    } else {
      router.push(route);
    }
  };

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: Math.max(insets.bottom, 10) },
      ]}
    >
      {TABS.map((tab) => {
        const active = pathname === tab.route;
        const color = active ? '#F97316' : '#78716C';

        return (
          <TouchableOpacity
            key={tab.route}
            style={styles.tab}
            activeOpacity={0.75}
            onPress={() => openTab(tab.route)}
            accessibilityRole="button"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected: active }}
          >
            <View
              style={[
                styles.iconContainer,
                active && styles.activeIconContainer,
              ]}
            >
              <Ionicons
                name={active ? tab.activeIcon : tab.icon}
                size={24}
                color={color}
              />
            </View>

            <Text
              style={[
                styles.label,
                { color },
                active && styles.activeLabel,
              ]}
              numberOfLines={1}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    paddingTop: 8,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: '#FFEDD5',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.08,
    shadowRadius: 5,
  },
  tab: {
    flex: 1,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  iconContainer: {
    width: 48,
    height: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIconContainer: {
    backgroundColor: '#FFEDD5',
  },
  label: {
    marginTop: 4,
    fontSize: 10,
    fontWeight: '500',
  },
  activeLabel: {
    fontWeight: '700',
  },
});