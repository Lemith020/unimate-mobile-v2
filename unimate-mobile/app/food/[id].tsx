import React, {
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
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

import FoodSearchBar from '../../component/home_page/food/FoodSearchBar';
import FoodCategoryTabs from '../../component/home_page/food/FoodCategoryTabs';
import FoodItemCard from '../../component/home_page/food/FoodItemCard';
import {
    FavouriteFood,
    useFoodFavourites,
} from '../../contexts/FoodFavouritesContext';

// Android emulator. Use your computer's LAN IP for a real phone.
const API_URL = 'http://10.0.2.2:5000/api/food';

type FoodShop = {
    id: string;
    name: string;
    address?: string | null;
    city?: string | null;
    pickup_available?: boolean;
    delivery_available?: boolean;
};

type FoodCategory = {
    id: string;
    name: string;
};

type MenuResponse = {
    shop?: FoodShop;
    categories?: FoodCategory[];
    foods?: FavouriteFood[];
    error?: string;
};

export default function FoodMenuPage() {
    const router = useRouter();
    const params = useLocalSearchParams<{
        id?: string | string[];
    }>();

    const shopId = Array.isArray(params.id)
        ? params.id[0]
        : params.id;

    const {
        favourites,
        isLoading: favouritesLoading,
        storageError,
        isFavourite,
        toggleFavourite,
    } = useFoodFavourites();

    const [shop, setShop] = useState<FoodShop | null>(null);
    const [categories, setCategories] = useState<
        FoodCategory[]
    >([]);
    const [foods, setFoods] = useState<FavouriteFood[]>([]);
    const [search, setSearch] = useState('');
    const [selectedCategoryId, setSelectedCategoryId] =
        useState<string | null>(null);
    const [quantities, setQuantities] = useState<
        Record<string, number>
    >({});
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');

    const requestRef = useRef<AbortController | null>(null);

    const loadMenu = useCallback(
        async (refresh = false) => {
            requestRef.current?.abort();

            const controller = new AbortController();
            requestRef.current = controller;

            const isCurrentRequest = () =>
                requestRef.current === controller &&
                !controller.signal.aborted;

            setError('');

            if (refresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            try {
                if (!shopId) {
                    throw new Error('The shop ID is missing.');
                }

                const response = await fetch(
                    `${API_URL}/shops/${encodeURIComponent(shopId)}`,
                    { signal: controller.signal }
                );

                const data =
                    (await response.json()) as MenuResponse;

                if (!isCurrentRequest()) return;

                if (!response.ok) {
                    throw new Error(
                        data.error || 'Unable to load this menu.'
                    );
                }

                if (
                    !data.shop ||
                    !Array.isArray(data.categories) ||
                    !Array.isArray(data.foods)
                ) {
                    throw new Error(
                        'The server returned an invalid menu.'
                    );
                }

                const menuFoods = data.foods.map((food) => ({
                    ...food,
                    price: Number(food.price),
                    shop_name: data.shop!.name,
                }));

                setShop(data.shop);
                setCategories(data.categories);
                setFoods(menuFoods);

                // Keep the selected category if it still exists.
                setSelectedCategoryId((current) =>
                    current &&
                        !data.categories!.some(
                            (category) => category.id === current
                        )
                        ? null
                        : current
                );
            } catch (caughtError) {
                if (!isCurrentRequest()) return;

                setError(
                    caughtError instanceof Error
                        ? caughtError.message
                        : 'Something went wrong. Please try again.'
                );
            } finally {
                if (isCurrentRequest()) {
                    setLoading(false);
                    setRefreshing(false);
                }
            }
        },
        [shopId]
    );

    useEffect(() => {
        setShop(null);
        setFoods([]);
        setCategories([]);
        setSearch('');
        setSelectedCategoryId(null);
        setQuantities({});

        void loadMenu();

        return () => {
            requestRef.current?.abort();
        };
    }, [loadMenu]);

    const query = search.trim().toLowerCase();

    const filteredFoods = foods.filter((food) => {
        const matchesCategory =
            selectedCategoryId === null ||
            food.menu_category_id === selectedCategoryId;

        const matchesSearch =
            !query ||
            [
                food.name,
                food.description,
                food.category_name,
            ].some((value) =>
                value?.toLowerCase().includes(query)
            );

        return matchesCategory && matchesSearch;
    });

    const changeQuantity = (
        foodId: string,
        quantity: number
    ) => {
        if (
            !Number.isInteger(quantity) ||
            quantity < 1 ||
            quantity > 20
        ) {
            return;
        }

        setQuantities((current) => ({
            ...current,
            [foodId]: quantity,
        }));
    };

    const buyFood = (
        food: FavouriteFood,
        quantity: number
    ) => {
        if (!shop) return;

        // Checkout should reload current details using these IDs.
        router.push({
            pathname: '/food/checkout',
            params: {
                shopId: shop.id,
                foodId: food.id,
                quantity: String(quantity),
            },
        });
    };

    const goBack = () => {
        if (router.canGoBack()) {
            router.back();
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

                <View style={styles.headerTitleContainer}>
                    <Text
                        style={styles.headerTitle}
                        numberOfLines={1}
                    >
                        {shop?.name || 'Food menu'}
                    </Text>
                    <Text style={styles.headerSubtitle}>
                        Find your next favourite
                    </Text>
                </View>

                <TouchableOpacity
                    style={styles.headerButton}
                    onPress={() =>
                        router.push('/food/favourites')
                    }
                    accessibilityRole="button"
                    accessibilityLabel="Open favourite foods"
                >
                    <Ionicons
                        name="heart-outline"
                        size={23}
                        color="#EA580C"
                    />

                    {favourites.length > 0 && (
                        <View style={styles.countBadge}>
                            <Text style={styles.countText}>
                                {favourites.length > 99
                                    ? '99+'
                                    : favourites.length}
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            <FlatList
                data={loading || error ? [] : filteredFoods}
                keyExtractor={(food) => food.id}
                renderItem={({ item }) => (
                    <FoodItemCard
                        food={item}
                        quantity={quantities[item.id] ?? 1}
                        isFavourite={isFavourite(item.id)}
                        onToggleFavourite={
                            favouritesLoading || storageError
                                ? undefined
                                : toggleFavourite
                        }
                        onQuantityChange={(quantity: number) =>
                            changeQuantity(item.id, quantity)
                        }
                        onBuy={buyFood}
                    />
                )}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => void loadMenu(true)}
                        colors={['#EA580C']}
                        tintColor="#EA580C"
                    />
                }
                ListHeaderComponent={
                    shop ? (
                        <View>
                            <View style={styles.hero}>
                                <View style={styles.heroIcon}>
                                    <Ionicons
                                        name="restaurant-outline"
                                        size={27}
                                        color="#EA580C"
                                    />
                                </View>

                                <Text style={styles.eyebrow}>
                                    YOUR NEXT TASTY BREAK
                                </Text>

                                <Text style={styles.heroTitle}>
                                    Good food.{'\n'}Better campus days.
                                </Text>

                                <Text style={styles.heroDescription}>
                                    Explore the menu at {shop.name}.
                                    Pick a favourite and make it yours.
                                </Text>

                                {!!(shop.address || shop.city) && (
                                    <View style={styles.locationRow}>
                                        <Ionicons
                                            name="location-outline"
                                            size={16}
                                            color="#9A3412"
                                        />
                                        <Text style={styles.location}>
                                            {shop.address || shop.city}
                                        </Text>
                                    </View>
                                )}

                                <View style={styles.serviceRow}>
                                    {shop.pickup_available && (
                                        <View style={styles.serviceBadge}>
                                            <Ionicons
                                                name="bag-handle-outline"
                                                size={14}
                                                color="#9A3412"
                                            />
                                            <Text style={styles.serviceText}>
                                                Pickup
                                            </Text>
                                        </View>
                                    )}

                                    {shop.delivery_available && (
                                        <View style={styles.serviceBadge}>
                                            <Ionicons
                                                name="bicycle-outline"
                                                size={15}
                                                color="#9A3412"
                                            />
                                            <Text style={styles.serviceText}>
                                                Delivery
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </View>

                            {!!storageError && (
                                <Text style={styles.storageError}>
                                    {storageError}
                                </Text>
                            )}

                            {!loading && !error && (
                                <>
                                    <FoodSearchBar
                                        value={search}
                                        onChangeText={setSearch}
                                    />

                                    <FoodCategoryTabs
                                        categories={categories}
                                        selectedCategoryId={
                                            selectedCategoryId
                                        }
                                        onSelectCategory={
                                            setSelectedCategoryId
                                        }
                                    />

                                    <View style={styles.sectionRow}>
                                        <Text style={styles.sectionTitle}>
                                            {query
                                                ? 'Search results'
                                                : 'On the menu'}
                                        </Text>

                                        <Text style={styles.itemCount}>
                                            {filteredFoods.length}{' '}
                                            {filteredFoods.length === 1
                                                ? 'item'
                                                : 'items'}
                                        </Text>
                                    </View>
                                </>
                            )}
                        </View>
                    ) : null
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        {loading ? (
                            <>
                                <ActivityIndicator
                                    size="large"
                                    color="#EA580C"
                                />
                                <Text style={styles.emptyTitle}>
                                    A tasty moment…
                                </Text>
                                <Text style={styles.emptyText}>
                                    Loading this shop's menu.
                                </Text>
                            </>
                        ) : error ? (
                            <>
                                <Ionicons
                                    name="alert-circle-outline"
                                    size={45}
                                    color="#EA580C"
                                />
                                <Text style={styles.emptyTitle}>
                                    Unable to load the menu
                                </Text>
                                <Text style={styles.emptyText}>
                                    {error}
                                </Text>

                                <TouchableOpacity
                                    style={styles.retryButton}
                                    onPress={() => void loadMenu()}
                                    accessibilityRole="button"
                                >
                                    <Text style={styles.retryText}>
                                        Try again
                                    </Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                <Ionicons
                                    name="restaurant-outline"
                                    size={45}
                                    color="#EA580C"
                                />
                                <Text style={styles.emptyTitle}>
                                    {foods.length === 0
                                        ? 'The menu is coming soon'
                                        : 'No matching foods'}
                                </Text>
                                <Text style={styles.emptyText}>
                                    {foods.length === 0
                                        ? 'This shop has no available foods yet.'
                                        : 'Try another search or select All categories.'}
                                </Text>

                                {foods.length > 0 && (
                                    <TouchableOpacity
                                        style={styles.retryButton}
                                        onPress={() => {
                                            setSearch('');
                                            setSelectedCategoryId(null);
                                        }}
                                        accessibilityRole="button"
                                    >
                                        <Text style={styles.retryText}>
                                            Show all foods
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </>
                        )}
                    </View>
                }
            />
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
        paddingHorizontal: 20,
        paddingVertical: 12,
        gap: 12,
    },
    headerButton: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#F0E7DE',
    },
    headerTitleContainer: {
        flex: 1,
        minWidth: 0,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
    },
    headerSubtitle: {
        marginTop: 3,
        fontSize: 12,
        color: '#6B7280',
    },
    countBadge: {
        position: 'absolute',
        top: -5,
        right: -5,
        minWidth: 20,
        height: 20,
        paddingHorizontal: 4,
        borderRadius: 10,
        backgroundColor: '#EA580C',
        alignItems: 'center',
        justifyContent: 'center',
    },
    countText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    listContent: {
        flexGrow: 1,
        width: '100%',
        maxWidth: 650,
        alignSelf: 'center',
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 28,
    },
    hero: {
        padding: 22,
        marginBottom: 20,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#FED7AA',
        backgroundColor: '#FFF1E2',
    },
    heroIcon: {
        width: 52,
        height: 52,
        borderRadius: 17,
        marginBottom: 16,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    eyebrow: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1.4,
        color: '#C2410C',
    },
    heroTitle: {
        marginTop: 10,
        fontSize: 29,
        lineHeight: 36,
        fontWeight: '800',
        color: '#431407',
    },
    heroDescription: {
        marginTop: 10,
        fontSize: 14,
        lineHeight: 22,
        color: '#9A3412',
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginTop: 15,
        gap: 5,
    },
    location: {
        flex: 1,
        fontSize: 12,
        lineHeight: 18,
        color: '#9A3412',
    },
    serviceRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 12,
    },
    serviceBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 10,
        paddingVertical: 7,
        borderRadius: 10,
        backgroundColor: '#FFFFFF',
    },
    serviceText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#9A3412',
    },
    storageError: {
        marginBottom: 14,
        fontSize: 12,
        lineHeight: 18,
        color: '#B91C1C',
    },
    sectionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 6,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
    },
    itemCount: {
        fontSize: 12,
        color: '#6B7280',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        paddingVertical: 48,
    },
    emptyTitle: {
        marginTop: 16,
        fontSize: 18,
        fontWeight: '700',
        textAlign: 'center',
        color: '#1F2937',
    },
    emptyText: {
        marginTop: 8,
        fontSize: 14,
        lineHeight: 22,
        textAlign: 'center',
        color: '#6B7280',
    },
    retryButton: {
        marginTop: 20,
        paddingHorizontal: 24,
        paddingVertical: 13,
        borderRadius: 14,
        backgroundColor: '#EA580C',
    },
    retryText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});