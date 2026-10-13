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

const API_BASE_URL = 'http://10.0.2.2:5000/api';

const LOCAL_IMAGES = {
  camera: require('../../assets/marketplace-images/camera.png'),
  fan: require('../../assets/marketplace-images/fan.png'),
  phone: require('../../assets/marketplace-images/phone.png'),
};

function getItemImage(item) {
  if (typeof item.image_url === 'string' && item.image_url.trim()) {
    return { uri: item.image_url.trim() };
  }

  const title = item.title?.trim().toLowerCase();

  return LOCAL_IMAGES[title] || null;
}

function formatPrice(value) {
  if (value === null || value === undefined) {
    return 'Price unavailable';
  }

  const price = Number(value);

  if (!Number.isFinite(price) || price < 0) {
    return 'Price unavailable';
  }

  return `Rs. ${price.toLocaleString('en-LK')}`;
}

function ItemCard({ item, onPress }) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageSource = getItemImage(item);

  const condition =
    item.condition === 'new'
      ? 'New'
      : item.condition === 'used'
        ? 'Used'
        : null;

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`View ${item.title}`}
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
              name="bag-handle-outline"
              size={36}
              color="#FDBA74"
            />
            <Text style={styles.placeholderText}>
              Image unavailable
            </Text>
          </View>
        )}

        {condition ? (
          <View
            style={[
              styles.conditionBadge,
              condition === 'New' && styles.newBadge,
            ]}
          >
            <Text
              style={[
                styles.conditionText,
                condition === 'New' && styles.newText,
              ]}
            >
              {condition}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.name} numberOfLines={1}>
          {item.title}
        </Text>

        <Text style={styles.category} numberOfLines={1}>
          {item.category_name || 'Marketplace item'}
        </Text>

        <Text style={styles.price}>
          {formatPrice(item.price)}
        </Text>

        <View style={styles.locationRow}>
          <Ionicons
            name="location-outline"
            size={13}
            color="#78716C"
          />
          <Text style={styles.city} numberOfLines={1}>
            {item.city || 'Location not provided'}
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.viewText}>View item</Text>
          <Ionicons
            name="arrow-forward"
            size={15}
            color="#EA580C"
          />
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function MarketplaceSection() {
  const router = useRouter();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const controller = new AbortController();

      const loadItems = async () => {
        setLoading(true);
        setError('');
        setItems([]);

        try {
          const response = await fetch(
            `${API_BASE_URL}/marketplace/items?limit=6&offset=0`,
            { signal: controller.signal }
          );

          const data = await response.json();

          if (!response.ok) {
            throw new Error(
              data?.error || 'Unable to load marketplace items.'
            );
          }

          if (!Array.isArray(data.items)) {
            throw new Error('Invalid response from the server.');
          }

          if (active) {
            setItems(data.items);
          }
        } catch (loadError) {
          if (active && loadError?.name !== 'AbortError') {
            setError(
              loadError?.message ||
                'Unable to load marketplace items.'
            );
          }
        } finally {
          if (active) setLoading(false);
        }
      };

      loadItems();

      return () => {
        active = false;
        controller.abort();
      };
    }, [reloadKey])
  );

  const openMarketplace = () => {
    router.push('/marketplace');
  };

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <View style={styles.headingContent}>
          <Text style={styles.sectionTitle}>
            Latest in Marketplace
          </Text>
          <Text style={styles.subtitle}>
            Explore the latest listings
          </Text>
        </View>

        <TouchableOpacity
          style={styles.seeAllButton}
          activeOpacity={0.7}
          onPress={openMarketplace}
          accessibilityRole="button"
          accessibilityLabel="See all marketplace items"
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
            Loading latest listings...
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
            style={styles.actionButton}
            onPress={() => setReloadKey((value) => value + 1)}
            accessibilityRole="button"
          >
            <Text style={styles.actionText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.messageBox}>
          <Ionicons
            name="bag-handle-outline"
            size={30}
            color="#FB923C"
          />
          <Text style={styles.messageText}>
            No active marketplace listings yet.
          </Text>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={openMarketplace}
            accessibilityRole="button"
          >
            <Text style={styles.actionText}>
              Explore Marketplace
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {items.map((item) => (
            <ItemCard
              key={`${item.id}:${item.image_url || ''}`}
              item={item}
              onPress={() =>
                router.push({
                  pathname: '/marketplace/[id]',
                  params: { id: item.id },
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
  subtitle: {
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
    width: 180,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FFEDD5',
    overflow: 'hidden',
  },
  imageContainer: {
    height: 140,
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
    fontSize: 10,
    color: '#A8A29E',
  },
  conditionBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 7,
    backgroundColor: '#F5F5F4',
  },
  conditionText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#57534E',
  },
  newBadge: {
    backgroundColor: '#DCFCE7',
  },
  newText: {
    color: '#15803D',
  },
  cardBody: {
    padding: 12,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: '#292524',
  },
  category: {
    marginTop: 4,
    fontSize: 11,
    color: '#78716C',
  },
  price: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: '700',
    color: '#EA580C',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 8,
  },
  city: {
    flex: 1,
    fontSize: 10,
    color: '#78716C',
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
  viewText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EA580C',
  },
  messageBox: {
    marginHorizontal: 20,
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
  actionButton: {
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: '#FFF7ED',
  },
  actionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#EA580C',
  },
});