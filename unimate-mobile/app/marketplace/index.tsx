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
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import {
    Stack,
    useFocusEffect,
    useRouter,
} from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import MarketplaceItemCard from '../../component/home_page/marketplace/MarketplaceItemCard';
import {
    useMarketplaceFavourites,
    type MarketplaceItem,
} from '../../contexts/MarketplaceFavouritesContext';

const API_URL = 'http://10.0.2.2:5000/api/marketplace';
const PAGE_SIZE = 30;

type Category = {
    id: number;
    name: string;
};

type ItemsResponse = {
    items?: MarketplaceItem[];
    error?: string;
};

type CategoriesResponse = {
    categories?: Category[];
    error?: string;
};

export default function MarketplacePage() {
    const router = useRouter();

    const {
        favourites,
        isLoading: favouritesLoading,
        storageError,
        isFavourite,
        toggleFavourite,
    } = useMarketplaceFavourites();

    const [items, setItems] = useState<MarketplaceItem[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [search, setSearch] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryId, setCategoryId] = useState<number | null>(
        null
    );

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [error, setError] = useState('');
    const [moreError, setMoreError] = useState('');
    const [categoryError, setCategoryError] = useState('');

    const itemsRef = useRef<MarketplaceItem[]>([]);
    const offsetRef = useRef(0);
    const hasMoreRef = useRef(false);
    const busyRef = useRef(false);
    const requestRef = useRef<AbortController | null>(null);
    const categoryRequestRef = useRef<AbortController | null>(
        null
    );

    // Avoid sending a request for every keystroke.
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchQuery(search.trim());
        }, 350);

        return () => clearTimeout(timer);
    }, [search]);

    const loadCategories = useCallback(async () => {
        categoryRequestRef.current?.abort();

        const controller = new AbortController();
        categoryRequestRef.current = controller;

        setCategoryError('');

        try {
            const response = await fetch(
                `${API_URL}/categories`,
                { signal: controller.signal }
            );

            const data =
                (await response.json()) as CategoriesResponse;

            if (controller.signal.aborted) return;

            if (!response.ok || !Array.isArray(data.categories)) {
                throw new Error(
                    data.error || 'Unable to load categories.'
                );
            }

            setCategories(data.categories);
        } catch {
            if (!controller.signal.aborted) {
                setCategoryError(
                    'Categories could not be loaded.'
                );
            }
        }
    }, []);

    const loadItems = useCallback(
        async (mode: 'initial' | 'refresh' | 'more') => {
            if (
                mode === 'more' &&
                (busyRef.current || !hasMoreRef.current)
            ) {
                return;
            }

            requestRef.current?.abort();

            const controller = new AbortController();
            requestRef.current = controller;
            busyRef.current = true;

            const isCurrent = () =>
                requestRef.current === controller &&
                !controller.signal.aborted;

            const offset =
                mode === 'more' ? offsetRef.current : 0;

            if (mode === 'more') {
                setLoadingMore(true);
                setMoreError('');
            } else {
                setError('');
                setMoreError('');
                setLoadingMore(false);

                if (mode === 'initial') {
                    setLoading(true);
                    setRefreshing(false);
                    itemsRef.current = [];
                    offsetRef.current = 0;
                    hasMoreRef.current = false;
                    setItems([]);
                    setHasMore(false);
                } else {
                    setRefreshing(true);
                }
            }

            const queryParts = [
                `limit=${PAGE_SIZE}`,
                `offset=${offset}`,
            ];

            if (searchQuery) {
                queryParts.push(
                    `search=${encodeURIComponent(searchQuery)}`
                );
            }

            if (categoryId !== null) {
                queryParts.push(`categoryId=${categoryId}`);
            }

            try {
                const response = await fetch(
                    `${API_URL}/items?${queryParts.join('&')}`,
                    { signal: controller.signal }
                );

                const data =
                    (await response.json()) as ItemsResponse;

                if (!isCurrent()) return;

                if (!response.ok || !Array.isArray(data.items)) {
                    throw new Error(
                        data.error || 'Unable to load items.'
                    );
                }

                const pageItems = data.items.map((item) => ({
                    ...item,
                    price: Number(item.price),
                }));

                const combined =
                    mode === 'more'
                        ? [...itemsRef.current, ...pageItems]
                        : pageItems;

                const uniqueItems = Array.from(
                    new Map(
                        combined.map((item) => [item.id, item])
                    ).values()
                );

                itemsRef.current = uniqueItems;
                offsetRef.current = offset + pageItems.length;
                hasMoreRef.current =
                    pageItems.length === PAGE_SIZE;

                setItems(uniqueItems);
                setHasMore(hasMoreRef.current);
            } catch (caughtError) {
                if (!isCurrent()) return;

                const message =
                    caughtError instanceof Error
                        ? caughtError.message
                        : 'Unable to load marketplace items.';

                if (mode === 'more') {
                    setMoreError(message);
                } else {
                    setError(message);
                }
            } finally {
                if (isCurrent()) {
                    busyRef.current = false;
                    setLoading(false);
                    setRefreshing(false);
                    setLoadingMore(false);
                }
            }
        },
        [searchQuery, categoryId]
    );

    useFocusEffect(
        useCallback(() => {
            void loadCategories();

            return () => {
                categoryRequestRef.current?.abort();
            };
        }, [loadCategories])
    );

    useFocusEffect(
        useCallback(() => {
            void loadItems('initial');

            return () => {
                requestRef.current?.abort();
                busyRef.current = false;
            };
        }, [loadItems])
    );

    const openItem = (item: MarketplaceItem) => {
        router.push({
            pathname: '/marketplace/[id]',
            params: { id: item.id },
        });
    };

    const goBack = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/home_page');
        }
    };

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

                <View style={styles.flex}>
                    <Text style={styles.headerTitle}>
                        Marketplace
                    </Text>
                    <Text style={styles.headerSubtitle}>
                        Great finds for campus life
                    </Text>
                </View>

                <TouchableOpacity
                    style={styles.headerButton}
                    onPress={() =>
                        router.push('/marketplace/favourites')
                    }
                    accessibilityRole="button"
                    accessibilityLabel="Open favourite items"
                >
                    <Ionicons
                        name="heart-outline"
                        size={24}
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
                data={loading ? [] : items}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <MarketplaceItemCard
                        item={item}
                        onPress={openItem}
                        isFavourite={isFavourite(item.id)}
                        onToggleFavourite={
                            favouritesLoading || storageError
                                ? undefined
                                : toggleFavourite
                        }
                    />
                )}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => {
                            void loadCategories();
                            void loadItems('refresh');
                        }}
                        colors={['#EA580C']}
                        tintColor="#EA580C"
                    />
                }
                ListHeaderComponent={
                    <>
                        <View style={styles.hero}>
                            <View style={styles.heroIcon}>
                                <Ionicons
                                    name="bag-handle-outline"
                                    size={28}
                                    color="#EA580C"
                                />
                            </View>

                            <Text style={styles.eyebrow}>
                                FIND IT. LOVE IT. REUSE IT.
                            </Text>
                            <Text style={styles.heroTitle}>
                                New to you.{'\n'}
                                Perfect for campus.
                            </Text>
                            <Text style={styles.heroText}>
                                Browse student essentials and
                                contact sellers directly.
                            </Text>
                        </View>

                        <View style={styles.searchBox}>
                            <Ionicons
                                name="search-outline"
                                size={21}
                                color="#EA580C"
                            />
                            <TextInput
                                style={styles.searchInput}
                                value={search}
                                onChangeText={setSearch}
                                placeholder="Search items or locations..."
                                placeholderTextColor="#9CA3AF"
                                autoCorrect={false}
                                autoCapitalize="none"
                                returnKeyType="search"
                                accessibilityLabel="Search marketplace"
                            />

                            {!!search && (
                                <TouchableOpacity
                                    style={styles.clearButton}
                                    onPress={() => setSearch('')}
                                    accessibilityRole="button"
                                    accessibilityLabel="Clear search"
                                >
                                    <Ionicons
                                        name="close-circle"
                                        size={21}
                                        color="#9CA3AF"
                                    />
                                </TouchableOpacity>
                            )}
                        </View>

                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.categories}
                        >
                            <TouchableOpacity
                                style={[
                                    styles.categoryButton,
                                    categoryId === null &&
                                        styles.activeCategory,
                                ]}
                                onPress={() => setCategoryId(null)}
                                accessibilityRole="button"
                                accessibilityState={{
                                    selected: categoryId === null,
                                }}
                            >
                                <Text
                                    style={[
                                        styles.categoryText,
                                        categoryId === null &&
                                            styles.activeCategoryText,
                                    ]}
                                >
                                    All
                                </Text>
                            </TouchableOpacity>

                            {categories.map((category) => (
                                <TouchableOpacity
                                    key={category.id}
                                    style={[
                                        styles.categoryButton,
                                        categoryId === category.id &&
                                            styles.activeCategory,
                                    ]}
                                    onPress={() =>
                                        setCategoryId(category.id)
                                    }
                                    accessibilityRole="button"
                                    accessibilityState={{
                                        selected:
                                            categoryId === category.id,
                                    }}
                                >
                                    <Text
                                        style={[
                                            styles.categoryText,
                                            categoryId === category.id &&
                                                styles.activeCategoryText,
                                        ]}
                                    >
                                        {category.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {!!categoryError && (
                            <TouchableOpacity
                                onPress={() => void loadCategories()}
                                accessibilityRole="button"
                            >
                                <Text style={styles.errorNote}>
                                    {categoryError} Tap to retry.
                                </Text>
                            </TouchableOpacity>
                        )}

                        {!!storageError && (
                            <Text style={styles.errorNote}>
                                {storageError}
                            </Text>
                        )}

                        {!!error && items.length > 0 && (
                            <TouchableOpacity
                                onPress={() =>
                                    void loadItems('refresh')
                                }
                                accessibilityRole="button"
                            >
                                <Text style={styles.errorNote}>
                                    Refresh failed: {error} Tap to retry.
                                </Text>
                            </TouchableOpacity>
                        )}

                        <View style={styles.sectionRow}>
                            <Text style={styles.sectionTitle}>
                                {searchQuery
                                    ? 'Search results'
                                    : 'Campus finds'}
                            </Text>
                            {!loading && (
                                <Text style={styles.resultCount}>
                                    {items.length} loaded
                                </Text>
                            )}
                        </View>
                    </>
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
                                    Finding your next campus essential…
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
                                    Unable to load items
                                </Text>
                                <Text style={styles.emptyText}>
                                    {error}
                                </Text>
                                <TouchableOpacity
                                    style={styles.primaryButton}
                                    onPress={() =>
                                        void loadItems('initial')
                                    }
                                >
                                    <Text style={styles.primaryText}>
                                        Try again
                                    </Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                <Ionicons
                                    name="cube-outline"
                                    size={45}
                                    color="#EA580C"
                                />
                                <Text style={styles.emptyTitle}>
                                    No items found
                                </Text>
                                <Text style={styles.emptyText}>
                                    {searchQuery || categoryId !== null
                                        ? 'Try another search or select All categories.'
                                        : 'Available items will appear here.'}
                                </Text>
                            </>
                        )}
                    </View>
                }
                ListFooterComponent={
                    !loading && items.length > 0 ? (
                        <View style={styles.footer}>
                            {!!moreError && (
                                <Text style={styles.errorNote}>
                                    {moreError}
                                </Text>
                            )}

                            {hasMore && (
                                <TouchableOpacity
                                    style={styles.loadMoreButton}
                                    onPress={() =>
                                        void loadItems('more')
                                    }
                                    disabled={
                                        loadingMore || refreshing
                                    }
                                    accessibilityRole="button"
                                >
                                    {loadingMore ? (
                                        <ActivityIndicator
                                            color="#EA580C"
                                        />
                                    ) : (
                                        <Text style={styles.loadMoreText}>
                                            {moreError
                                                ? 'Retry loading more'
                                                : 'Load more items'}
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            )}
                        </View>
                    ) : null
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
    headerButton: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#FFFFFF',
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
    countBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
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
        backgroundColor: '#FFF1E2',
        borderWidth: 1,
        borderColor: '#FED7AA',
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
        letterSpacing: 1.2,
        color: '#C2410C',
    },
    heroTitle: {
        marginTop: 10,
        fontSize: 29,
        lineHeight: 36,
        fontWeight: '800',
        color: '#431407',
    },
    heroText: {
        marginTop: 10,
        fontSize: 14,
        lineHeight: 22,
        color: '#9A3412',
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        minHeight: 56,
        paddingLeft: 16,
        paddingRight: 6,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#FED7AA',
        backgroundColor: '#FFFFFF',
    },
    searchInput: {
        flex: 1,
        minWidth: 0,
        paddingVertical: 14,
        fontSize: 14,
        color: '#1F2937',
    },
    clearButton: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    categories: {
        gap: 8,
        paddingVertical: 14,
    },
    categoryButton: {
        minHeight: 44,
        paddingHorizontal: 18,
        paddingVertical: 12,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: '#FED7AA',
        backgroundColor: '#FFFFFF',
    },
    activeCategory: {
        backgroundColor: '#EA580C',
        borderColor: '#EA580C',
    },
    categoryText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#9A3412',
    },
    activeCategoryText: {
        color: '#FFFFFF',
    },
    sectionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 5,
        marginBottom: 18,
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
    errorNote: {
        marginBottom: 12,
        fontSize: 12,
        lineHeight: 19,
        color: '#B91C1C',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 44,
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
    primaryButton: {
        marginTop: 20,
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 14,
        backgroundColor: '#EA580C',
    },
    primaryText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    footer: {
        alignItems: 'center',
        paddingBottom: 10,
    },
    loadMoreButton: {
        minHeight: 48,
        minWidth: 180,
        paddingHorizontal: 22,
        paddingVertical: 13,
        borderRadius: 14,
        backgroundColor: '#FFEDD5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadMoreText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#EA580C',
    },
});
