import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFoodShopImage } from '../../constants/foodShopImages';

const API_BASE_URL = 'http://10.0.2.2:5000/api';

const PHARMACY_IMAGES = {
  'happy health pharmacy': require(
    '../../assets/pharmacies/happy-health-pharmacy.png'
  ),
  'sumudu pharmacy': require(
    '../../assets/pharmacies/sumudu-pharmacy.png'
  ),
  'health ceylon pharmacy': require(
    '../../assets/pharmacies/health-ceylon-pharmacy.png'
  ),
};

function getImage(item) {
  if (item.kind === 'food') {
    return getFoodShopImage(item);
  }

  const url =
    item.kind === 'boarding'
      ? item.image_url
      : item.cover_image_url;

  if (typeof url === 'string' && url.trim()) {
    return { uri: url.trim() };
  }

  if (item.kind === 'pharmacy') {
    return PHARMACY_IMAGES[item.name?.trim().toLowerCase()] || null;
  }

  return null;
}

function getDistance(value) {
  const distance = Number(value);

  if (
    value === null ||
    value === undefined ||
    !Number.isFinite(distance) ||
    distance < 0
  ) {
    return null;
  }

  return distance;
}

function formatDistance(value) {
  return value < 1
    ? `${Math.round(value * 1000)} m`
    : `${value.toFixed(1)} km`;
}

function getStatus(item) {
  if (item.kind === 'boarding') {
    if (item.available_rooms === null ||
        item.available_rooms === undefined) {
      return { text: 'Availability unknown', tone: 'neutral' };
    }

    const rooms = Number(item.available_rooms);

    if (!Number.isFinite(rooms) || rooms < 0) {
      return { text: 'Availability unknown', tone: 'neutral' };
    }

    return rooms > 0
      ? { text: 'Rooms available', tone: 'green' }
      : { text: 'Full', tone: 'red' };
  }

  if (
    item.kind === 'pharmacy' &&
    item.opening_status === 'unknown'
  ) {
    return { text: 'Hours unavailable', tone: 'neutral' };
  }

  if (item.is_open_now === true) {
    return { text: 'Open', tone: 'green' };
  }

  if (item.is_open_now === false) {
    return { text: 'Closed', tone: 'red' };
  }

  return { text: 'Hours unavailable', tone: 'neutral' };
}

