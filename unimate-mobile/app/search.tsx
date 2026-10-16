import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    Keyboard,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import {
    useLocalSearchParams,
    useRouter,
    type Href,
} from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = 'http://10.0.2.2:5000/api';

type Category =
    | 'all'
    | 'boarding'
    | 'food'
    | 'pharmacy'
    | 'marketplace';

type SearchResult = {
    id: string;
    type: Exclude<Category, 'all'>;
    title: string;
    subtitle?: string;
    image_url?: string | null;
    price?: number | string | null;
    route: string;
    params?: Record<string, string>;
};

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const FILTERS: { key: Category; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'boarding', label: 'Boardings' },
    { key: 'food', label: 'Food shops' },
    { key: 'pharmacy', label: 'Pharmacies' },
    { key: 'marketplace', label: 'Marketplace' },
];

const CATEGORY_INFO: Record<
    SearchResult['type'],
    { label: string; icon: IconName; color: string; background: string }
> = {
    boarding: {
        label: 'Boarding',
        icon: 'home-outline',
        color: '#2563EB',
        background: '#EFF6FF',
    },
    food: {
        label: 'Food shop',
        icon: 'restaurant-outline',
        color: '#EA580C',
        background: '#FFF7ED',
    },
    pharmacy: {
        label: 'Pharmacy',
        icon: 'medkit-outline',
        color: '#15803D',
        background: '#F0FDF4',
    },
    marketplace: {
        label: 'Marketplace',
        icon: 'bag-handle-outline',
        color: '#9333EA',
        background: '#FAF5FF',
    },
};

function ResultCard({
    item,
    onPress,
}: {
    item: SearchResult;
    onPress: () => void;
}) {
    const [imageFailed, setImageFailed] = useState(false);
    const category = CATEGORY_INFO[item.type];

    useEffect(() => {
        setImageFailed(false);
    }, [item.image_url]);

    const price = Number(item.price);
    const hasPrice =
        item.price !== null &&
        item.price !== undefined &&
        item.price !== '' &&
        Number.isFinite(price) &&
        price >= 0;

    return (
        <TouchableOpacity
            style={styles.card}
            onPress={onPress}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={`Open ${item.title}`}
        >
            <View
                style={[
                    styles.cardImage,
                    { backgroundColor: category.background },
                ]}
            >
                {item.image_url && !imageFailed ? (
                    <Image
                        source={{ uri: item.image_url }}
                        style={styles.image}
                        resizeMode="cover"
                        onError={() => setImageFailed(true)}
                    />
                ) : (
                    <Ionicons
                        name={category.icon}
                        size={30}
                        color={category.color}
                    />
                )}
            </View>

            <View style={styles.cardContent}>
                <Text
                    style={[
                        styles.categoryLabel,
                        { color: category.color },
                    ]}
                >
                    {category.label}
                </Text>

                <Text style={styles.cardTitle} numberOfLines={2}>
                    {item.title}
                </Text>

                {!!item.subtitle && (
                    <Text style={styles.subtitle} numberOfLines={2}>
                        {item.subtitle}
                    </Text>
                )}

                {hasPrice && (
                    <Text style={styles.price}>
                        Rs. {price.toFixed(2)}
                        {item.type === 'boarding' ? ' / month' : ''}
                    </Text>
                )}
            </View>

            <Ionicons
                name="chevron-forward"
                size={18}
                color="#A8A29E"
            />
        </TouchableOpacity>
    );
}

