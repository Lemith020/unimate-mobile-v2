import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

type Order = {
    id: string;
    status: string;
    total_amount: number;
};

type OrderResponse = {
    message?: string;
    error?: string;
    order?: Order;
};

function firstParam(value?: string | string[]) {
    return Array.isArray(value) ? value[0] : value;
}

function parseQuantity(value?: string) {
    const number = Number(value);

    return Number.isInteger(number) &&
        number >= 1 &&
        number <= 20
        ? number
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
    const [phone, setPhone] = useState('');
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [placedOrder, setPlacedOrder] =
        useState<Order | null>(null);
    const [retryCount, setRetryCount] = useState(0);

    const submitLock = useRef(false);

    useEffect(() => {
        setQuantity(parseQuantity(initialQuantity));
    }, [shopId, foodId, initialQuantity]);

    useEffect(() => {
        let active = true;

        async function loadPhone() {
            try {
                const stored =
                    await AsyncStorage.getItem('userData');

                if (!stored || !active) return;

                const user = JSON.parse(stored);

                if (
                    active &&
                    typeof user?.profile?.phone === 'string'
                ) {
                    setPhone((current) =>
                        current || user.profile.phone
                    );
                }
            } catch {
                // The user can enter their phone manually.
            }
        }

        void loadPhone();

        return () => {
            active = false;
        };
    }, []);

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
                        'Please select a food from a shop menu.'
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
                        data.error || 'Unable to load checkout.'
                    );
                }

                if (
                    !data.shop ||
                    !Array.isArray(data.foods)
                ) {
                    throw new Error(
                        'Invalid food details received.'
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
                        'This food is no longer available.'
                    );
                }

                const price = Number(selectedFood.price);

                if (
                    selectedFood.price === null ||
                    selectedFood.price === undefined ||
                    String(selectedFood.price).trim() === '' ||
                    !Number.isFinite(price) ||
                    price < 0
                ) {
                    throw new Error(
                        'The price for this food is unavailable.'
                    );
                }

                setShop(data.shop);
                setFood({ ...selectedFood, price });
            } catch (caughtError) {
                if (!active) return;

                setError(
                    caughtError instanceof Error
                        ? caughtError.message
                        : 'Unable to load checkout.'
                );
            } finally {
                if (active) setLoading(false);
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
        if (submitting) return;

        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/food');
        }
    };

    const finishOrder = () => {
        setPlacedOrder(null);
        setNote('');
        setQuantity(1);
        router.replace('/food');
    };

    const placeOrder = async () => {
        if (
            submitLock.current ||
            placedOrder ||
            !food ||
            !shop
        ) {
            return;
        }

        if (!pickupAvailable) {
            Alert.alert(
                'Pickup unavailable',
                'This shop does not accept pickup orders.'
            );
            return;
        }

        const cleanPhone = phone
            .trim()
            .replace(/[\s()-]/g, '');

        if (!/^\+?\d{9,15}$/.test(cleanPhone)) {
            Alert.alert(
                'Contact number',
                'Please enter a valid phone number.'
            );
            return;
        }

        submitLock.current = true;
        setSubmitting(true);

        try {
            const stored =
                await AsyncStorage.getItem('userData');

            const user = stored ? JSON.parse(stored) : null;

            if (
                !user ||
                typeof user.id !== 'string' ||
                !user.id
            ) {
                Alert.alert(
                    'Login required',
                    'Please log in before placing an order.',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        {
                            text: 'Log in',
                            onPress: () =>
                                router.push('/login'),
                        },
                    ]
                );
                return;
            }

            let response: Response;

            try {
                response = await fetch(`${API_URL}/orders`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        student_id: user.id,
                        place_id: shop.id,
                        menu_item_id: food.id,
                        quantity,
                        contact_phone: cleanPhone,
                        note: note.trim(),
                        expected_unit_price: food.price,
                    }),
                });
            } catch {
                Alert.alert(
                    'Connection interrupted',
                    'We could not confirm whether your order was saved. Check with the shop before trying again.'
                );
                return;
            }

            let data: OrderResponse;

            try {
                data =
                    (await response.json()) as OrderResponse;
            } catch {
                Alert.alert(
                    'Unable to confirm order',
                    'The server response could not be read. Check with the shop before trying again.'
                );
                return;
            }

            if (!response.ok) {
                Alert.alert(
                    'Unable to place order',
                    data.error || 'Please try again.',
                    response.status === 409
                        ? [
                              {
                                  text: 'Reload checkout',
                                  onPress: () =>
                                      setRetryCount(
                                          (current) => current + 1
                                      ),
                              },
                          ]
                        : [{ text: 'OK' }]
                );
                return;
            }

            if (
                !data.order ||
                typeof data.order.id !== 'string' ||
                !Number.isFinite(
                    Number(data.order.total_amount)
                )
            ) {
                Alert.alert(
                    'Unable to confirm order',
                    'Check with the shop before trying again.'
                );
                return;
            }

            setPlacedOrder({
                ...data.order,
                total_amount: Number(
                    data.order.total_amount
                ),
            });
        } catch {
            Alert.alert(
                'Unable to place order',
                'Please log in again and check your details.'
            );
        } finally {
            submitLock.current = false;
            setSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={styles.screen}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={goBack}
                    disabled={submitting}
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
                    <Text style={styles.subtitle}>
                        Your next delicious break
                    </Text>
                </View>
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
                            size={45}
                            color="#EA580C"
                        />
                    )}

                    <Text style={styles.stateTitle}>
                        {loading
                            ? 'Checking your selection…'
                            : 'Unable to load checkout'}
                    </Text>

                    {!!error && (
                        <>
                            <Text style={styles.description}>
                                {error}
                            </Text>
                            <TouchableOpacity
                                style={styles.primaryButton}
                                onPress={() =>
                                    setRetryCount(
                                        (current) => current + 1
                                    )
                                }
                            >
                                <Text style={styles.buttonText}>
                                    Try again
                                </Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            ) : shop && food ? (
                <KeyboardAvoidingView
                    style={styles.flex}
                    behavior={
                        Platform.OS === 'ios'
                            ? 'padding'
                            : undefined
                    }
                >
                    <ScrollView
                        contentContainerStyle={styles.content}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={styles.hero}>
                            <Ionicons
                                name="bag-handle-outline"
                                size={32}
                                color="#EA580C"
                            />
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
                            <Text style={styles.shopName}>
                                {shop.name}
                            </Text>

                            <Text style={styles.foodName}>
                                {food.name}
                            </Text>

                            {!!food.description && (
                                <Text style={styles.description}>
                                    {food.description}
                                </Text>
                            )}

                            <Text style={styles.price}>
                                {formatPrice(food.price)} per item
                            </Text>

                            <View style={styles.divider} />

                            <Text style={styles.label}>
                                Quantity
                            </Text>
                            <QuantitySelector
                                quantity={quantity}
                                onChange={setQuantity}
                                disabled={
                                    submitting || !!placedOrder
                                }
                            />
                        </View>

                        <Text style={styles.sectionTitle}>
                            Collection & payment
                        </Text>

                        <View style={styles.card}>
                            <View style={styles.optionRow}>
                                <Ionicons
                                    name="bag-handle-outline"
                                    size={24}
                                    color="#EA580C"
                                />
                                <View style={styles.flex}>
                                    <Text style={styles.optionTitle}>
                                        Pickup from shop
                                    </Text>
                                    <Text style={styles.description}>
                                        {pickupAvailable
                                            ? 'Collect your food at the shop.'
                                            : 'Pickup is unavailable at this shop.'}
                                    </Text>
                                </View>
                            </View>

                            {!!shop.address && (
                                <Text style={styles.address}>
                                    {shop.address}
                                </Text>
                            )}

                            <View style={styles.divider} />

                            <View style={styles.optionRow}>
                                <Ionicons
                                    name="cash-outline"
                                    size={25}
                                    color="#EA580C"
                                />
                                <View style={styles.flex}>
                                    <Text style={styles.optionTitle}>
                                        Cash at pickup
                                    </Text>
                                    <Text style={styles.description}>
                                        Pay when you collect your food.
                                    </Text>
                                </View>
                            </View>
                        </View>

                        <Text style={styles.sectionTitle}>
                            Contact details
                        </Text>

                        <View style={styles.card}>
                            <Text style={styles.label}>
                                Contact phone number
                            </Text>
                            <TextInput
                                style={styles.input}
                                value={phone}
                                onChangeText={setPhone}
                                placeholder="077 123 4567"
                                placeholderTextColor="#9CA3AF"
                                keyboardType="phone-pad"
                                maxLength={20}
                                editable={
                                    !submitting && !placedOrder
                                }
                                accessibilityLabel="Contact phone number"
                            />

                            <Text style={styles.noteLabel}>
                                Note to the shop (optional)
                            </Text>
                            <TextInput
                                style={[
                                    styles.input,
                                    styles.noteInput,
                                ]}
                                value={note}
                                onChangeText={setNote}
                                placeholder="Any special instructions?"
                                placeholderTextColor="#9CA3AF"
                                multiline
                                maxLength={500}
                                textAlignVertical="top"
                                editable={
                                    !submitting && !placedOrder
                                }
                                accessibilityLabel="Note to the shop"
                            />
                            <Text style={styles.counter}>
                                {note.length} / 500
                            </Text>
                        </View>

                        <View style={styles.totalCard}>
                            <Text style={styles.totalLabel}>
                                Pickup total
                            </Text>
                            <Text style={styles.totalPrice}>
                                {formatPrice(total)}
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={[
                                styles.primaryButton,
                                (!pickupAvailable ||
                                    submitting ||
                                    !!placedOrder) &&
                                    styles.disabledButton,
                            ]}
                            onPress={() => void placeOrder()}
                            disabled={
                                !pickupAvailable ||
                                submitting ||
                                !!placedOrder
                            }
                            accessibilityRole="button"
                            accessibilityLabel="Place order"
                        >
                            {submitting ? (
                                <ActivityIndicator
                                    color="#FFFFFF"
                                />
                            ) : (
                                <>
                                    <Ionicons
                                        name="bag-check-outline"
                                        size={21}
                                        color="#FFFFFF"
                                    />
                                    <Text style={styles.buttonText}>
                                        Place order
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>

                        <Text style={styles.paymentNote}>
                            No online payment is collected.
                            Pay the shop at pickup.
                        </Text>
                    </ScrollView>
                </KeyboardAvoidingView>
            ) : null}

            <Modal
                visible={!!placedOrder}
                transparent
                animationType="fade"
                onRequestClose={finishOrder}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.successCard}>
                        <View style={styles.successIcon}>
                            <Ionicons
                                name="checkmark"
                                size={42}
                                color="#EA580C"
                            />
                        </View>

                        <Text style={styles.successTitle}>
                            Order placed!
                        </Text>

                        <Text style={styles.successText}>
                            Thank you! Your order has been saved
                            and is waiting for the shop to accept it.
                        </Text>

                        <View style={styles.orderDetails}>
                            <Text style={styles.orderReference}>
                                Order ID
                            </Text>
                            <Text
                                selectable
                                style={styles.orderId}
                            >
                                {placedOrder?.id}
                            </Text>
                            <Text style={styles.successTotal}>
                                {formatPrice(
                                    placedOrder?.total_amount ?? 0
                                )}
                            </Text>
                            <Text style={styles.description}>
                                Status: Placed · Cash at pickup
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={finishOrder}
                            accessibilityRole="button"
                        >
                            <Text style={styles.buttonText}>
                                Done
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
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
        gap: 12,
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
    },
    subtitle: {
        marginTop: 3,
        fontSize: 12,
        color: '#6B7280',
    },
    content: {
        width: '100%',
        maxWidth: 650,
        alignSelf: 'center',
        padding: 20,
        paddingBottom: 32,
    },
    hero: {
        padding: 22,
        marginBottom: 24,
        borderRadius: 24,
        backgroundColor: '#FFF1E2',
        borderWidth: 1,
        borderColor: '#FED7AA',
    },
    heroTitle: {
        marginTop: 14,
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
        marginBottom: 12,
        fontSize: 17,
        fontWeight: '700',
        color: '#1F2937',
    },
    card: {
        padding: 18,
        marginBottom: 22,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#F0E7DE',
    },
    shopName: {
        marginBottom: 10,
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
        marginTop: 6,
        fontSize: 13,
        lineHeight: 20,
        color: '#6B7280',
    },
    price: {
        marginTop: 12,
        fontSize: 16,
        fontWeight: '700',
        color: '#EA580C',
    },
    divider: {
        height: 1,
        marginVertical: 16,
        backgroundColor: '#F3F4F6',
    },
    label: {
        marginBottom: 10,
        fontSize: 13,
        fontWeight: '600',
        color: '#374151',
    },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    optionTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1F2937',
    },
    address: {
        marginTop: 14,
        padding: 12,
        borderRadius: 12,
        backgroundColor: '#FFF7ED',
        fontSize: 13,
        lineHeight: 20,
        color: '#9A3412',
    },
    input: {
        paddingHorizontal: 14,
        paddingVertical: 13,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FED7AA',
        backgroundColor: '#FFFAF5',
        fontSize: 14,
        color: '#1F2937',
    },
    noteLabel: {
        marginTop: 18,
        marginBottom: 10,
        fontSize: 13,
        fontWeight: '600',
        color: '#374151',
    },
    noteInput: {
        minHeight: 100,
    },
    counter: {
        marginTop: 7,
        fontSize: 11,
        textAlign: 'right',
        color: '#9CA3AF',
    },
    totalCard: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        padding: 18,
        marginBottom: 18,
        borderRadius: 18,
        backgroundColor: '#FFEDD5',
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: '#9A3412',
    },
    totalPrice: {
        fontSize: 23,
        fontWeight: '800',
        color: '#EA580C',
    },
    primaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        minHeight: 54,
        paddingHorizontal: 22,
        paddingVertical: 14,
        borderRadius: 16,
        backgroundColor: '#EA580C',
    },
    disabledButton: {
        backgroundColor: '#9CA3AF',
    },
    buttonText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFFFFF',
        textAlign: 'center',
    },
    paymentNote: {
        marginTop: 12,
        fontSize: 12,
        lineHeight: 18,
        textAlign: 'center',
        color: '#6B7280',
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
        padding: 28,
    },
    stateTitle: {
        fontSize: 18,
        fontWeight: '700',
        textAlign: 'center',
        color: '#1F2937',
    },
    modalOverlay: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        backgroundColor: 'rgba(17, 24, 39, 0.55)',
    },
    successCard: {
        width: '100%',
        maxWidth: 420,
        padding: 24,
        borderRadius: 28,
        backgroundColor: '#FFFFFF',
    },
    successIcon: {
        width: 86,
        height: 86,
        alignSelf: 'center',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 28,
        backgroundColor: '#FFEDD5',
    },
    successTitle: {
        marginTop: 20,
        fontSize: 27,
        fontWeight: '800',
        textAlign: 'center',
        color: '#431407',
    },
    successText: {
        marginTop: 10,
        fontSize: 14,
        lineHeight: 22,
        textAlign: 'center',
        color: '#6B7280',
    },
    orderDetails: {
        padding: 16,
        marginVertical: 20,
        borderRadius: 16,
        backgroundColor: '#FFF7ED',
    },
    orderReference: {
        fontSize: 12,
        fontWeight: '600',
        color: '#9A3412',
    },
    orderId: {
        marginTop: 5,
        fontSize: 12,
        color: '#374151',
    },
    successTotal: {
        marginTop: 14,
        fontSize: 23,
        fontWeight: '800',
        color: '#EA580C',
    },
});