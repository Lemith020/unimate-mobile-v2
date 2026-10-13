import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import {
    Stack,
    useLocalSearchParams,
    useRouter,
} from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { getMarketplaceImage } from '../../constants/marketplaceImages';
import {
    useMarketplaceFavourites,
    type MarketplaceItem,
} from '../../contexts/MarketplaceFavouritesContext';

const API_URL = 'http://10.0.2.2:5000/api/marketplace';

type ItemImage = {
    id: string;
    image_url: string;
    sort_order: number;
};

type ItemDetails = MarketplaceItem & {
    images?: ItemImage[];
};

type ItemResponse = {
    item?: ItemDetails;
    error?: string;
};

function cleanPhone(value?: string | null) {
    if (typeof value !== 'string') return null;

    const cleaned = value.trim().replace(/[\s()-]/g, '');

    return /^\+?\d{9,15}$/.test(cleaned)
        ? cleaned
        : null;
}

function getWhatsAppNumber(value?: string | null) {
    const phone = cleanPhone(value);

    if (!phone) return null;

    if (/^0\d{9}$/.test(phone)) {
        return `94${phone.slice(1)}`;
    }

    if (/^94\d{9}$/.test(phone)) {
        return phone;
    }

    if (/^\+[1-9]\d{8,14}$/.test(phone)) {
        return phone.slice(1);
    }

    return null;
}

