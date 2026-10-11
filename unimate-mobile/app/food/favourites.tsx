import React, { useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import FoodSearchBar from '../../component/home_page/food/FoodSearchBar';
import FoodItemCard from '../../component/home_page/food/FoodItemCard';
import {
    useFoodFavourites,
    type FavouriteFood,
} from '../../contexts/FoodFavouritesContext';

export default function FoodFavouritesPage() {
    const router = useRouter();

    const {
        favourites,
        isLoading,
        storageError,
        toggleFavourite,
    } = useFoodFavourites();

    const [search, setSearch] = useState('');
    const [quantities, setQuantities] = useState<
        Record<string, number>
    >({});

    const query = search.trim().toLowerCase();

    const filteredFoods = favourites.filter((food) =>
        [
            food.name,
            food.shop_name,
            food.category_name,
            food.description,
        ].some((value) =>
            value?.toLowerCase().includes(query)
        )
    );

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
        router.push({
            pathname: '/food/checkout',
            params: {
                shopId: food.place_id,
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

                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>
                        Favourite foods
                    </Text>
                    <Text style={styles.headerSubtitle}>
                        Your saved campus cravings
                    </Text>
                </View>

                <View style={styles.headerIcon}>
                    <Ionicons
                        name="heart"
                        size={23}
                        color="#EA580C"
                    />
                </View>
            </View>

            <FlatList
                data={isLoading ? [] : filteredFoods}
                keyExtractor={(food) => food.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                ListHeaderComponent={
                    <>
                        <View style={styles.hero}>
                            <Text style={styles.eyebrow}>
                                SAVED WITH LOVE
                            </Text>

                            <Text style={styles.heroTitle}>
                                All your favourites.{'\n'}
                                One delicious place.
                            </Text>

                            <Text style={styles.heroText}>
                                Keep the foods you love close for
                                your next campus food break.
                            </Text>

                            <View style={styles.savedBadge}>
                                <Ionicons
                                    name="heart"
                                    size={15}
                                    color="#EA580C"
                                />
                                <Text style={styles.savedText}>
                                    {favourites.length}{' '}
                                    {favourites.length === 1
                                        ? 'saved food'
                                        : 'saved foods'}
                                </Text>
                            </View>
                        </View>

                        {!!storageError && (
                            <Text style={styles.errorText}>
                                {storageError}
                            </Text>
                        )}

                        {!isLoading &&
                            favourites.length > 0 && (
                                <>
                                    <FoodSearchBar
                                        value={search}
                                        onChangeText={setSearch}
                                        placeholder="Search foods or shops..."
                                    />

                                    <View style={styles.sectionRow}>
                                        <Text style={styles.sectionTitle}>
                                            {query
                                                ? 'Search results'
                                                : 'Your favourites'}
                                        </Text>

                                        <Text style={styles.resultCount}>
                                            {filteredFoods.length}{' '}
                                            {filteredFoods.length === 1
                                                ? 'item'
                                                : 'items'}
                                        </Text>
                                    </View>

                                    <Text style={styles.priceNote}>
                                        Prices and availability are
                                        checked again at checkout.
                                    </Text>
                                </>
                            )}
                    </>
                }
                renderItem={({ item }) => (
                    <View>
                        <TouchableOpacity
                            style={styles.shopRow}
                            onPress={() =>
                                router.push({
                                    pathname: '/food/[id]',
                                    params: {
                                        id: item.place_id,
                                    },
                                })
                            }
                            accessibilityRole="button"
                            accessibilityLabel={`Open ${
                                item.shop_name || 'shop'
                            } menu`}
                        >
                            <Ionicons
                                name="storefront-outline"
                                size={17}
                                color="#9A3412"
                            />

                            <Text
                                style={styles.shopName}
                                numberOfLines={1}
                            >
                                {item.shop_name || 'View shop menu'}
                            </Text>

                            <Ionicons
                                name="chevron-forward"
                                size={16}
                                color="#9A3412"
                            />
                        </TouchableOpacity>

                        <FoodItemCard
                            food={item}
                            isFavourite
                            quantity={quantities[item.id] ?? 1}
                            onToggleFavourite={
                                storageError
                                    ? undefined
                                    : toggleFavourite
                            }
                            onQuantityChange={(
                                quantity: number
                            ) =>
                                changeQuantity(
                                    item.id,
                                    quantity
                                )
                            }
                            onBuy={buyFood}
                        />
                    </View>
                )}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        {isLoading ? (
                            <>
                                <ActivityIndicator
                                    size="large"
                                    color="#EA580C"
                                />
                                <Text style={styles.emptyTitle}>
                                    Loading your favourites…
                                </Text>
                            </>
                        ) : (
                            <>
                                <View style={styles.emptyIcon}>
                                    <Ionicons
                                        name={
                                            query
                                                ? 'search-outline'
                                                : 'heart-outline'
                                        }
                                        size={36}
                                        color="#EA580C"
                                    />
                                </View>

                                <Text style={styles.emptyTitle}>
                                    {query
                                        ? 'No matching favourites'
                                        : storageError
                                          ? 'Favourites unavailable'
                                          : 'Your favourites start here'}
                                </Text>

                                <Text style={styles.emptyText}>
                                    {query
                                        ? 'Try another food or shop name.'
                                        : storageError
                                          ? 'Restart the app to try loading your saved foods again.'
                                          : 'Tap the heart on a food card to save it here.'}
                                </Text>

                                <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={() => {
                                        if (query) {
                                            setSearch('');
                                        } else {
                                            router.push('/food');
                                        }
                                    }}
                                    accessibilityRole="button"
                                >
                                    <Text style={styles.actionText}>
                                        {query
                                            ? 'Clear search'
                                            : 'Explore food shops'}
                                    </Text>
                                </TouchableOpacity>
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
    headerContent: {
        flex: 1,
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
    headerIcon: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#FFEDD5',
        alignItems: 'center',
        justifyContent: 'center',
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
        backgroundColor: '#FFF1E2',
        borderWidth: 1,
        borderColor: '#FED7AA',
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
        lineHeight: 35,
        fontWeight: '800',
        color: '#431407',
    },
    heroText: {
        marginTop: 10,
        fontSize: 14,
        lineHeight: 22,
        color: '#9A3412',
    },
    savedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: 7,
        marginTop: 16,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
    },
    savedText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#9A3412',
    },
    errorText: {
        marginBottom: 14,
        fontSize: 13,
        lineHeight: 20,
        color: '#B91C1C',
    },
    sectionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 20,
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
    },
    resultCount: {
        fontSize: 12,
        color: '#6B7280',
    },
    priceNote: {
        marginBottom: 18,
        fontSize: 12,
        lineHeight: 18,
        color: '#6B7280',
    },
    shopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        minHeight: 44,
        paddingHorizontal: 4,
        marginBottom: 6,
    },
    shopName: {
        flex: 1,
        fontSize: 13,
        fontWeight: '600',
        color: '#9A3412',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 40,
    },
    emptyIcon: {
        width: 80,
        height: 80,
        borderRadius: 26,
        backgroundColor: '#FFEDD5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyTitle: {
        marginTop: 18,
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
    actionButton: {
        marginTop: 20,
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 14,
        backgroundColor: '#EA580C',
    },
    actionText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});