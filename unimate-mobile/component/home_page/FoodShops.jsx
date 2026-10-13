import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFoodShopImage } from '../../constants/foodShopImages';

const API_BASE_URL = 'http://10.0.2.2:5000/api';

function getClosingLabel(shop) {
  if (shop.is_open_24h) return 'Open 24 hours';

  const match = /^(\d{2}):(\d{2})/.exec(shop.closing_time || '');

  if (!match) return 'Open now';

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  const displayMinute =
    minute === 0 ? '' : `:${String(minute).padStart(2, '0')}`;

  return `Open till ${displayHour}${displayMinute} ${period}${
    shop.closes_tomorrow ? ' tomorrow' : ''
  }`;
}

function getDistanceLabel(value) {
  if (value === null || value === undefined) {
    return 'Near campus';
  }

  const distance = Number(value);

  if (!Number.isFinite(distance) || distance < 0) {
    return 'Near campus';
  }

  return distance < 1
    ? `${Math.round(distance * 1000)} m from campus`
    : `${distance.toFixed(1)} km from campus`;
}

function FoodShopCard({ shop, onPress }) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageSource = getFoodShopImage(shop);

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`View ${shop.name} menu`}
    >
      <View style={styles.imageContainer}>
        {imageSource && !imageFailed ? (
          <Image
            source={imageSource}
            style={styles.image}
            resizeMode="cover"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons
              name="restaurant-outline"
              size={38}
              color="#FDBA74"
            />
            <Text style={styles.placeholderText}>
              Image unavailable
            </Text>
          </View>
        )}

        <View style={styles.openBadge}>
          <View style={styles.openDot} />
          <Text style={styles.openBadgeText}>Open now</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.name} numberOfLines={1}>
          {shop.name}
        </Text>

        <Text style={styles.category} numberOfLines={1}>
          {shop.category_name || 'Food shop'}
        </Text>

        <View style={styles.infoRow}>
          <Ionicons
            name="time-outline"
            size={14}
            color="#15803D"
          />
          <Text style={styles.time}>
            {getClosingLabel(shop)}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons
            name="location-outline"
            size={14}
            color="#78716C"
          />
          <Text style={styles.distance}>
            {getDistanceLabel(shop.distance_km)}
          </Text>
        </View>

        <View style={styles.tags}>
          {shop.pickup_available ? (
            <View style={styles.tag}>
              <Text style={styles.tagText}>Pickup</Text>
            </View>
          ) : null}

          {shop.delivery_available ? (
            <View style={styles.tag}>
              <Text style={styles.tagText}>Delivery</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.footer}>
          <Text style={styles.menuText}>View menu</Text>
          <Ionicons
            name="arrow-forward"
            size={16}
            color="#EA580C"
          />
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function FoodShops() {
  const router = useRouter();

  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      let busy = false;
      let hasLoaded = false;
      let requestController;

      const loadShops = async () => {
        if (!active || busy) return;

        busy = true;
        requestController = new AbortController();

        if (!hasLoaded) {
          setLoading(true);
          setShops([]);
        }

        try {
          const storedUser = await AsyncStorage.getItem('userData');

          if (!active) return;

          const user = storedUser ? JSON.parse(storedUser) : null;
          const universityId = Number(user?.profile?.university_id);

          if (
            !Number.isInteger(universityId) ||
            universityId <= 0 ||
            universityId > 2147483647
          ) {
            setShops([]);
            setError('');
            setNotice(
              'Log in and select your university in your profile to see nearby food shops.'
            );
            return;
          }

          const response = await fetch(
            `${API_BASE_URL}/food/university/${universityId}`,
            { signal: requestController.signal }
          );

          const data = await response.json();

          if (!response.ok) {
            throw new Error(
              data?.error || 'Unable to load food shops.'
            );
          }

          if (!Array.isArray(data.shops)) {
            throw new Error('Invalid response from the server.');
          }

          if (active) {
            setShops(
              data.shops
                .filter((shop) => shop.is_open_now === true)
                .slice(0, 6)
            );
            setError('');
            setNotice('');
          }
        } catch (loadError) {
          if (active && loadError?.name !== 'AbortError') {
            // Avoid showing stale opening information.
            setShops([]);
            setNotice('');
            setError(
              loadError?.message || 'Unable to load food shops.'
            );
          }
        } finally {
          busy = false;
          hasLoaded = true;

          if (active) setLoading(false);
        }
      };

      loadShops();

      const refreshTimer = setInterval(loadShops, 60000);

      return () => {
        active = false;
        clearInterval(refreshTimer);
        requestController?.abort();
      };
    }, [reloadKey])
  );

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <View style={styles.headingContent}>
          <Text style={styles.sectionTitle}>
            Open now: Food Shops
          </Text>
          <Text style={styles.sectionSubtitle}>
            Find a meal near your campus
          </Text>
        </View>

        <TouchableOpacity
          style={styles.seeAllButton}
          activeOpacity={0.7}
          onPress={() => router.push('/food')}
          accessibilityRole="button"
          accessibilityLabel="See all food shops"
        >
          <Text style={styles.seeAll}>See all</Text>
          <Ionicons
            name="chevron-forward"
            size={14}
            color="#EA580C"
          />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.messageBox}>
          <ActivityIndicator color="#F97316" />
          <Text style={styles.messageText}>
            Finding open food shops...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.messageBox}>
          <Ionicons
            name="cloud-offline-outline"
            size={28}
            color="#EA580C"
          />
          <Text style={styles.messageText}>{error}</Text>

          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => setReloadKey((value) => value + 1)}
            accessibilityRole="button"
          >
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : notice || shops.length === 0 ? (
        <View style={styles.messageBox}>
          <Ionicons
            name="restaurant-outline"
            size={30}
            color="#FB923C"
          />
          <Text style={styles.messageText}>
            {notice ||
              'No food shops with confirmed opening hours are open near your campus right now.'}
          </Text>

          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => router.push('/food')}
            accessibilityRole="button"
          >
            <Text style={styles.retryText}>
              Browse all shops
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {shops.map((shop) => (
            <FoodShopCard
              key={`${shop.id}:${shop.cover_image_url || ''}`}
              shop={shop}
              onPress={() =>
                router.push({
                  pathname: '/food/[id]',
                  params: { id: shop.id },
                })
              }
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginVertical: 15,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  headingContent: {
    flex: 1,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#332211',
  },
  sectionSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: '#78716C',
  },
  seeAllButton: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  seeAll: {
    fontSize: 13,
    fontWeight: '600',
    color: '#EA580C',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    gap: 14,
  },
  card: {
    width: 230,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FFEDD5',
    overflow: 'hidden',
  },
  imageContainer: {
    height: 135,
    backgroundColor: '#FFF7ED',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  placeholderText: {
    fontSize: 11,
    color: '#A8A29E',
  },
  openBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  openDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
  },
  openBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  cardBody: {
    padding: 13,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: '#292524',
  },
  category: {
    marginTop: 4,
    marginBottom: 8,
    fontSize: 12,
    color: '#78716C',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 5,
  },
  time: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: '#15803D',
  },
  distance: {
    flex: 1,
    fontSize: 11,
    color: '#78716C',
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 11,
  },
  tag: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 7,
    backgroundColor: '#FFF7ED',
  },
  tagText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9A3412',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#FFF1E6',
  },
  menuText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EA580C',
  },
  messageBox: {
    marginHorizontal: 20,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFEDD5',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    gap: 10,
  },
  messageText: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    color: '#78716C',
  },
  retryButton: {
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: '#FFF7ED',
  },
  retryText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#EA580C',
  },
});