export default function MarketplaceItemDetailsPage() {
    const router = useRouter();

    const params = useLocalSearchParams<{
        id?: string | string[];
    }>();

    const itemId = Array.isArray(params.id)
        ? params.id[0]
        : params.id;

    const {
        isLoading: favouritesLoading,
        storageError,
        isFavourite,
        toggleFavourite,
    } = useMarketplaceFavourites();

    const [item, setItem] = useState<ItemDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [retryCount, setRetryCount] = useState(0);
    const [selectedImage, setSelectedImage] = useState(0);
    const [failedImages, setFailedImages] = useState<
        Record<number, boolean>
    >({});
    const [contactBusy, setContactBusy] = useState(false);

    useEffect(() => {
        const controller = new AbortController();
        let active = true;

        async function loadItem() {
            setLoading(true);
            setError('');
            setItem(null);
            setSelectedImage(0);
            setFailedImages({});

            try {
                if (!itemId) {
                    throw new Error('The item ID is missing.');
                }

                const response = await fetch(
                    `${API_URL}/items/${encodeURIComponent(itemId)}`,
                    { signal: controller.signal }
                );

                const data =
                    (await response.json()) as ItemResponse;

                if (!active) return;

                if (!response.ok) {
                    throw new Error(
                        data.error || 'Unable to load this item.'
                    );
                }

                if (
                    !data.item ||
                    typeof data.item.id !== 'string' ||
                    typeof data.item.title !== 'string'
                ) {
                    throw new Error(
                        'Invalid item details received.'
                    );
                }

                const price = Number(data.item.price);

                if (
                    data.item.price === null ||
                    data.item.price === undefined ||
                    String(data.item.price).trim() === '' ||
                    !Number.isFinite(price) ||
                    price < 0
                ) {
                    throw new Error(
                        'The price for this item is unavailable.'
                    );
                }

                setItem({
                    ...data.item,
                    price,
                });
            } catch (caughtError) {
                if (!active) return;

                setError(
                    caughtError instanceof Error
                        ? caughtError.message
                        : 'Unable to load item details.'
                );
            } finally {
                if (active) setLoading(false);
            }
        }

        void loadItem();

        return () => {
            active = false;
            controller.abort();
        };
    }, [itemId, retryCount]);

    const goBack = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/marketplace');
        }
    };

    const phone = cleanPhone(item?.seller_phone);
    const whatsappNumber = getWhatsAppNumber(
        item?.seller_phone
    );

    const isActive = item?.status === 'active';
    const saved = item ? isFavourite(item.id) : false;

    const remoteImages = Array.isArray(item?.images)
        ? item.images.filter(
              (photo) =>
                  typeof photo.image_url === 'string' &&
                  photo.image_url.trim()
          )
        : [];

    const fallbackImage = item
        ? getMarketplaceImage(item)
        : null;

    const imageSources =
        remoteImages.length > 0
            ? remoteImages.map((photo) => ({
                  uri: photo.image_url.trim(),
              }))
            : fallbackImage
              ? [fallbackImage]
              : [];

    const activeImage = imageSources[selectedImage];

    const callSeller = async () => {
        if (!phone || !isActive || contactBusy) return;

        setContactBusy(true);

        try {
            await Linking.openURL(`tel:${phone}`);
        } catch {
            Alert.alert(
                'Unable to open dialer',
                'Please try calling the seller manually.'
            );
        } finally {
            setContactBusy(false);
        }
    };

    const messageSeller = async () => {
        if (
            !item ||
            !whatsappNumber ||
            !isActive ||
            contactBusy
        ) {
            return;
        }

        setContactBusy(true);

        const message =
            `Hello, I saw your "${item.title}" listing on Unimate.\n\n` +
            `Listed price: Rs. ${item.price.toFixed(2)}\n` +
            `Item ID: ${item.id}\n\n` +
            `Is this item still available?`;

        const encoded = encodeURIComponent(message);

        try {
            try {
                await Linking.openURL(
                    `whatsapp://send?phone=${whatsappNumber}&text=${encoded}`
                );
            } catch {
                await Linking.openURL(
                    `https://wa.me/${whatsappNumber}?text=${encoded}`
                );
            }
        } catch {
            Alert.alert(
                'Unable to open WhatsApp',
                'Please check that WhatsApp is available on your phone.'
            );
        } finally {
            setContactBusy(false);
        }
    };

    const canCall = isActive && !!phone && !contactBusy;
    const canWhatsApp =
        isActive && !!whatsappNumber && !contactBusy;

    return (
        <SafeAreaView style={styles.screen}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.headerButton}
                    onPress={goBack}
                    accessibilityRole="button"
                    accessibilityLabel="Go back"
                >
                    <Ionicons
                        name="arrow-back"
                        size={23}
                        color="#1F2937"
                    />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>
                    Item details
                </Text>

                <TouchableOpacity
                    style={styles.headerButton}
                    onPress={() => {
                        if (item) toggleFavourite(item);
                    }}
                    disabled={
                        !item ||
                        favouritesLoading ||
                        !!storageError
                    }
                    accessibilityRole="button"
                    accessibilityLabel={
                        saved
                            ? 'Remove from favourites'
                            : 'Add to favourites'
                    }
                    accessibilityState={{ selected: saved }}
                >
                    <Ionicons
                        name={saved ? 'heart' : 'heart-outline'}
                        size={24}
                        color={saved ? '#EF4444' : '#EA580C'}
                    />
                </TouchableOpacity>
            </View>

            {loading || error ? (
                <View style={styles.center}>
                    {loading ? (
                        <ActivityIndicator
                            size="large"
                            color="#EA580C"
                        />
                    ) : (
                        <Ionicons
                            name="alert-circle-outline"
                            size={46}
                            color="#EA580C"
                        />
                    )}

                    <Text style={styles.stateTitle}>
                        {loading
                            ? 'Loading your campus find…'
                            : 'Unable to load item'}
                    </Text>

                    {!!error && (
                        <>
                            <Text style={styles.stateText}>
                                {error}
                            </Text>
                            <TouchableOpacity
                                style={styles.retryButton}
                                onPress={() =>
                                    setRetryCount(
                                        (current) => current + 1
                                    )
                                }
                            >
                                <Text style={styles.whiteText}>
                                    Try again
                                </Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            ) : item ? (
                <ScrollView
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.imageContainer}>
                        {activeImage &&
                        !failedImages[selectedImage] ? (
                            <Image
                                source={activeImage}
                                style={styles.mainImage}
                                resizeMode="contain"
                                accessibilityLabel={item.title}
                                onError={() =>
                                    setFailedImages((current) => ({
                                        ...current,
                                        [selectedImage]: true,
                                    }))
                                }
                            />
                        ) : (
                            <View style={styles.placeholder}>
                                <Ionicons
                                    name="cube-outline"
                                    size={54}
                                    color="#EA580C"
                                />
                                <Text style={styles.description}>
                                    Image unavailable
                                </Text>
                            </View>
                        )}

                        {item.status === 'sold' && (
                            <View style={styles.soldBadge}>
                                <Text style={styles.whiteText}>
                                    Sold
                                </Text>
                            </View>
                        )}
                    </View>

                    {imageSources.length > 1 && (
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.thumbnails}
                        >
                            {imageSources.map((source, index) => (
                                <TouchableOpacity
                                    key={
                                        remoteImages[index]?.id ||
                                        String(index)
                                    }
                                    style={[
                                        styles.thumbnail,
                                        selectedImage === index &&
                                            styles.activeThumbnail,
                                    ]}
                                    onPress={() =>
                                        setSelectedImage(index)
                                    }
                                    accessibilityRole="button"
                                    accessibilityLabel={`View photo ${
                                        index + 1
                                    }`}
                                >
                                    {failedImages[index] ? (
                                        <Ionicons
                                            name="image-outline"
                                            size={24}
                                            color="#9CA3AF"
                                        />
                                    ) : (
                                        <Image
                                            source={source}
                                            style={styles.thumbnailImage}
                                            resizeMode="cover"
                                            onError={() =>
                                                setFailedImages(
                                                    (current) => ({
                                                        ...current,
                                                        [index]: true,
                                                    })
                                                )
                                            }
                                        />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    )}

                    {!!storageError && (
                        <Text style={styles.errorNote}>
                            {storageError}
                        </Text>
                    )}

                    <View style={styles.card}>
                        <Text style={styles.category}>
                            {item.category_name || 'Marketplace'}
                        </Text>

                        <Text style={styles.title}>
                            {item.title}
                        </Text>

                        <Text style={styles.price}>
                            Rs. {item.price.toLocaleString('en-US', {
                                maximumFractionDigits: 2,
                            })}
                        </Text>

                        <View style={styles.badges}>
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>
                                    {item.condition === 'new'
                                        ? 'New'
                                        : item.condition === 'used'
                                          ? 'Used'
                                          : 'Condition unspecified'}
                                </Text>
                            </View>

                            {item.is_negotiable && (
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>
                                        Negotiable
                                    </Text>
                                </View>
                            )}
                        </View>

                        <View style={styles.locationRow}>
                            <Ionicons
                                name="location-outline"
                                size={17}
                                color="#EA580C"
                            />
                            <Text style={styles.location}>
                                {item.city || 'Location unspecified'}
                            </Text>
                        </View>
                    </View>

                    <Text style={styles.sectionTitle}>
                        About this item
                    </Text>

                    <View style={styles.card}>
                        <Text style={styles.description}>
                            {item.description ||
                                'No description provided.'}
                        </Text>
                    </View>

                    <Text style={styles.sectionTitle}>
                        Meet the seller
                    </Text>

                    <View style={styles.card}>
                        <View style={styles.sellerRow}>
                            <View style={styles.sellerIcon}>
                                <Ionicons
                                    name="person-outline"
                                    size={24}
                                    color="#EA580C"
                                />
                            </View>
                            <View style={styles.flex}>
                                <Text style={styles.sellerName}>
                                    {item.seller_name || 'Seller'}
                                </Text>
                                <Text style={styles.description}>
                                    Contact directly to discuss the item.
                                </Text>
                            </View>
                        </View>

                        <View style={styles.actions}>
                            <TouchableOpacity
                                style={[
                                    styles.callButton,
                                    !canCall && styles.disabledButton,
                                ]}
                                onPress={callSeller}
                                disabled={!canCall}
                                accessibilityRole="button"
                                accessibilityLabel="Call seller"
                            >
                                <Ionicons
                                    name="call-outline"
                                    size={19}
                                    color={
                                        canCall ? '#EA580C' : '#9CA3AF'
                                    }
                                />
                                <Text
                                    style={[
                                        styles.callText,
                                        !canCall && styles.disabledText,
                                    ]}
                                >
                                    Call
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.whatsappButton,
                                    !canWhatsApp &&
                                        styles.disabledButton,
                                ]}
                                onPress={messageSeller}
                                disabled={!canWhatsApp}
                                accessibilityRole="button"
                                accessibilityLabel="Contact seller on WhatsApp"
                            >
                                <Ionicons
                                    name="logo-whatsapp"
                                    size={21}
                                    color={
                                        canWhatsApp
                                            ? '#FFFFFF'
                                            : '#9CA3AF'
                                    }
                                />
                                <Text
                                    style={[
                                        styles.whiteText,
                                        !canWhatsApp &&
                                            styles.disabledText,
                                    ]}
                                >
                                    WhatsApp
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {item.status === 'sold' ? (
                            <Text style={styles.contactNote}>
                                This item has been marked as sold.
                            </Text>
                        ) : !phone ? (
                            <Text style={styles.contactNote}>
                                Seller contact number unavailable.
                            </Text>
                        ) : (
                            <Text style={styles.contactNote}>
                                Review the WhatsApp message and tap
                                Send there.
                            </Text>
                        )}
                    </View>

                    <View style={styles.safetyCard}>
                        <Ionicons
                            name="shield-checkmark-outline"
                            size={25}
                            color="#9A3412"
                        />
                        <View style={styles.flex}>
                            <Text style={styles.safetyTitle}>
                                Meet safely
                            </Text>
                            <Text style={styles.safetyText}>
                                Meet in a public place, inspect the
                                item before paying and agree on
                                payment directly with the seller.
                            </Text>
                        </View>
                    </View>
                </ScrollView>
            ) : null}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#FFFAF5',
    },
    flex: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        gap: 12,
    },
    headerButton: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        flex: 1,
        fontSize: 19,
        fontWeight: '700',
        color: '#1F2937',
    },
    content: {
        width: '100%',
        maxWidth: 650,
        alignSelf: 'center',
        padding: 20,
        paddingBottom: 32,
    },
    imageContainer: {
        height: 280,
        marginBottom: 18,
        borderRadius: 24,
        overflow: 'hidden',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#F0E7DE',
    },
    mainImage: {
        width: '100%',
        height: '100%',
    },
    placeholder: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    soldBadge: {
        position: 'absolute',
        bottom: 14,
        left: 14,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
        backgroundColor: '#374151',
    },
    thumbnails: {
        gap: 10,
        paddingBottom: 18,
    },
    thumbnail: {
        width: 72,
        height: 72,
        borderRadius: 13,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: '#E5E7EB',
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    activeThumbnail: {
        borderColor: '#EA580C',
    },
    thumbnailImage: {
        width: '100%',
        height: '100%',
    },
    card: {
        padding: 18,
        marginBottom: 22,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#F0E7DE',
    },
    category: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.6,
        color: '#C2410C',
    },
    title: {
        marginTop: 8,
        fontSize: 26,
        fontWeight: '800',
        color: '#1F2937',
    },
    price: {
        marginTop: 12,
        fontSize: 28,
        fontWeight: '800',
        color: '#EA580C',
    },
    badges: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 14,
    },
    badge: {
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 10,
        backgroundColor: '#FFF7ED',
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#9A3412',
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 16,
    },
    location: {
        flex: 1,
        fontSize: 13,
        color: '#6B7280',
    },
    sectionTitle: {
        marginBottom: 12,
        fontSize: 17,
        fontWeight: '700',
        color: '#1F2937',
    },
    description: {
        fontSize: 14,
        lineHeight: 22,
        color: '#6B7280',
    },
    sellerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    sellerIcon: {
        width: 50,
        height: 50,
        borderRadius: 16,
        backgroundColor: '#FFF7ED',
        alignItems: 'center',
        justifyContent: 'center',
    },
    sellerName: {
        marginBottom: 4,
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
    },
    actions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginTop: 20,
    },
    callButton: {
        flexGrow: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
        minHeight: 48,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 14,
        backgroundColor: '#FFF7ED',
    },
    callText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#EA580C',
    },
    whatsappButton: {
        flexGrow: 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
        minHeight: 48,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 14,
        backgroundColor: '#16A34A',
    },
    whiteText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    disabledButton: {
        backgroundColor: '#F3F4F6',
    },
    disabledText: {
        color: '#9CA3AF',
    },
    contactNote: {
        marginTop: 12,
        fontSize: 12,
        lineHeight: 19,
        color: '#6B7280',
    },
    safetyCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        padding: 18,
        borderRadius: 18,
        backgroundColor: '#FFEDD5',
    },
    safetyTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#9A3412',
    },
    safetyText: {
        marginTop: 6,
        fontSize: 13,
        lineHeight: 21,
        color: '#9A3412',
    },
    errorNote: {
        marginBottom: 14,
        fontSize: 12,
        lineHeight: 19,
        color: '#B91C1C',
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 28,
    },
    stateTitle: {
        marginTop: 16,
        fontSize: 18,
        fontWeight: '700',
        textAlign: 'center',
        color: '#1F2937',
    },
    stateText: {
        marginTop: 8,
        fontSize: 14,
        lineHeight: 22,
        textAlign: 'center',
        color: '#6B7280',
    },
    retryButton: {
        marginTop: 20,
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 14,
        backgroundColor: '#EA580C',
    },
});
