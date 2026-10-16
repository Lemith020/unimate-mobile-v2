import React, { useCallback, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';


const API_BASE_URL = 'http://10.0.2.2:5000/api';

function formatDistance(value) {
    if (value === null || value === undefined) {
        return 'Distance unavailable';
    }

    const distance = Number(value);

    if (!Number.isFinite(distance) || distance < 0) {
        return 'Distance unavailable';
    }

    if (distance < 1) {
        return `${Math.round(distance * 1000)} m from campus`;
    }

    return `${distance.toFixed(1)} km from campus`;
}

function formatRent(value) {
    if (value === null || value === undefined) {
        return 'Rent unavailable';
    }

    const rent = Number(value);

    if (!Number.isFinite(rent) || rent < 0) {
        return 'Rent unavailable';
    }

    return `Rs. ${rent.toLocaleString('en-LK')} / month`;
}

function getGenderLabel(value) {
    if (value === 'boys') return 'Boys';
    if (value === 'girls') return 'Girls';
    if (value === 'male') return 'Boys';
    if (value === 'female') return 'Girls';
    return 'Any gender';
}

function getRoomLabel(value) {
    if (typeof value !== 'string' || !value.trim()) {
        return null;
    }

    return value
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function BoardingCard({ boarding, onPress }) {
    const [imageFailed, setImageFailed] = useState(false);

    const imageUrl =
        typeof boarding.image_url === 'string'
            ? boarding.image_url.trim()
            : '';

    const roomLabel = getRoomLabel(boarding.room_type);

    return (
        <TouchableOpacity
            style={styles.card}
            activeOpacity={0.85}
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={`View ${boarding.title}`}
        >
            <View style={styles.imageContainer}>
                {imageUrl && !imageFailed ? (
                    <Image
                        source={{ uri: imageUrl }}
                        style={styles.cardImage}
                        resizeMode="cover"
                        onError={() => setImageFailed(true)}
                    />
                ) : (
                    <View style={styles.imagePlaceholder}>
                        <Ionicons
                            name="home-outline"
                            size={42}
                            color="#FDBA74"
                        />
                        <Text style={styles.placeholderText}>
                            Image unavailable
                        </Text>
                    </View>
                )}

                <View style={styles.featuredBadge}>
                    <Ionicons name="star" size={11} color="#FFFFFF" />
                    <Text style={styles.featuredText}>Featured</Text>
                </View>
            </View>

            <View style={styles.cardBody}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                    {boarding.title}
                </Text>

                <Text style={styles.price}>
                    {formatRent(boarding.monthly_rent)}
                </Text>

                <View style={styles.distanceRow}>
                    <Ionicons
                        name="location-outline"
                        size={14}
                        color="#78716C"
                    />
                    <Text style={styles.distance}>
                        {formatDistance(boarding.distance_km)}
                    </Text>
                </View>

                <View style={styles.tagRow}>
                    <View style={styles.tag}>
                        <Text style={styles.tagText}>
                            {getGenderLabel(boarding.gender_type)}
                        </Text>
                    </View>

                    {roomLabel ? (
                        <View style={styles.tag}>
                            <Text style={styles.tagText}>{roomLabel}</Text>
                        </View>
                    ) : null}
                </View>

                <View style={styles.cardFooter}>
                    <Text style={styles.city} numberOfLines={1}>
                        {boarding.city || 'Near campus'}
                    </Text>

                    <View style={styles.viewButton}>
                        <Text style={styles.viewText}>View</Text>
                        <Ionicons
                            name="arrow-forward"
                            size={14}
                            color="#EA580C"
                        />
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
}

export default function FeaturedBoardings() {
    const router = useRouter();

    const [boardings, setBoardings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [reloadKey, setReloadKey] = useState(0);

    useFocusEffect(
        useCallback(() => {
            let active = true;
            const controller = new AbortController();

            const loadBoardings = async () => {
                setLoading(true);
                setError('');
                setNotice('');
                setBoardings([]);

                try {
                    const storedUser = await AsyncStorage.getItem('userData');

                    if (!active) return;

                    const user = storedUser ? JSON.parse(storedUser) : null;
                    const universityId = Number(user?.profile?.university_id);

                    if (
                        !Number.isInteger(universityId) ||
                        universityId <= 0 ||
                        universityId > 2147483647
                    ) {
                        setNotice(
                            'Log in and select your university in your profile to see featured boardings.'
                        );
                        return;
                    }

                    const response = await fetch(
                        `${API_BASE_URL}/boardings/featured/university/${universityId}`,
                        { signal: controller.signal }
                    );

                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(
                            data?.error || 'Unable to load featured boardings.'
                        );
                    }

                    if (!Array.isArray(data.boardings)) {
                        throw new Error('Invalid response from the server.');
                    }

                    if (active) {
                        setBoardings(data.boardings);
                    }
                } catch (loadError) {
                    if (active && loadError?.name !== 'AbortError') {
                        setError(
                            loadError?.message || 'Unable to load featured boardings.'
                        );
                    }
                } finally {
                    if (active) {
                        setLoading(false);
                    }
                }
            };

            loadBoardings();

            return () => {
                active = false;
                controller.abort();
            };
        }, [reloadKey])
    );

    const openBoarding = (id) => {
        router.push({
            pathname: '/boardings/[id]',
            params: { id },
        });
    };

    return (
        <View style={styles.section}>
            <View style={styles.headerRow}>
                <View style={styles.headingContent}>
                    <Text style={styles.sectionTitle}>
                        Featured Boardings
                    </Text>

                    <Text style={styles.sectionSubtitle}>
                        Find your next place near campus
                    </Text>
                </View>

                <TouchableOpacity
                    style={styles.seeAllButton}
                    activeOpacity={0.7}
                    onPress={() => router.push('/boardings')}
                    accessibilityRole="button"
                    accessibilityLabel="See all boardings"
                >
                    <Text style={styles.seeAll}>See all</Text>
                    <Ionicons
                        name="chevron-forward"
                        size={14}
                        color="#EA580C"
                    />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.messageBox}>
                    <ActivityIndicator size="small" color="#F97316" />
                    <Text style={styles.messageText}>
                        Loading featured boardings...
                    </Text>
                </View>
            ) : error ? (
                <View style={styles.messageBox}>
                    <Ionicons
                        name="cloud-offline-outline"
                        size={28}
                        color="#EA580C"
                    />

                    <Text style={styles.messageText}>{error}</Text>

                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={() => setReloadKey((value) => value + 1)}
                        accessibilityRole="button"
                    >
                        <Text style={styles.retryText}>Try again</Text>
                    </TouchableOpacity>
                </View>
            ) : notice || boardings.length === 0 ? (
                <View style={styles.messageBox}>
                    <Ionicons
                        name="home-outline"
                        size={30}
                        color="#FB923C"
                    />

                    <Text style={styles.messageText}>
                        {notice ||
                            'No featured boardings for your university yet.'}
                    </Text>
                </View>
            ) : (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {boardings.map((boarding) => (
                        <BoardingCard
                            key={`${boarding.id}:${boarding.image_url || ''}`}
                            boarding={boarding}
                            onPress={() => openBoarding(boarding.id)}
                        />
                    ))}
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    section: {
        marginVertical: 15,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginBottom: 14,
    },
    headingContent: {
        flex: 1,
        marginRight: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#332211',
    },
    sectionSubtitle: {
        marginTop: 4,
        fontSize: 12,
        color: '#78716C',
    },
    seeAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 44,
        gap: 3,
    },
    seeAll: {
        fontSize: 13,
        color: '#EA580C',
        fontWeight: '600',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 8,
        gap: 15,
    },
    card: {
        width: 250,
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#FFEDD5',
        overflow: 'hidden',
    },
    imageContainer: {
        height: 145,
        backgroundColor: '#FFF7ED',
    },
    cardImage: {
        width: '100%',
        height: '100%',
    },
    imagePlaceholder: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    placeholderText: {
        fontSize: 11,
        color: '#A8A29E',
    },
    featuredBadge: {
        position: 'absolute',
        top: 10,
        left: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#EA580C',
        borderRadius: 8,
        paddingHorizontal: 9,
        paddingVertical: 6,
    },
    featuredText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    cardBody: {
        padding: 13,
    },
    cardTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#292524',
    },
    price: {
        marginTop: 6,
        fontSize: 14,
        fontWeight: '700',
        color: '#EA580C',
    },
    distanceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 8,
    },
    distance: {
        flex: 1,
        fontSize: 12,
        color: '#78716C',
    },
    tagRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginTop: 11,
    },
    tag: {
        backgroundColor: '#FFF7ED',
        paddingHorizontal: 9,
        paddingVertical: 5,
        borderRadius: 7,
    },
    tagText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#9A3412',
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: '#FFF1E6',
        marginTop: 12,
        paddingTop: 10,
    },
    city: {
        flex: 1,
        marginRight: 8,
        fontSize: 11,
        color: '#78716C',
    },
    viewButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    viewText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#EA580C',
    },
    messageBox: {
        marginHorizontal: 20,
        padding: 24,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#FFEDD5',
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        gap: 10,
    },
    messageText: {
        fontSize: 13,
        lineHeight: 20,
        color: '#78716C',
        textAlign: 'center',
    },
    retryButton: {
        paddingHorizontal: 18,
        paddingVertical: 11,
        borderRadius: 10,
        backgroundColor: '#FFF7ED',
    },
    retryText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#EA580C',
    },
});