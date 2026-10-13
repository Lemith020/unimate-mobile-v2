import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import QuantitySelector from './QuantitySelector';

export default function FoodItemCard({
    food,
    imageSource = null,
    isFavourite = false,
    quantity = 1,
    onToggleFavourite,
    onQuantityChange,
    onBuy,
}) {
    const [imageFailed, setImageFailed] = useState(false);

    const remoteImageUrl =
        typeof food?.image_url === 'string'
            ? food.image_url.trim()
            : '';

    const source =
        imageSource ||
        (remoteImageUrl ? { uri: remoteImageUrl } : null);

    useEffect(() => {
        setImageFailed(false);
    }, [food?.id, remoteImageUrl, imageSource]);

    if (!food) return null;

    const price = Number(food.price);
    const hasValidPrice =
        food.price !== null &&
        food.price !== undefined &&
        food.price !== '' &&
        Number.isFinite(price) &&
        price >= 0;

    const isAvailable =
        food.is_available !== false &&
        food.is_available !== 0;

    const canBuy =
        isAvailable &&
        hasValidPrice &&
        Number.isInteger(quantity) &&
        quantity >= 1 &&
        typeof onBuy === 'function';

    const formatPrice = (value) =>
        `Rs. ${value.toFixed(2)}`;

    return (
        <View style={styles.card}>
            <View style={styles.imageContainer}>
                {source && !imageFailed ? (
                    <Image
                        source={source}
                        style={styles.image}
                        resizeMode="cover"
                        accessibilityLabel={food.name}
                        onError={() => setImageFailed(true)}
                    />
                ) : (
                    <View style={styles.imagePlaceholder}>
                        <Ionicons
                            name="restaurant-outline"
                            size={42}
                            color="#EA580C"
                        />

                        <Text style={styles.placeholderText}>
                            A little campus comfort
                        </Text>
                    </View>
                )}

                {!!food.category_name && (
                    <View style={styles.categoryBadge}>
                        <Text style={styles.categoryText}>
                            {food.category_name}
                        </Text>
                    </View>
                )}

                <TouchableOpacity
                    style={styles.heartButton}
                    onPress={() => onToggleFavourite?.(food)}
                    disabled={!onToggleFavourite}
                    activeOpacity={0.75}
                    accessibilityRole="button"
                    accessibilityLabel={
                        isFavourite
                            ? `Remove ${food.name} from favourites`
                            : `Add ${food.name} to favourites`
                    }
                    accessibilityState={{
                        selected: isFavourite,
                        disabled: !onToggleFavourite,
                    }}
                >
                    <Ionicons
                        name={
                            isFavourite
                                ? 'heart'
                                : 'heart-outline'
                        }
                        size={23}
                        color={
                            isFavourite
                                ? '#EF4444'
                                : '#374151'
                        }
                    />
                </TouchableOpacity>

                {!isAvailable && (
                    <View style={styles.unavailableBadge}>
                        <Text style={styles.unavailableText}>
                            Currently unavailable
                        </Text>
                    </View>
                )}
            </View>

            <View style={styles.content}>
                <Text style={styles.name}>
                    {food.name}
                </Text>

                {!!food.description && (
                    <Text style={styles.description}>
                        {food.description}
                    </Text>
                )}

                <View style={styles.priceRow}>
                    <Text style={styles.price}>
                        {hasValidPrice
                            ? formatPrice(price)
                            : 'Price unavailable'}
                    </Text>

                    <Text style={styles.portionText}>
                        Per item
                    </Text>
                </View>

                <View style={styles.divider} />

                <Text style={styles.quantityLabel}>
                    Quantity
                </Text>

                <View style={styles.actions}>
                    <QuantitySelector
                        quantity={quantity}
                        onChange={onQuantityChange}
                        disabled={
                            !isAvailable || !onQuantityChange
                        }
                    />

                    <TouchableOpacity
                        style={[
                            styles.buyButton,
                            !canBuy && styles.disabledBuyButton,
                        ]}
                        onPress={() => onBuy?.(food, quantity)}
                        disabled={!canBuy}
                        activeOpacity={0.8}
                        accessibilityRole="button"
                        accessibilityLabel={
                            canBuy
                                ? `Buy ${quantity} ${food.name}`
                                : `Buy ${food.name} unavailable`
                        }
                        accessibilityState={{
                            disabled: !canBuy,
                        }}
                    >
                        <Ionicons
                            name="bag-handle-outline"
                            size={18}
                            color="#FFFFFF"
                        />

                        <Text style={styles.buyText}>
                            Buy
                        </Text>
                    </TouchableOpacity>
                </View>

                {hasValidPrice && (
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>
                            Total
                        </Text>

                        <Text style={styles.totalPrice}>
                            {formatPrice(price * quantity)}
                        </Text>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        marginBottom: 18,
        backgroundColor: '#FFFFFF',
        borderRadius: 22,
        borderWidth: 1,
        borderColor: '#F0E7DE',
        shadowColor: '#9A3412',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 2,
    },
    imageContainer: {
        height: 190,
        backgroundColor: '#FFF7ED',
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
    },
    placeholderText: {
        marginTop: 10,
        fontSize: 13,
        fontWeight: '500',
        color: '#9A3412',
    },
    categoryBadge: {
        position: 'absolute',
        top: 14,
        left: 14,
        maxWidth: '65%',
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
    },
    categoryText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#9A3412',
    },
    heartButton: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    unavailableBadge: {
        position: 'absolute',
        bottom: 12,
        left: 12,
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 10,
        backgroundColor: '#374151',
    },
    unavailableText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    content: {
        padding: 18,
    },
    name: {
        fontSize: 19,
        fontWeight: '700',
        color: '#1F2937',
    },
    description: {
        marginTop: 7,
        fontSize: 13,
        lineHeight: 20,
        color: '#6B7280',
    },
    priceRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        marginTop: 12,
    },
    price: {
        fontSize: 20,
        fontWeight: '800',
        color: '#EA580C',
        marginRight: 10,
    },
    portionText: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    divider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginVertical: 16,
    },
    quantityLabel: {
        marginBottom: 8,
        fontSize: 12,
        fontWeight: '600',
        color: '#6B7280',
    },
    actions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
    },
    buyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 48,
        paddingHorizontal: 22,
        paddingVertical: 12,
        borderRadius: 15,
        backgroundColor: '#EA580C',
    },
    disabledBuyButton: {
        backgroundColor: '#9CA3AF',
    },
    buyText: {
        marginLeft: 7,
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    totalRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 14,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: '#FFF7ED',
    },
    totalLabel: {
        fontSize: 13,
        color: '#9A3412',
    },
    totalPrice: {
        fontSize: 15,
        fontWeight: '700',
        color: '#9A3412',
    },
});