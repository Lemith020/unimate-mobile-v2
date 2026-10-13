import React, { useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import MarketplaceItemCard from '../../component/home_page/marketplace/MarketplaceItemCard';
import {
    useMarketplaceFavourites,
    type MarketplaceItem,
} from '../../contexts/MarketplaceFavouritesContext';

export default function MarketplaceFavouritesPage() {
    const router = useRouter();

    const {
        favourites,
        isLoading,
        storageError,
        toggleFavourite,
    } = useMarketplaceFavourites();

    const [search, setSearch] = useState('');
    const query = search.trim().toLowerCase();

    const filteredItems = favourites.filter((item) =>
        [
            item.title,
            item.category_name,
            item.city,
            item.seller_name,
        ].some((value) =>
            value?.toLowerCase().includes(query)
        )
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
            router.replace('/marketplace');
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
                        Favourite items
                    </Text>
                    <Text style={styles.headerSubtitle}>
                        Your saved campus finds
                    </Text>
                </View>

                <View style={styles.headerIcon}>
                    <Ionicons
                        name="heart"
                        size={24}
                        color="#EA580C"
                    />
                </View>
            </View>

            <FlatList
                data={isLoading ? [] : filteredItems}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <MarketplaceItemCard
                        item={item}
                        onPress={openItem}
                        isFavourite
                        onToggleFavourite={
                            storageError
                                ? undefined
                                : toggleFavourite
                        }
                    />
                )}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                ListHeaderComponent={
                    <>
                        <View style={styles.hero}>
                            <Text style={styles.eyebrow}>
                                SAVED FOR LATER
                            </Text>

                            <Text style={styles.heroTitle}>
                                Good finds.{'\n'}
                                Worth keeping close.
                            </Text>

                            <Text style={styles.heroText}>
                                Keep the items you like together
                                while you decide.
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
                                        ? 'saved item'
                                        : 'saved items'}
                                </Text>
                            </View>
                        </View>

                        {!!storageError && (
                            <Text style={styles.errorNote}>
                                {storageError}
                            </Text>
                        )}

                        {!isLoading &&
                            favourites.length > 0 && (
                                <>
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
                                            placeholder="Search saved items..."
                                            placeholderTextColor="#9CA3AF"
                                            autoCorrect={false}
                                            autoCapitalize="none"
                                            accessibilityLabel="Search favourite items"
                                        />

                                        {!!search && (
                                            <TouchableOpacity
                                                style={styles.clearButton}
                                                onPress={() =>
                                                    setSearch('')
                                                }
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

                                    <View style={styles.sectionRow}>
                                        <Text style={styles.sectionTitle}>
                                            {query
                                                ? 'Search results'
                                                : 'Your favourites'}
                                        </Text>
                                        <Text style={styles.resultCount}>
                                            {filteredItems.length}{' '}
                                            {filteredItems.length === 1
                                                ? 'item'
                                                : 'items'}
                                        </Text>
                                    </View>

                                    <Text style={styles.note}>
                                        Saved details may change.
                                        Open an item to check its
                                        latest price and availability.
                                    </Text>
                                </>
                            )}
                    </>
                }
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
                                        size={38}
                                        color="#EA580C"
                                    />
                                </View>

                                <Text style={styles.emptyTitle}>
                                    {query
                                        ? 'No matching favourites'
                                        : storageError
                                          ? 'Favourites unavailable'
                                          : 'Save your first campus find'}
                                </Text>

                                <Text style={styles.emptyText}>
                                    {query
                                        ? 'Try another item name, category or location.'
                                        : storageError
                                          ? 'Restart the app to try loading your saved items again.'
                                          : 'Tap the heart on an item to keep it here.'}
                                </Text>

                                <TouchableOpacity
                                    style={styles.primaryButton}
                                    onPress={() => {
                                        if (query) {
                                            setSearch('');
                                        } else {
                                            router.push(
                                                '/marketplace'
                                            );
                                        }
                                    }}
                                    accessibilityRole="button"
                                >
                                    <Text style={styles.primaryText}>
                                        {query
                                            ? 'Clear search'
                                            : 'Explore marketplace'}
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
        letterSpacing: 1.3,
        color: '#C2410C',
    },
    heroTitle: {
        marginTop: 12,
        fontSize: 28,
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
    note: {
        marginBottom: 18,
        fontSize: 12,
        lineHeight: 19,
        color: '#6B7280',
    },
    errorNote: {
        marginBottom: 14,
        fontSize: 12,
        lineHeight: 19,
        color: '#B91C1C',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 42,
    },
    emptyIcon: {
        width: 82,
        height: 82,
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
});


