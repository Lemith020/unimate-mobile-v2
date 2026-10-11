import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import FoodShopCard from '../../component/home_page/food/FoodShopCard';

const API_URL = 'http://10.0.2.2:5000/api/food';

type FoodShop = {
  id: string;
  name: string;
  address?: string | null;
  city?: string | null;
  category_name?: string | null;
  cover_image_url?: string | null;
  distance_km?: number | null;
  pickup_available?: boolean;
  delivery_available?: boolean;
  is_open_24h?: boolean;
};

type ShopsResponse = {
  university?: {
    id: number;
    name: string;
  };
  shops?: FoodShop[];
  error?: string;
};

export default function FoodShopsScreen() {
  const router = useRouter();

  const [shops, setShops] = useState<FoodShop[]>([]);
  const [universityName, setUniversityName] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [needsLogin, setNeedsLogin] = useState(false);

  const requestRef = useRef<AbortController | null>(null);

  const loadShops = useCallback(async (isRefresh = false) => {
    // Cancel an older request before starting another.
    requestRef.current?.abort();

    const controller = new AbortController();
    requestRef.current = controller;

    const isCurrentRequest = () =>
      requestRef.current === controller &&
      !controller.signal.aborted;

    setError('');
    setNeedsLogin(false);

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const storedUser = await AsyncStorage.getItem('userData');

      if (!isCurrentRequest()) return;

      if (!storedUser) {
        setShops([]);
        setUniversityName('');
        setNeedsLogin(true);
        setError('Log in to find food shops near your university.');
        return;
      }

      const user = JSON.parse(storedUser);
      const universityId = Number(user?.profile?.university_id);

      if (
        !Number.isInteger(universityId) ||
        universityId <= 0
      ) {
        setShops([]);
        setUniversityName('');
        setError('Please select your university in your profile.');
        return;
      }

      setUniversityName(user?.profile?.university_name || '');

      const response = await fetch(
        `${API_URL}/university/${universityId}`,
        { signal: controller.signal }
      );

      const data: ShopsResponse = await response.json();

      if (!isCurrentRequest()) return;

      if (!response.ok) {
        throw new Error(data.error || 'Unable to load food shops.');
      }

      if (!Array.isArray(data.shops)) {
        throw new Error('The server returned an invalid shop list.');
      }

      setShops(data.shops);
      setUniversityName(
        data.university?.name ||
          user?.profile?.university_name ||
          'Your university'
      );
    } catch (caughtError) {
      if (!isCurrentRequest()) return;

      setShops([]);

      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Could not load food shops. Please try again.'
      );
    } finally {
      if (isCurrentRequest()) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadShops();

      return () => {
        requestRef.current?.abort();
      };
    }, [loadShops])
  );

  const query = search.trim().toLowerCase();

  const filteredShops = shops.filter((shop) => {
    const searchableText = [
      shop.name,
      shop.address,
      shop.city,
      shop.category_name,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return searchableText.includes(query);
  });

  const openShop = (shop: FoodShop) => {
    router.push({
      pathname: '/food/[id]',
      params: { id: shop.id },
    });
  };

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/home_page');
    }
  };

  return (
    <SafeAreaView
      style={styles.screen}
      edges={['top', 'bottom', 'left', 'right']}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={goBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={22} color="#1C1917" />
        </TouchableOpacity>

        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Food near campus</Text>
          <Text style={styles.headerSubtitle}>
            Good food, closer to you
          </Text>
        </View>

        <View style={styles.headerIcon}>
          <Ionicons
            name="restaurant-outline"
            size={23}
            color="#EA580C"
          />
        </View>
      </View>

      <FlatList
        data={loading || error ? [] : filteredShops}
        keyExtractor={(shop) => shop.id}
        renderItem={({ item }) => (
          <FoodShopCard shop={item} onPress={openShop} />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void loadShops(true)}
            tintColor="#EA580C"
            colors={['#EA580C']}
          />
        }
        ListHeaderComponent={
          <View>
            <View style={styles.hero}>
              <View style={styles.heroBadge}>
                <Ionicons
                  name="sparkles-outline"
                  size={14}
                  color="#EA580C"
                />
                <Text style={styles.heroBadgeText}>
                  YOUR CAMPUS FOOD GUIDE
                </Text>
              </View>

              <Text style={styles.heroTitle}>
                What sounds{'\n'}good today?
              </Text>

              <Text style={styles.heroDescription}>
                Discover a tasty break between lectures.
              </Text>

              {!!universityName && (
                <View style={styles.universityRow}>
                  <Ionicons
                    name="school-outline"
                    size={17}
                    color="#9A3412"
                  />
                  <Text style={styles.universityName}>
                    {universityName}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.searchBox}>
              <Ionicons
                name="search-outline"
                size={21}
                color="#EA580C"
              />

              <TextInput
                style={styles.searchInput}
                placeholder="Search shops or locations..."
                placeholderTextColor="#A8A29E"
                value={search}
                onChangeText={setSearch}
                autoCorrect={false}
                returnKeyType="search"
                accessibilityLabel="Search food shops"
              />

              {!!search && (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() => setSearch('')}
                  accessibilityRole="button"
                  accessibilityLabel="Clear search"
                >
                  <Ionicons
                    name="close-circle"
                    size={20}
                    color="#A8A29E"
                  />
                </TouchableOpacity>
              )}
            </View>

            {!loading && !error && (
              <View style={styles.sectionHeading}>
                <Text style={styles.sectionTitle}>
                  {query ? 'Search results' : 'Explore food shops'}
                </Text>

                <Text style={styles.shopCount}>
                  {filteredShops.length}{' '}
                  {filteredShops.length === 1 ? 'shop' : 'shops'}
                </Text>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.stateCard}>
              <ActivityIndicator size="large" color="#EA580C" />
              <Text style={styles.stateTitle}>
                Finding your next meal
              </Text>
              <Text style={styles.stateDescription}>
                Loading shops near your university…
              </Text>
            </View>
          ) : error ? (
            <View style={styles.stateCard}>
              <View style={styles.stateIcon}>
                <Ionicons
                  name={needsLogin ? 'person-outline' : 'alert-circle-outline'}
                  size={30}
                  color="#EA580C"
                />
              </View>

              <Text style={styles.stateTitle}>
                {needsLogin ? 'Welcome to your food guide' : 'Unable to load shops'}
              </Text>

              <Text style={styles.stateDescription}>{error}</Text>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() =>
                  needsLogin
                    ? router.push('/login')
                    : void loadShops()
                }
                accessibilityRole="button"
              >
                <Text style={styles.actionText}>
                  {needsLogin ? 'Log in' : 'Try again'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.stateCard}>
              <View style={styles.stateIcon}>
                <Ionicons
                  name={query ? 'search-outline' : 'storefront-outline'}
                  size={30}
                  color="#EA580C"
                />
              </View>

              <Text style={styles.stateTitle}>
                {query ? 'No matching shops' : 'No food shops nearby yet'}
              </Text>

              <Text style={styles.stateDescription}>
                {query
                  ? 'Try another shop name or location.'
                  : 'No published food shops were found within 5 km of your university.'}
              </Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFAF5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0E7DE',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F4',
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1917',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#A8A29E',
    marginTop: 4,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 32,
    width: '100%',
    maxWidth: 650,
    alignSelf: 'center',
  },
  hero: {
    backgroundColor: '#FFEDD5',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 24,
    padding: 22,
    marginBottom: 20,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroBadgeText: {
    flexShrink: 1,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#EA580C',
  },
  heroTitle: {
    fontSize: 30,
    lineHeight: 38,
    fontWeight: '800',
    color: '#7C2D12',
    marginTop: 14,
  },
  heroDescription: {
    fontSize: 13,
    lineHeight: 21,
    color: '#9A3412',
    marginTop: 10,
  },
  universityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 18,
  },
  universityName: {
    flex: 1,
    fontSize: 12,
    lineHeight: 19,
    fontWeight: '600',
    color: '#9A3412',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    minHeight: 54,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F0E7DE',
    borderRadius: 16,
    marginBottom: 22,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1C1917',
  },
  clearButton: {
    width: 32,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeading: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1917',
  },
  shopCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EA580C',
    backgroundColor: '#FFEDD5',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 10,
  },
  stateCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F0E7DE',
    borderRadius: 22,
    padding: 28,
    marginTop: 4,
  },
  stateIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1C1917',
    textAlign: 'center',
    marginTop: 16,
  },
  stateDescription: {
    fontSize: 13,
    lineHeight: 21,
    color: '#78716C',
    textAlign: 'center',
    marginTop: 8,
  },
  actionButton: {
    minHeight: 46,
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 13,
    backgroundColor: '#EA580C',
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});