export default function SearchScreen() {
    const router = useRouter();
    const { q } = useLocalSearchParams<{ q?: string | string[] }>();

    const initialQuery = (
        Array.isArray(q) ? q[0] ?? '' : q ?? ''
    ).trim().slice(0, 100);

    const [input, setInput] = useState(initialQuery);
    const [query, setQuery] = useState(initialQuery);
    const [category, setCategory] = useState<Category>('all');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [retry, setRetry] = useState(0);

    useEffect(() => {
        setInput(initialQuery);
        setQuery(initialQuery);
    }, [initialQuery]);

    useEffect(() => {
        const controller = new AbortController();
        let active = true;

        setResults([]);
        setError('');

        if (!query) {
            setLoading(false);
            return () => controller.abort();
        }

        async function loadResults() {
            setLoading(true);

            try {
                const storedUser = await AsyncStorage.getItem('userData');

                if (!active) return;

                let universityId = '';

                if (storedUser) {
                    try {
                        const user = JSON.parse(storedUser);
                        const id = user?.profile?.university_id;

                        if (id !== null && id !== undefined) {
                            universityId = String(id);
                        }
                    } catch {
                        // Guests can still search without a university.
                    }
                }

                let url =
                    `${API_BASE}/search?q=${encodeURIComponent(query)}` +
                    `&category=${encodeURIComponent(category)}`;

                if (universityId) {
                    url +=
                        `&university_id=${encodeURIComponent(universityId)}`;
                }

                const response = await fetch(url, {
                    signal: controller.signal,
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Could not load results.');
                }

                if (!Array.isArray(data.results)) {
                    throw new Error('Unexpected search response.');
                }

                const validResults = data.results.filter(
                    (item: SearchResult) =>
                        item &&
                        typeof item.id === 'string' &&
                        typeof item.title === 'string' &&
                        typeof item.route === 'string' &&
                        item.route.startsWith('/') &&
                        Object.prototype.hasOwnProperty.call(
                            CATEGORY_INFO,
                            item.type,
                        ),
                );

                if (active) {
                    setResults(validResults);
                }
            } catch (err) {
                if (!active || controller.signal.aborted) return;

                setError(
                    err instanceof Error
                        ? err.message
                        : 'Search failed. Please try again.',
                );
            } finally {
                if (active) setLoading(false);
            }
        }

        loadResults();

        return () => {
            active = false;
            controller.abort();
        };
    }, [query, category, retry]);

    const submitSearch = () => {
        Keyboard.dismiss();

        const nextQuery = input.trim();

        if (nextQuery === query) {
            setRetry((value) => value + 1);
        } else {
            setQuery(nextQuery);
        }
    };

    const openResult = (item: SearchResult) => {
        router.push({
            pathname: item.route,
            params: item.params ?? {},
        } as Href);
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
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={goBack}
                    style={styles.backButton}
                    accessibilityRole="button"
                    accessibilityLabel="Go back"
                >
                    <Ionicons
                        name="arrow-back"
                        size={23}
                        color="#292524"
                    />
                </TouchableOpacity>

                <View>
                    <Text style={styles.heading}>Find your next discovery</Text>
                    <Text style={styles.headerSubtitle}>
                        Explore your campus essentials
                    </Text>
                </View>
            </View>

            <View style={styles.searchBar}>
                <Ionicons
                    name="search-outline"
                    size={21}
                    color="#EA580C"
                />

                <TextInput
                    value={input}
                    onChangeText={setInput}
                    style={styles.input}
                    placeholder="Boardings, shops, items..."
                    placeholderTextColor="#A8A29E"
                    returnKeyType="search"
                    onSubmitEditing={submitSearch}
                    autoCapitalize="none"
                    autoCorrect={false}
                    maxLength={100}
                    accessibilityLabel="Search Unimate"
                />

                {!!input && (
                    <TouchableOpacity
                        onPress={() => {
                            setInput('');
                            setQuery('');
                        }}
                        style={styles.clearButton}
                        accessibilityRole="button"
                        accessibilityLabel="Clear search"
                    >
                        <Ionicons
                            name="close-circle"
                            size={20}
                            color="#A8A29E"
                        />
                    </TouchableOpacity>
                )}

                <TouchableOpacity
                    style={[
                        styles.searchButton,
                        !input.trim() && styles.disabledButton,
                    ]}
                    onPress={submitSearch}
                    disabled={!input.trim()}
                    accessibilityRole="button"
                    accessibilityLabel="Search"
                >
                    <Ionicons
                        name="arrow-forward"
                        size={20}
                        color="#FFFFFF"
                    />
                </TouchableOpacity>
            </View>

            <View style={styles.filterContainer}>
                <FlatList
                    horizontal
                    data={FILTERS}
                    keyExtractor={(item) => item.key}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filters}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            onPress={() => setCategory(item.key)}
                            style={[
                                styles.filter,
                                category === item.key && styles.activeFilter,
                            ]}
                            accessibilityRole="button"
                            accessibilityState={{
                                selected: category === item.key,
                            }}
                        >
                            <Text
                                style={[
                                    styles.filterText,
                                    category === item.key &&
                                        styles.activeFilterText,
                                ]}
                            >
                                {item.label}
                            </Text>
                        </TouchableOpacity>
                    )}
                />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#EA580C" />
                    <Text style={styles.stateDescription}>
                        Finding matches...
                    </Text>
                </View>
            ) : error ? (
                <View style={styles.center}>
                    <Ionicons
                        name="cloud-offline-outline"
                        size={45}
                        color="#EA580C"
                    />
                    <Text style={styles.stateTitle}>Could not search</Text>
                    <Text style={styles.stateDescription}>{error}</Text>

                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={() => setRetry((value) => value + 1)}
                        accessibilityRole="button"
                    >
                        <Text style={styles.retryText}>Try again</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={results}
                    keyExtractor={(item) => `${item.type}-${item.id}`}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={[
                        styles.results,
                        results.length === 0 && styles.emptyList,
                    ]}
                    ListHeaderComponent={
                        query && results.length > 0 ? (
                            <Text style={styles.resultsLabel}>
                                {results.length} matches for “{query}”
                            </Text>
                        ) : null
                    }
                    renderItem={({ item }) => (
                        <ResultCard
                            item={item}
                            onPress={() => openResult(item)}
                        />
                    )}
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <View style={styles.emptyIcon}>
                                <Ionicons
                                    name="search-outline"
                                    size={38}
                                    color="#EA580C"
                                />
                            </View>

                            <Text style={styles.stateTitle}>
                                {query ? 'No matches yet' : 'What are you looking for?'}
                            </Text>

                            <Text style={styles.stateDescription}>
                                {query
                                    ? 'Try another name or choose a different category.'
                                    : 'Search for a boarding, food shop, pharmacy or marketplace item.'}
                            </Text>
                        </View>
                    }
                />
            )}
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
        paddingTop: 12,
        paddingBottom: 18,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#F0E7DE',
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    heading: {
        fontSize: 17,
        fontWeight: '700',
        color: '#292524',
    },
    headerSubtitle: {
        marginTop: 4,
        fontSize: 12,
        color: '#78716C',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 20,
        paddingLeft: 14,
        paddingRight: 6,
        minHeight: 56,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#FED7AA',
        backgroundColor: '#FFFFFF',
    },
    input: {
        flex: 1,
        minWidth: 0,
        paddingHorizontal: 10,
        paddingVertical: 14,
        fontSize: 14,
        color: '#292524',
    },
    clearButton: {
        padding: 7,
    },
    searchButton: {
        width: 42,
        height: 42,
        borderRadius: 13,
        backgroundColor: '#EA580C',
        alignItems: 'center',
        justifyContent: 'center',
    },
    disabledButton: {
        backgroundColor: '#FDBA74',
    },
    filterContainer: {
        marginVertical: 18,
    },
    filters: {
        paddingHorizontal: 20,
        gap: 8,
    },
    filter: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E7E5E4',
        backgroundColor: '#FFFFFF',
    },
    activeFilter: {
        backgroundColor: '#EA580C',
        borderColor: '#EA580C',
    },
    filterText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#78716C',
    },
    activeFilterText: {
        color: '#FFFFFF',
    },
    results: {
        paddingHorizontal: 20,
        paddingBottom: 24,
    },
    resultsLabel: {
        fontSize: 13,
        color: '#78716C',
        marginBottom: 14,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        marginBottom: 12,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#F0E7DE',
        backgroundColor: '#FFFFFF',
        gap: 12,
    },
    cardImage: {
        width: 82,
        height: 90,
        borderRadius: 13,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    cardContent: {
        flex: 1,
    },
    categoryLabel: {
        fontSize: 10,
        fontWeight: '700',
        marginBottom: 5,
    },
    cardTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#292524',
    },
    subtitle: {
        fontSize: 12,
        lineHeight: 18,
        marginTop: 4,
        color: '#78716C',
    },
    price: {
        fontSize: 13,
        fontWeight: '700',
        color: '#EA580C',
        marginTop: 7,
    },
    emptyList: {
        flexGrow: 1,
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 28,
    },
    emptyIcon: {
        width: 84,
        height: 84,
        borderRadius: 28,
        backgroundColor: '#FFEDD5',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 6,
    },
    stateTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#292524',
        textAlign: 'center',
        marginTop: 14,
    },
    stateDescription: {
        fontSize: 13,
        lineHeight: 21,
        color: '#78716C',
        textAlign: 'center',
        marginTop: 9,
    },
    retryButton: {
        marginTop: 20,
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: '#EA580C',
        borderRadius: 13,
    },
    retryText: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
});