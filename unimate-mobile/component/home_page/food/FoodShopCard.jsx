import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { getFoodShopImage } from '../../../constants/foodShopImages';

export default function FoodShopCard({ shop, onPress }) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [shop?.id, shop?.name, shop?.cover_image_url]);

  if (!shop) return null;

  const imageSource = getFoodShopImage(shop);

  const distance = Number(shop.distance_km);
  const hasDistance =
    shop.distance_km !== null &&
    shop.distance_km !== undefined &&
    Number.isFinite(distance) &&
    distance >= 0;

  const distanceLabel = hasDistance
    ? distance < 1
      ? `${Math.round(distance * 1000)} m`
      : `${distance.toFixed(1)} km`
    : null;

  const location =
    shop.address || shop.city || 'Location unavailable';

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => onPress?.(shop)}
      accessibilityRole="button"
      accessibilityLabel={`View menu at ${shop.name}`}
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
          <View style={styles.imagePlaceholder}>
            <View style={styles.placeholderIcon}>
              <Ionicons
                name="restaurant-outline"
                size={36}
                color="#EA580C"
              />
            </View>

            <Text style={styles.placeholderText}>
              Discover something delicious
            </Text>
          </View>
        )}

        <View style={styles.categoryBadge}>
          <Ionicons
            name="restaurant"
            size={13}
            color="#EA580C"
          />

          <Text style={styles.categoryText} numberOfLines={1}>
            {shop.category_name || 'Food shop'}
          </Text>
        </View>

        {distanceLabel && (
          <View style={styles.distanceBadge}>
            <Ionicons
              name="navigate-outline"
              size={13}
              color="#FFFFFF"
            />

            <Text style={styles.distanceText}>
              {distanceLabel}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={2}>
            {shop.name}
          </Text>

          <View style={styles.menuArrow}>
            <Ionicons
              name="arrow-forward"
              size={19}
              color="#EA580C"
            />
          </View>
        </View>

        <View style={styles.locationRow}>
          <Ionicons
            name="location-outline"
            size={16}
            color="#9CA3AF"
          />

          <Text style={styles.address} numberOfLines={2}>
            {location}
          </Text>
        </View>

        <View style={styles.badges}>
          {shop.pickup_available && (
            <View style={styles.serviceBadge}>
              <Ionicons
                name="bag-handle-outline"
                size={14}
                color="#57534E"
              />

              <Text style={styles.serviceText}>Pickup</Text>
            </View>
          )}

          {shop.delivery_available && (
            <View style={styles.serviceBadge}>
              <Ionicons
                name="bicycle-outline"
                size={15}
                color="#57534E"
              />

              <Text style={styles.serviceText}>Delivery</Text>
            </View>
          )}

          {shop.is_open_24h && (
            <View style={[styles.serviceBadge, styles.hoursBadge]}>
              <Ionicons
                name="time-outline"
                size={14}
                color="#15803D"
              />

              <Text style={styles.hoursText}>Open 24 hours</Text>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerHint}>
            Find your next favourite meal
          </Text>

          <View style={styles.menuLabel}>
            <Text style={styles.menuText}>View menu</Text>

            <Ionicons
              name="chevron-forward"
              size={14}
              color="#EA580C"
            />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#F0E7DE',
    marginBottom: 18,
    shadowColor: '#7C2D12',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },

  imageContainer: {
    height: 180,
    backgroundColor: '#FFF1E4',
    borderTopLeftRadius: 21,
    borderTopRightRadius: 21,
    overflow: 'hidden',
  },

  image: {
    width: '100%',
    height: '100%',
  },

  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },

  placeholderIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  placeholderText: {
    marginTop: 12,
    fontSize: 12,
    fontWeight: '500',
    color: '#9A3412',
    textAlign: 'center',
  },

  categoryBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    maxWidth: '65%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 12,
  },

  categoryText: {
    flexShrink: 1,
    fontSize: 11,
    fontWeight: '700',
    color: '#EA580C',
  },

  distanceBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(28, 25, 23, 0.8)',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 12,
  },

  distanceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  content: {
    padding: 16,
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  name: {
    flex: 1,
    fontSize: 19,
    lineHeight: 26,
    fontWeight: '700',
    color: '#1C1917',
  },

  menuArrow: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
  },

  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 9,
  },

  address: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: '#78716C',
  },

  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },

  serviceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9,
    backgroundColor: '#F5F5F4',
  },

  serviceText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#57534E',
  },

  hoursBadge: {
    backgroundColor: '#F0FDF4',
  },

  hoursText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#15803D',
  },

  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F4',
    marginTop: 16,
    paddingTop: 12,
  },

  footerHint: {
    flexShrink: 1,
    fontSize: 11,
    color: '#A8A29E',
  },

  menuLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },

  menuText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EA580C',
  },
});