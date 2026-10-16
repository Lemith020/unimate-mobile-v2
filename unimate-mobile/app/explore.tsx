import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ImageSourcePropType,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

import NavigationBar from '../component/home_page/navigation_bar/NavigationBar';

const API_BASE_URL = 'http://10.0.2.2:5000/api';

type Category = 'all' | 'food' | 'pharmacy' | 'boarding';
type PlaceKind = Exclude<Category, 'all'>;

type Campus = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
};

type Place = {
  id: string;
  kind: PlaceKind;
  name: string;
  latitude: number;
  longitude: number;
  distance: number;
  imageUrl: string | null;
  isOpen: boolean | null;
  rooms: number | null;
};

const CATEGORY_INFO = {
  food: {
    label: 'Food',
    color: '#F97316',
    icon: 'restaurant' as const,
  },
  pharmacy: {
    label: 'Pharmacy',
    color: '#16A34A',
    icon: 'medkit' as const,
  },
  boarding: {
    label: 'Boarding',
    color: '#2563EB',
    icon: 'home' as const,
  },
};

const FILTERS: { key: Category; label: string }[] = [
  { key: 'all', label: 'All places' },
  { key: 'food', label: 'Food' },
  { key: 'pharmacy', label: 'Pharmacies' },
  { key: 'boarding', label: 'Boardings' },
];

const LOCAL_IMAGES: Record<string, ImageSourcePropType> = {
  'mathara bath kade': require('../assets/food-shops/mathara-bathkade.png'),
  keells: require('../assets/food-shops/keels.jpg'),
  kfc: require('../assets/food-shops/kfc.png'),
  'happy health pharmacy': require(
    '../assets/pharmacies/happy-health-pharmacy.png'
  ),
  'sumudu pharmacy': require('../assets/pharmacies/sumudu-pharmacy.png'),
  'health ceylon pharmacy': require(
    '../assets/pharmacies/health-ceylon-pharmacy.png'
  ),
};

function numberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function validCoordinates(
  latitude: number | null,
  longitude: number | null
) {
  return (
    latitude !== null &&
    longitude !== null &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

function normalizePlace(
  row: Record<string, unknown>,
  kind: PlaceKind
): Place | null {
  const latitude = numberOrNull(row.latitude);
  const longitude = numberOrNull(row.longitude);
  const distance = numberOrNull(row.distance_km);
  const name = kind === 'boarding' ? row.title : row.name;

  if (
    typeof row.id !== 'string' ||
    typeof name !== 'string' ||
    !validCoordinates(latitude, longitude) ||
    distance === null ||
    distance < 0 ||
    distance > 5
  ) {
    return null;
  }

  if (kind === 'boarding' && row.status !== 'published') return null;

  const image =
    kind === 'boarding' ? row.image_url : row.cover_image_url;

  return {
    id: row.id,
    kind,
    name,
    latitude: latitude!,
    longitude: longitude!,
    distance,
    imageUrl:
      typeof image === 'string' && image.trim()
        ? image.trim()
        : null,
    isOpen:
      row.is_open_now === true
        ? true
        : row.is_open_now === false
          ? false
          : null,
    rooms: numberOrNull(row.available_rooms),
  };
}

function getStatus(place: Place) {
  if (place.kind === 'boarding') {
    if (place.rooms === null || place.rooms < 0) {
      return 'Availability unknown';
    }

    return place.rooms > 0 ? 'Rooms available' : 'Full';
  }

  if (place.isOpen === null) return 'Hours unavailable';

  return place.isOpen ? 'Open now' : 'Closed';
}

function PlacePhoto({ place }: { place: Place }) {
  const [failed, setFailed] = useState(false);

  const source = place.imageUrl
    ? { uri: place.imageUrl }
    : LOCAL_IMAGES[place.name.trim().toLowerCase()];

  if (!source || failed) {
    return (
      <View style={styles.photoPlaceholder}>
        <Ionicons
          name={CATEGORY_INFO[place.kind].icon}
          size={30}
          color={CATEGORY_INFO[place.kind].color}
        />
      </View>
    );
  }

  return (
    <Image
      source={source}
      style={styles.photo}
      resizeMode="cover"
      onError={() => setFailed(true)}
    />
  );
}

export default function ExploreScreen() {
  const router = useRouter();

  const mapRef = useRef<MapView | null>(null);
  const locationBusy = useRef(false);
  const mounted = useRef(false);

  const [campus, setCampus] = useState<Campus | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [category, setCategory] = useState<Category>('all');
  const [selected, setSelected] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [locating, setLocating] = useState(false);
  const [showUserLocation, setShowUserLocation] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      mounted.current = true;

      const controller = new AbortController();

      async function loadMapData() {
        setLoading(true);
        setError('');
        setWarning('');
        setSelected(null);
        setPlaces([]);
        setCampus(null);

        try {
          const stored = await AsyncStorage.getItem('userData');

          if (!active) return;

          const user = stored ? JSON.parse(stored) : null;
          const universityId = Number(user?.profile?.university_id);

          if (
            !Number.isInteger(universityId) ||
            universityId <= 0 ||
            universityId > 2147483647
          ) {
            throw new Error(
              'Log in and select your university in your profile to explore nearby places.'
            );
          }

          const sources: {
            path: string;
            key: string;
            kind: PlaceKind;
          }[] = [
            {
              path: `food/university/${universityId}`,
              key: 'shops',
              kind: 'food',
            },
            {
              path: `pharmacy/university/${universityId}`,
              key: 'pharmacies',
              kind: 'pharmacy',
            },
            {
              path: `boardings/university/${universityId}`,
              key: 'boardings',
              kind: 'boarding',
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
                throw new Error(
                  data?.error || 'Unable to load places'
                );
              }

              return { source, data };
            })
          );

          if (!active) return;

          let university: Campus | null = null;
          const combined: Place[] = [];
          const failed: string[] = [];

          for (let index = 0; index < results.length; index++) {
            const result = results[index];

            if (result.status === 'rejected') {
              failed.push(
                CATEGORY_INFO[sources[index].kind].label
              );
              continue;
            }

            const { source, data } = result.value;
            const uni = data.university;

            const latitude = numberOrNull(uni?.latitude);
            const longitude = numberOrNull(uni?.longitude);

            if (
              !university &&
              uni &&
              validCoordinates(latitude, longitude)
            ) {
              university = {
                id: Number(uni.id),
                name: String(uni.name),
                latitude: latitude!,
                longitude: longitude!,
              };
            }

            for (const row of data[source.key]) {
              const place = normalizePlace(row, source.kind);

              if (place) combined.push(place);
            }
          }

          if (!university) {
            throw new Error(
              'Unable to load your university location. Please try again.'
            );
          }

          combined.sort((a, b) => a.distance - b.distance);

          setCampus(university);
          setPlaces(combined);
          setWarning(
            failed.length
              ? `Could not load: ${failed.join(', ')}. Tap refresh to retry.`
              : ''
          );
        } catch (loadError) {
          if (active && !controller.signal.aborted) {
            setError(
              loadError instanceof Error
                ? loadError.message
                : 'Unable to load the map.'
            );
          }
        } finally {
          if (active) setLoading(false);
        }
      }

      loadMapData();

      return () => {
        active = false;
        mounted.current = false;
        controller.abort();
      };
    }, [reloadKey])
  );

  const visiblePlaces = places.filter(
    (place) => category === 'all' || place.kind === category
  );

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/home_page');
    }
  };

  const centerCampus = () => {
    if (!campus) return;

    mapRef.current?.animateToRegion(
      {
        latitude: campus.latitude,
        longitude: campus.longitude,
        latitudeDelta: 0.055,
        longitudeDelta: 0.055,
      },
      500
    );
  };

  const findMyLocation = async () => {
    if (locationBusy.current) return;

    locationBusy.current = true;
    setLocating(true);

    try {
      const permission =
        await Location.requestForegroundPermissionsAsync();

      if (!mounted.current) return;

      if (permission.status !== 'granted') {
        Alert.alert(
          'Location permission',
          'Allow location access in phone settings to show your location. You can still explore your campus.'
        );
        return;
      }

      const enabled = await Location.hasServicesEnabledAsync();

      if (!mounted.current) return;

      if (!enabled) {
        Alert.alert(
          'Location is off',
          'Turn on your phone location and try again.'
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      if (!mounted.current) return;

      setShowUserLocation(true);

      mapRef.current?.animateToRegion(
        {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        },
        500
      );
    } catch {
      if (mounted.current) {
        Alert.alert(
          'Location unavailable',
          'Unable to find your location. Please try again.'
        );
      }
    } finally {
      locationBusy.current = false;

      if (mounted.current) setLocating(false);
    }
  };

  const openPlace = (place: Place) => {
    if (place.kind === 'food') {
      router.push({
        pathname: '/food/[id]',
        params: { id: place.id },
      });
    } else if (place.kind === 'boarding') {
      router.push({
        pathname: '/boardings/[id]',
        params: { id: place.id },
      });
    } else {
      router.push('/pharmacy');
    }
  };

  const openDirections = async (place: Place) => {
    const destination = `${place.latitude},${place.longitude}`;

    try {
      await Linking.openURL(
        `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`
      );
    } catch {
      Alert.alert('Unable to open maps', 'Please try again.');
    }
  };

  return (
    <SafeAreaView
      style={styles.screen}
      edges={['top', 'left', 'right']}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={goBack}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Ionicons
              name="arrow-back"
              size={23}
              color="#431407"
            />
          </TouchableOpacity>

          <View style={styles.headerText}>
            <Text style={styles.title}>Explore</Text>

            <Text style={styles.subtitle} numberOfLines={1}>
              {campus?.name || 'Discover places around campus'}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.iconButton}
            disabled={loading}
            onPress={() => setReloadKey((value) => value + 1)}
            accessibilityLabel="Refresh places"
            accessibilityRole="button"
          >
            <Ionicons
              name="refresh"
              size={22}
              color="#EA580C"
            />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#F97316" />

            <Text style={styles.message}>
              Loading your campus map...
            </Text>
          </View>
        ) : error || !campus ? (
          <View style={styles.center}>
            <Ionicons
              name="map-outline"
              size={48}
              color="#FB923C"
            />

            <Text style={styles.message}>
              {error || 'Map unavailable.'}
            </Text>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => setReloadKey((value) => value + 1)}
            >
              <Text style={styles.primaryText}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filters}
              >
                {FILTERS.map((filter) => (
                  <TouchableOpacity
                    key={filter.key}
                    style={[
                      styles.filter,
                      category === filter.key &&
                        styles.activeFilter,
                    ]}
                    onPress={() => {
                      setCategory(filter.key);
                      setSelected(null);
                    }}
                    accessibilityRole="button"
                    accessibilityState={{
                      selected: category === filter.key,
                    }}
                  >
                    <Text
                      style={[
                        styles.filterText,
                        category === filter.key &&
                          styles.activeFilterText,
                      ]}
                    >
                      {filter.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {!!warning && (
              <Text style={styles.warning}>{warning}</Text>
            )}

            <View style={styles.mapContainer}>
              <MapView
                ref={mapRef}
                style={StyleSheet.absoluteFill}
                initialRegion={{
                  latitude: campus.latitude,
                  longitude: campus.longitude,
                  latitudeDelta: 0.055,
                  longitudeDelta: 0.055,
                }}
                showsUserLocation={showUserLocation}
                showsMyLocationButton={false}
                onPress={() => setSelected(null)}
              >
                <Marker
                  coordinate={{
                    latitude: campus.latitude,
                    longitude: campus.longitude,
                  }}
                  title={campus.name}
                  description="Your university"
                  pinColor="#7C3AED"
                />

                {visiblePlaces.map((place) => (
                  <Marker
                    key={`${place.kind}:${place.id}`}
                    coordinate={{
                      latitude: place.latitude,
                      longitude: place.longitude,
                    }}
                    pinColor={CATEGORY_INFO[place.kind].color}
                    onPress={(event) => {
                      event.stopPropagation();
                      setSelected(place);
                    }}
                  />
                ))}
              </MapView>

              <View style={styles.countBadge}>
                <Ionicons
                  name="location"
                  size={15}
                  color="#EA580C"
                />

                <Text style={styles.countText}>
                  {visiblePlaces.length} places · within 5 km of campus
                </Text>
              </View>

              <View style={styles.mapControls}>
                <TouchableOpacity
                  style={styles.mapButton}
                  onPress={centerCampus}
                  accessibilityLabel="Center on university"
                  accessibilityRole="button"
                >
                  <Ionicons
                    name="school-outline"
                    size={23}
                    color="#EA580C"
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.mapButton}
                  onPress={findMyLocation}
                  disabled={locating}
                  accessibilityLabel="Show my location"
                  accessibilityRole="button"
                >
                  {locating ? (
                    <ActivityIndicator color="#EA580C" />
                  ) : (
                    <Ionicons
                      name="locate-outline"
                      size={24}
                      color="#EA580C"
                    />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {selected ? (
              <View style={styles.bottomCard}>
                <View style={styles.placeRow}>
                  <PlacePhoto
                    key={`${selected.kind}:${selected.id}:${selected.imageUrl}`}
                    place={selected}
                  />

                  <View style={styles.placeInfo}>
                    <Text
                      style={styles.placeName}
                      numberOfLines={1}
                    >
                      {selected.name}
                    </Text>

                    <Text style={styles.categoryText}>
                      {CATEGORY_INFO[selected.kind].label}
                      {' · '}
                      {selected.distance < 1
                        ? `${Math.round(selected.distance * 1000)} m`
                        : `${selected.distance.toFixed(1)} km`}
                      {' from campus'}
                    </Text>

                    <Text style={styles.status}>
                      {getStatus(selected)}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => setSelected(null)}
                    style={styles.closeButton}
                    accessibilityLabel="Close selected place"
                  >
                    <Ionicons
                      name="close"
                      size={22}
                      color="#78716C"
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.directionsButton}
                    onPress={() => openDirections(selected)}
                  >
                    <Ionicons
                      name="navigate-outline"
                      size={18}
                      color="#EA580C"
                    />

                    <Text style={styles.directionsText}>
                      Directions
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.detailsButton}
                    onPress={() => openPlace(selected)}
                  >
                    <Text style={styles.primaryText}>
                      {selected.kind === 'food'
                        ? 'View menu'
                        : selected.kind === 'boarding'
                          ? 'View boarding'
                          : 'View pharmacies'}
                    </Text>

                    <Ionicons
                      name="arrow-forward"
                      size={17}
                      color="#FFFFFF"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.bottomHint}>
                <Ionicons
                  name="hand-left-outline"
                  size={21}
                  color="#EA580C"
                />

                <Text style={styles.hintText}>
                  {visiblePlaces.length
                    ? 'Tap a pin to discover a place. Purple marks your university.'
                    : 'No places found in this category near your campus.'}
                </Text>
              </View>
            )}
          </>
        )}
      </View>

      <NavigationBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFF8EE',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    backgroundColor: '#FFFFFF',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#431407',
  },
  subtitle: {
    marginTop: 3,
    fontSize: 12,
    color: '#78716C',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    gap: 18,
  },
  message: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    color: '#78716C',
  },
  filters: {
    padding: 14,
    gap: 9,
  },
  filter: {
    paddingHorizontal: 17,
    paddingVertical: 12,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  activeFilter: {
    backgroundColor: '#F97316',
    borderColor: '#F97316',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9A3412',
  },
  activeFilterText: {
    color: '#FFFFFF',
  },
  warning: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    fontSize: 12,
    color: '#9A3412',
  },
  mapContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  countBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 11,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    elevation: 3,
  },
  countText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: '#57534E',
  },
  mapControls: {
    position: 'absolute',
    right: 14,
    bottom: 18,
    gap: 10,
  },
  mapButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  bottomCard: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#FFEDD5',
  },
  placeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  photo: {
    width: 68,
    height: 68,
    borderRadius: 13,
  },
  photoPlaceholder: {
    width: 68,
    height: 68,
    borderRadius: 13,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeInfo: {
    flex: 1,
  },
  placeName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#292524',
  },
  categoryText: {
    marginTop: 5,
    fontSize: 11,
    lineHeight: 17,
    color: '#EA580C',
  },
  status: {
    marginTop: 5,
    fontSize: 12,
    color: '#57534E',
  },
  closeButton: {
    padding: 10,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 15,
  },
  directionsButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: '#FFF7ED',
  },
  directionsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EA580C',
  },
  detailsButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: '#F97316',
  },
  primaryButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F97316',
  },
  primaryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bottomHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 18,
    backgroundColor: '#FFFFFF',
  },
  hintText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 19,
    color: '#78716C',
  },
});