function NearbyCard({ item, onPress }) {
  const [imageFailed, setImageFailed] = useState(false);

  const source = getImage(item);
  const status = getStatus(item);
  const icon =
    item.kind === 'food'
      ? 'restaurant-outline'
      : item.kind === 'boarding'
        ? 'home-outline'
        : 'medkit-outline';

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Open ${item.name}`}
    >
      {source && !imageFailed ? (
        <Image
          source={source}
          style={styles.thumbnail}
          resizeMode="cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Ionicons name={icon} size={28} color="#FB923C" />
        </View>
      )}

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>

        <View style={styles.subRow}>
          <Text style={styles.category}>{item.categoryLabel}</Text>
          <Text style={styles.distance}>
            • {formatDistance(item.distance_km)}
          </Text>
        </View>

        <View
          style={[
            styles.badge,
            status.tone === 'green'
              ? styles.greenBadge
              : status.tone === 'red'
                ? styles.redBadge
                : styles.neutralBadge,
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              status.tone === 'green'
                ? styles.greenText
                : status.tone === 'red'
                  ? styles.redText
                  : styles.neutralText,
            ]}
          >
            {status.text}
          </Text>
        </View>
      </View>

      <Ionicons
        name="chevron-forward"
        size={18}
        color="#A8A29E"
      />
    </TouchableOpacity>
  );
}

export default function NearYou() {
  const router = useRouter();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [warning, setWarning] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      let busy = false;
      let hasLoaded = false;
      let controller;

      const loadNearby = async () => {
        if (!active || busy) return;

        busy = true;
        controller = new AbortController();

        if (!hasLoaded) {
          setLoading(true);
          setItems([]);
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
            setItems([]);
            setWarning('');
            setMessage(
              'Log in and select your university in your profile to see nearby places.'
            );
            return;
          }

          const sources = [
            {
              path: `food/university/${universityId}`,
              key: 'shops',
              kind: 'food',
              label: 'Food',
            },
            {
              path: `pharmacy/university/${universityId}`,
              key: 'pharmacies',
              kind: 'pharmacy',
              label: 'Pharmacy',
            },
            {
              path: `boardings/university/${universityId}`,
              key: 'boardings',
              kind: 'boarding',
              label: 'Boarding',
            },
          ];

          const results = await Promise.allSettled(
            sources.map(async (source) => {
              const response = await fetch(
                `${API_BASE_URL}/${source.path}`,
                { signal: controller.signal }
              );

              const data = await response.json();

              if (!response.ok || !Array.isArray(data[source.key])) {
                throw new Error(`Unable to load ${source.label}`);
              }

              return data[source.key]
                .filter((item) => {
                  // The existing boarding list also returns unpublished rows.
                  return source.kind !== 'boarding' ||
                    item.status === 'published';
                })
                .map((item) => ({
                  ...item,
                  kind: source.kind,
                  categoryLabel: source.kind === 'pharmacy'
                    ? item.category_name || source.label
                    : source.label,
                  name: source.kind === 'boarding'
                    ? item.title
                    : item.name,
                  distance_km: getDistance(item.distance_km),
                }))
                .filter(
                  (item) =>
                    item.distance_km !== null &&
                    item.distance_km <= 5
                );
            })
          );

          if (!active) return;

          const combined = [];
          const failed = [];

          results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
              combined.push(...result.value);
            } else {
              failed.push(sources[index].label);
            }
          });

          combined.sort(
            (a, b) =>
              a.distance_km - b.distance_km ||
              String(a.name).localeCompare(String(b.name)) ||
              `${a.kind}:${a.id}`.localeCompare(`${b.kind}:${b.id}`)
          );

          setItems(combined);
          setMessage(
            failed.length === sources.length
              ? 'Unable to load nearby places. Check your connection and try again.'
              : ''
          );
          setWarning(
            failed.length > 0 && failed.length < sources.length
              ? `Could not load: ${failed.join(', ')}.`
              : ''
          );
        } catch {
          if (active) {
            setItems([]);
            setWarning('');
            setMessage('Unable to load nearby places. Please try again.');
          }
        } finally {
          busy = false;
          hasLoaded = true;

          if (active) setLoading(false);
        }
      };

      loadNearby();

      const timer = setInterval(loadNearby, 60000);

      return () => {
        active = false;
        clearInterval(timer);
        controller?.abort();
      };
    }, [reloadKey])
  );

  const openItem = (item) => {
    if (item.kind === 'food') {
      router.push({
        pathname: '/food/[id]',
        params: { id: item.id },
      });
    } else if (item.kind === 'boarding') {
      router.push({
        pathname: '/boardings/[id]',
        params: { id: item.id },
      });
    } else {
      router.push('/pharmacy');
    }
  };

  const visibleItems = expanded ? items : items.slice(0, 4);

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <View style={styles.headingContent}>
          <Text style={styles.heading}>Near your campus</Text>
          <Text style={styles.subtitle}>
            Places within 5 km of your university
          </Text>
        </View>

        {items.length > 4 ? (
          <TouchableOpacity
            style={styles.seeAllButton}
            onPress={() => setExpanded((value) => !value)}
            accessibilityRole="button"
            accessibilityState={{ expanded }}
          >
            <Text style={styles.seeAll}>
              {expanded ? 'Show less' : 'See all'}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {warning ? (
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>{warning}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => setReloadKey((value) => value + 1)}
            accessibilityRole="button"
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.messageBox}>
          <ActivityIndicator color="#F97316" />
          <Text style={styles.messageText}>
            Finding nearby places...
          </Text>
        </View>
      ) : message || items.length === 0 ? (
        <View style={styles.messageBox}>
          <Ionicons
            name="location-outline"
            size={30}
            color="#FB923C"
          />
          <Text style={styles.messageText}>
            {message || 'No nearby listings found for your campus yet.'}
          </Text>

          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => setReloadKey((value) => value + 1)}
            accessibilityRole="button"
          >
            <Text style={styles.retryText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.list}>
          {visibleItems.map((item) => (
            <NearbyCard
              key={`${item.kind}:${item.id}:${
                item.image_url || item.cover_image_url || ''
              }`}
              item={item}
              onPress={() => openItem(item)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginVertical: 15,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headingContent: {
    flex: 1,
    marginRight: 8,
  },
  heading: {
    fontSize: 18,
    fontWeight: '700',
    color: '#332211',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 12,
    color: '#78716C',
  },
  seeAllButton: {
    minHeight: 44,
    justifyContent: 'center',
  },
  seeAll: {
    fontSize: 13,
    fontWeight: '600',
    color: '#EA580C',
  },
  list: {
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  thumbnail: {
    width: 68,
    height: 68,
    borderRadius: 12,
  },
  imagePlaceholder: {
    width: 68,
    height: 68,
    borderRadius: 12,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    marginLeft: 12,
    marginRight: 6,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: '#292524',
  },
  subRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 5,
  },
  category: {
    fontSize: 11,
    fontWeight: '600',
    color: '#EA580C',
  },
  distance: {
    fontSize: 11,
    color: '#78716C',
  },
  badge: {
    alignSelf: 'flex-start',
    marginTop: 7,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  greenBadge: { backgroundColor: '#DCFCE7' },
  greenText: { color: '#15803D' },
  redBadge: { backgroundColor: '#FEE2E2' },
  redText: { color: '#B91C1C' },
  neutralBadge: { backgroundColor: '#F5F5F4' },
  neutralText: { color: '#78716C' },
  messageBox: {
    padding: 24,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FFEDD5',
    alignItems: 'center',
    gap: 10,
  },
  messageText: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    color: '#78716C',
  },
  warningBox: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FFF7ED',
  },
  warningText: {
    fontSize: 12,
    color: '#9A3412',
  },
  retryButton: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 9,
    backgroundColor: '#FFF7ED',
  },
  retryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EA580C',
  },
});