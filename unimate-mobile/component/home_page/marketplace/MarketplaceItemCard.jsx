import React, { useEffect, useState } from 'react';
import {
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { getMarketplaceImage } from '../../../constants/marketplaceImages';

export default function MarketplaceItemCard({
    item,
    onPress,
    isFavourite = false,
    onToggleFavourite,
}) {
    const [imageFailed, setImageFailed] = useState(false);

    useEffect(() => {
        setImageFailed(false);
    }, [item?.id, item?.title, item?.image_url]);

    if (!item) return null;

    const imageSource = getMarketplaceImage(item);
    const price = Number(item.price);

    const hasPrice =
        item.price !== null &&
        item.price !== undefined &&
        item.price !== '' &&
        Number.isFinite(price) &&
        price >= 0;

    const isSold = item.status === 'sold';

    const conditionLabel =
        item.condition === 'new'
            ? 'New'
            : item.condition === 'used'
              ? 'Used'
              : 'Condition unspecified';

    return (
        <View style={styles.card}>
            <TouchableOpacity
                onPress={() => onPress?.(item)}
                disabled={!onPress}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={`View ${item.title}`}
            >
                <View style={styles.imageContainer}>
                    {imageSource && !imageFailed ? (
                        <Image
                            source={imageSource}
                            style={styles.image}
                            resizeMode="cover"
                            accessibilityLabel={item.title}
                            onError={() => setImageFailed(true)}
                        />
                    ) : (
                        <View style={styles.placeholder}>
                            <Ionicons
                                name="cube-outline"
                                size={44}
                                color="#EA580C"
                            />
                            <Text style={styles.placeholderText}>
                                Your next campus find
                            </Text>
                        </View>
                    )}

                    <View style={styles.conditionBadge}>
                        <Text style={styles.conditionText}>
                            {conditionLabel}
                        </Text>
                    </View>

                    {isSold && (
                        <View style={styles.soldBadge}>
                            <Text style={styles.soldText}>
                                Sold
                            </Text>
                        </View>
                    )}
                </View>

                <View style={styles.content}>
                    <Text style={styles.category}>
                        {item.category_name || 'Marketplace'}
                    </Text>

                    <Text style={styles.title}>
                        {item.title}
                    </Text>

                    <View style={styles.priceRow}>
                        <Text style={styles.price}>
                            {hasPrice
                                ? `Rs. ${price.toLocaleString(
                                      'en-US',
                                      {
                                          minimumFractionDigits: 0,
                                          maximumFractionDigits: 2,
                                      }
                                  )}`
                                : 'Price unavailable'}
                        </Text>

                        {item.is_negotiable && (
                            <View style={styles.negotiableBadge}>
                                <Text style={styles.negotiableText}>
                                    Negotiable
                                </Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.locationRow}>
                        <Ionicons
                            name="location-outline"
                            size={16}
                            color="#9CA3AF"
                        />
                        <Text style={styles.location}>
                            {item.city || 'Location unspecified'}
                        </Text>
                    </View>

                    <View style={styles.footer}>
                        <View style={styles.sellerRow}>
                            <Ionicons
                                name="person-circle-outline"
                                size={19}
                                color="#9A3412"
                            />
                            <Text
                                style={styles.sellerName}
                                numberOfLines={1}
                            >
                                {item.seller_name || 'Seller'}
                            </Text>
                        </View>

                        <View style={styles.viewLabel}>
                            <Text style={styles.viewText}>
                                View item
                            </Text>
                            <Ionicons
                                name="arrow-forward"
                                size={16}
                                color="#EA580C"
                            />
                        </View>
                    </View>
                </View>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.heartButton}
                onPress={() => onToggleFavourite?.(item)}
                disabled={!onToggleFavourite}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel={
                    isFavourite
                        ? `Remove ${item.title} from favourites`
                        : `Add ${item.title} to favourites`
                }
                accessibilityState={{
                    selected: isFavourite,
                    disabled: !onToggleFavourite,
                }}
            >
                <Ionicons
                    name={
                        isFavourite ? 'heart' : 'heart-outline'
                    }
                    size={23}
                    color={isFavourite ? '#EF4444' : '#374151'}
                />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        marginBottom: 20,
        borderRadius: 22,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#F0E7DE',
        shadowColor: '#9A3412',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 2,
    },
    imageContainer: {
        height: 210,
        borderTopLeftRadius: 21,
        borderTopRightRadius: 21,
        overflow: 'hidden',
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
    },
    placeholderText: {
        marginTop: 10,
        fontSize: 13,
        color: '#9A3412',
    },
    conditionBadge: {
        position: 'absolute',
        top: 13,
        left: 13,
        maxWidth: '65%',
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 11,
        backgroundColor: '#FFFFFF',
    },
    conditionText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#9A3412',
    },
    soldBadge: {
        position: 'absolute',
        bottom: 13,
        left: 13,
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 10,
        backgroundColor: '#374151',
    },
    soldText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    heartButton: {
        position: 'absolute',
        top: 11,
        right: 11,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        padding: 18,
    },
    category: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.6,
        color: '#C2410C',
    },
    title: {
        marginTop: 7,
        fontSize: 21,
        fontWeight: '700',
        color: '#1F2937',
    },
    priceRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 10,
        marginTop: 12,
    },
    price: {
        fontSize: 23,
        fontWeight: '800',
        color: '#EA580C',
    },
    negotiableBadge: {
        paddingHorizontal: 9,
        paddingVertical: 5,
        borderRadius: 8,
        backgroundColor: '#FFF7ED',
    },
    negotiableText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#9A3412',
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginTop: 12,
    },
    location: {
        flex: 1,
        fontSize: 13,
        color: '#6B7280',
    },
    footer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        marginTop: 16,
        paddingTop: 14,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    sellerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        minWidth: 100,
        gap: 5,
    },
    sellerName: {
        flex: 1,
        fontSize: 12,
        color: '#6B7280',
    },
    viewLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    viewText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#EA580C',
    },
});
