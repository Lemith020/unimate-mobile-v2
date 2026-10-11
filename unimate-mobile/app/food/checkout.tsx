import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
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

import QuantitySelector from '../../component/home_page/food/QuantitySelector';

const API_URL = 'http://10.0.2.2:5000/api/food';

type Shop = {
    id: string;
    name: string;
    address?: string | null;
    pickup_available?: boolean;
    delivery_available?: boolean;
};

type Food = {
    id: string;
    name: string;
    description?: string | null;
    price: number;
    is_available?: boolean;
};

type MenuResponse = {
    shop?: Shop;
    foods?: Food[];
    error?: string;
};

function firstParam(value?: string | string[]) {
    return Array.isArray(value) ? value[0] : value;
}

function parseQuantity(value?: string) {
    const parsed = Number(value);

    return Number.isInteger(parsed) &&
        parsed >= 1 &&
        parsed <= 20
        ? parsed
        : 1;
}

function formatPrice(value: number) {
    return `Rs. ${value.toFixed(2)}`;
}

export default function FoodCheckoutPage() {
    const router = useRouter();

    const params = useLocalSearchParams<{
        shopId?: string | string[];
        foodId?: string | string[];
        quantity?: string | string[];
    }>();

    const shopId = firstParam(params.shopId);
    const foodId = firstParam(params.foodId);
    const initialQuantity = firstParam(params.quantity);

    const [shop, setShop] = useState<Shop | null>(null);
    const [food, setFood] = useState<Food | null>(null);
    const [quantity, setQuantity] = useState(
        parseQuantity(initialQuantity)
    );
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [retryCount, setRetryCount] = useState(0);

    useEffect(() => {
        setQuantity(parseQuantity(initialQuantity));
    }, [shopId, foodId, initialQuantity]);

    useEffect(() => {
        const controller = new AbortController();
        let active = true;

        async function loadCheckout() {
            setLoading(true);
            setError('');
            setShop(null);
            setFood(null);

            try {
                if (!shopId || !foodId) {
                    throw new Error(
                        'Please select a food from the shop menu.'
                    );
                }

                const response = await fetch(
                    `${API_URL}/shops/${encodeURIComponent(shopId)}`,
                    { signal: controller.signal }
                );

                const data =
                    (await response.json()) as MenuResponse;

                if (!active) return;

                if (!response.ok) {
                    throw new Error(
                        data.error ||
                        'Unable to check this food.'
                    );
                }

                if (
                    !data.shop ||
                    !Array.isArray(data.foods)
                ) {
                    throw new Error(
                        'The server returned invalid food details.'
                    );
                }

                const selectedFood = data.foods.find(
                    (item) => item.id === foodId
                );

                if (
                    !selectedFood ||
                    selectedFood.is_available === false
                ) {
                    throw new Error(
                        'This food is no longer available. Please choose another item.'
                    );
                }

                const rawPrice = selectedFood.price;
                const price = Number(rawPrice);

                if (
                    rawPrice === null ||
                    rawPrice === undefined ||
                    String(rawPrice).trim() === '' ||
                    !Number.isFinite(price) ||
                    price < 0
                ) {
                    throw new Error(
                        'The price for this food is unavailable.'
                    );
                }

                setShop(data.shop);
                setFood({
                    ...selectedFood,
                    price,
                });
            } catch (caughtError) {
                if (!active) return;

                setError(
                    caughtError instanceof Error
                        ? caughtError.message
                        : 'Unable to load checkout. Please try again.'
                );
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        }

        void loadCheckout();

        return () => {
            active = false;
            controller.abort();
        };
    }, [shopId, foodId, retryCount]);

    const total = food ? food.price * quantity : 0;
    const pickupAvailable =
        shop?.pickup_available === true;

    const goBack = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/food');
        }
    };

    const openMenu = () => {
        if (shopId) {
            router.push({
                pathname: '/food/[id]',
                params: { id: shopId },
            });
        } else {
            router.replace('/food');
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
                    <Ionicons
                        name="arrow-back"
                        size={23}
                        color="#1F2937"
                    />
                </TouchableOpacity>

                <View>
                    <Text style={styles.headerTitle}>
                        Checkout
                    </Text>
                    <Text style={styles.headerSubtitle}>
                        Review your food selection
                    </Text>
                </View>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator
                        size="large"
                        color="#EA580C"
                    />
                    <Text style={styles.stateTitle}>
                        Checking your selection…
                    </Text>
                    <Text style={styles.stateText}>
                        Getting the latest price and availability.
                    </Text>
                </View>
            ) : error ? (
                <View style={styles.center}>
                    <Ionicons
                        name="alert-circle-outline"
                        size={48}
                        color="#EA580C"
                    />

                    <Text style={styles.stateTitle}>
                        Unable to load checkout
                    </Text>
                    <Text style={styles.stateText}>
                        {error}
                    </Text>

                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={() =>
                            setRetryCount((current) => current + 1)
                        }
                        accessibilityRole="button"
                    >
                        <Text style={styles.primaryButtonText}>
                            Try again
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={openMenu}
                        accessibilityRole="button"
                    >
                        <Text style={styles.secondaryButtonText}>
                            Back to menu
                        </Text>
                    </TouchableOpacity>
                </View>
            ) : shop && food ? (
                <ScrollView
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.hero}>
                        <View style={styles.heroIcon}>
                            <Ionicons
                                name="bag-handle-outline"
                                size={28}
                                color="#EA580C"
                            />
                        </View>

                        <Text style={styles.eyebrow}>
                            YOUR FOOD BREAK
                        </Text>
                        <Text style={styles.heroTitle}>
                            A delicious choice.
                        </Text>
                        <Text style={styles.heroText}>
                            Review your meal from {shop.name}.
                        </Text>
                    </View>

                    <Text style={styles.sectionTitle}>
                        Your selection
                    </Text>

                    <View style={styles.card}>
                        <View style={styles.shopRow}>
                            <Ionicons
                                name="storefront-outline"
                                size={18}
                                color="#EA580C"
                            />
                            <Text style={styles.shopName}>
                                {shop.name}
                            </Text>
                        </View>

                        <Text style={styles.foodName}>
                            {food.name}
                        </Text>

                        {!!food.description && (
                            <Text style={styles.description}>
                                {food.description}
                            </Text>
                        )}

                        <Text style={styles.unitPrice}>
                            {formatPrice(food.price)} per item
                        </Text>

                        <View style={styles.divider} />

                        <Text style={styles.label}>
                            Quantity
                        </Text>

                        <QuantitySelector
                            quantity={quantity}
                            onChange={setQuantity}
                        />
                    </View>

                    <Text style={styles.sectionTitle}>
                        Collection
                    </Text>

                    <View style={styles.card}>
                        <View style={styles.optionRow}>
                            <View style={styles.optionIcon}>
                                <Ionicons
                                    name="bag-handle-outline"
                                    size={23}
                                    color="#EA580C"
                                />
                            </View>

                            <View style={styles.optionContent}>
                                <Text style={styles.optionTitle}>
                                    Pickup from shop
                                </Text>
                                <Text style={styles.description}>
                                    {pickupAvailable
                                        ? 'Collect your food directly from the shop.'
                                        : 'Pickup is not available at this shop.'}
                                </Text>
                            </View>

                            <Ionicons
                                name={
                                    pickupAvailable
                                        ? 'checkmark-circle'
                                        : 'close-circle-outline'
                                }
                                size={25}
                                color={
                                    pickupAvailable
                                        ? '#EA580C'
                                        : '#9CA3AF'
                                }
                            />
                        </View>

                        {!!shop.address && (
                            <View style={styles.addressRow}>
                                <Ionicons
                                    name="location-outline"
                                    size={17}
                                    color="#9A3412"
                                />
                                <Text style={styles.address}>
                                    {shop.address}
                                </Text>
                            </View>
                        )}

                        {shop.delivery_available && (
                            <Text style={styles.note}>
                                This shop offers delivery. Delivery
                                checkout is coming soon.
                            </Text>
                        )}
                    </View>

                    <Text style={styles.sectionTitle}>
                        Payment method
                    </Text>

                    <View style={styles.card}>
                        <View style={styles.optionRow}>
                            <View style={styles.optionIcon}>
                                <Ionicons
                                    name="cash-outline"
                                    size={24}
                                    color="#EA580C"
                                />
                            </View>

                            <View style={styles.optionContent}>
                                <Text style={styles.optionTitle}>
                                    Cash at pickup
                                </Text>
                                <Text style={styles.description}>
                                    Pay the shop when you collect
                                    your food.
                                </Text>
                            </View>

                            {pickupAvailable && (
                                <Ionicons
                                    name="checkmark-circle"
                                    size={25}
                                    color="#EA580C"
                                />
                            )}
                        </View>

                        <Text style={styles.note}>
                            Online payments are not available yet.
                        </Text>
                    </View>

                    <Text style={styles.sectionTitle}>
                        {pickupAvailable
                            ? 'Pickup summary'
                            : 'Food subtotal'}
                    </Text>

                    <View style={styles.card}>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>
                                Unit price
                            </Text>
                            <Text style={styles.summaryValue}>
                                {formatPrice(food.price)}
                            </Text>
                        </View>

                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>
                                Quantity
                            </Text>
                            <Text style={styles.summaryValue}>
                                {quantity}
                            </Text>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.summaryRow}>
                            <Text style={styles.totalLabel}>
                                {pickupAvailable
                                    ? 'Total'
                                    : 'Subtotal'}
                            </Text>
                            <Text style={styles.totalPrice}>
                                {formatPrice(total)}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.notice}>
                        <Ionicons
                            name="information-circle-outline"
                            size={22}
                            color="#9A3412"
                        />
                        <View style={styles.optionContent}>
                            <Text style={styles.noticeTitle}>
                                Ordering is coming soon
                            </Text>
                            <Text style={styles.noticeText}>
                                This is a checkout preview. Your
                                selection has not been sent to the
                                shop.
                            </Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.disabledButton}
                        disabled
                        accessibilityRole="button"
                        accessibilityState={{ disabled: true }}
                    >
                        <Ionicons
                            name="bag-check-outline"
                            size={20}
                            color="#FFFFFF"
                        />
                        <Text style={styles.primaryButtonText}>
                            Place order · Coming soon
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={openMenu}
                        accessibilityRole="button"
                    >
                        <Text style={styles.secondaryButtonText}>
                            Back to menu
                        </Text>
                    </TouchableOpacity>
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#F0E7DE',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 19,
        fontWeight: '700',
        color: '#1F2937',
    },
    headerSubtitle: {
        marginTop: 3,
        fontSize: 12,
        color: '#6B7280',
    },
    content: {
        width: '100%',
        maxWidth: 650,
        alignSelf: 'center',
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 28,
    },
    hero: {
        padding: 22,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#FED7AA',
        backgroundColor: '#FFF1E2',
        marginBottom: 24,
    },
    heroIcon: {
        width: 52,
        height: 52,
        borderRadius: 17,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    eyebrow: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1.4,
        color: '#C2410C',
    },
    heroTitle: {
        marginTop: 10,
        fontSize: 27,
        fontWeight: '800',
        color: '#431407',
    },
    heroText: {
        marginTop: 8,
        fontSize: 14,
        lineHeight: 22,
        color: '#9A3412',
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 12,
    },
    card: {
        padding: 18,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#F0E7DE',
        marginBottom: 22,
    },
    shopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        marginBottom: 14,
    },
    shopName: {
        flex: 1,
        fontSize: 13,
        fontWeight: '600',
        color: '#9A3412',
    },
    foodName: {
        fontSize: 21,
        fontWeight: '700',
        color: '#1F2937',
    },
    description: {
        marginTop: 5,
        fontSize: 13,
        lineHeight: 20,
        color: '#6B7280',
    },
    unitPrice: {
        marginTop: 12,
        fontSize: 15,
        fontWeight: '700',
        color: '#EA580C',
    },
    divider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginVertical: 16,
    },
    label: {
        marginBottom: 10,
        fontSize: 13,
        fontWeight: '600',
        color: '#6B7280',
    },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    optionIcon: {
        width: 46,
        height: 46,
        borderRadius: 14,
        backgroundColor: '#FFF7ED',
        alignItems: 'center',
        justifyContent: 'center',
    },
    optionContent: {
        flex: 1,
    },
    optionTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1F2937',
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 6,
        marginTop: 16,
        padding: 12,
        borderRadius: 12,
        backgroundColor: '#FFF7ED',
    },
    address: {
        flex: 1,
        fontSize: 12,
        lineHeight: 18,
        color: '#9A3412',
    },
    note: {
        marginTop: 14,
        fontSize: 12,
        lineHeight: 18,
        color: '#6B7280',
    },
    summaryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        paddingVertical: 5,
    },
    summaryLabel: {
        fontSize: 14,
        color: '#6B7280',
    },
    summaryValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
    },
    totalPrice: {
        fontSize: 22,
        fontWeight: '800',
        color: '#EA580C',
    },
    notice: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        padding: 16,
        borderRadius: 16,
        backgroundColor: '#FFEDD5',
        marginBottom: 18,
    },
    noticeTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#9A3412',
    },
    noticeText: {
        marginTop: 5,
        fontSize: 13,
        lineHeight: 20,
        color: '#9A3412',
    },
    disabledButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        minHeight: 54,
        padding: 14,
        borderRadius: 16,
        backgroundColor: '#9CA3AF',
    },
    primaryButton: {
        marginTop: 22,
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 14,
        backgroundColor: '#EA580C',
    },
    primaryButtonText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
        textAlign: 'center',
    },
    secondaryButton: {
        minHeight: 48,
        padding: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
    },
    secondaryButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#EA580C',
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
});