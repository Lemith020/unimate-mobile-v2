import React, {
    useCallback,
    useRef,
    useState,
} from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Linking,
    Modal,
    Platform,
    RefreshControl,
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
    useFocusEffect,
    useRouter,
} from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import PharmacyListCard from '../../component/home_page/pharmacy/PharmacyListCard';

const API_URL = 'http://10.0.2.2:5000/api/pharmacy';

type Pharmacy = {
    id: string;
    name: string;
    phone?: string | null;
    whatsapp_number?: string | null;
    address?: string | null;
    city?: string | null;
    category_name?: string;
    cover_image_url?: string | null;
    distance_km?: number;
    is_open_24h?: boolean;
    opening_status?: 'open' | 'closed' | 'unknown';
    opening_text?: string;
};

type PharmacyResponse = {
    university?: {
        id: number;
        name: string;
    };
    pharmacies?: Pharmacy[];
    error?: string;
};

type Filter = 'all' | 'open' | '24h';

function getWhatsAppNumber(value?: string | null) {
    if (typeof value !== 'string') return null;

    const cleaned = value.trim().replace(/[\s()-]/g, '');

    // Sri Lankan local number: 07XXXXXXXX -> 947XXXXXXXX.
    if (/^0\d{9}$/.test(cleaned)) {
        return `94${cleaned.slice(1)}`;
    }

    if (/^94\d{9}$/.test(cleaned)) {
        return cleaned;
    }

    if (/^\+[1-9]\d{8,14}$/.test(cleaned)) {
        return cleaned.slice(1);
    }

    return null;
}

export default function PharmacyPage() {
    const router = useRouter();

    const [pharmacies, setPharmacies] = useState<
        Pharmacy[]
    >([]);
    const [universityName, setUniversityName] = useState('');
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<Filter>('all');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [needsLogin, setNeedsLogin] = useState(false);

    const [selectedPharmacy, setSelectedPharmacy] =
        useState<Pharmacy | null>(null);
    const [medicineList, setMedicineList] = useState('');
    const [openingWhatsApp, setOpeningWhatsApp] =
        useState(false);

    const requestRef = useRef<AbortController | null>(null);
    const whatsappLock = useRef(false);

    const loadPharmacies = useCallback(
        async (refresh = false) => {
            requestRef.current?.abort();

            const controller = new AbortController();
            requestRef.current = controller;

            const isCurrent = () =>
                requestRef.current === controller &&
                !controller.signal.aborted;

            setError('');
            setNeedsLogin(false);

            if (refresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            try {
                const stored =
                    await AsyncStorage.getItem('userData');

                if (!isCurrent()) return;

                if (!stored) {
                    setPharmacies([]);
                    setUniversityName('');
                    setNeedsLogin(true);
                    setError(
                        'Log in to find pharmacies near your university.'
                    );
                    return;
                }

                const user = JSON.parse(stored);
                const universityId = Number(
                    user?.profile?.university_id
                );

                if (
                    !Number.isInteger(universityId) ||
                    universityId <= 0
                ) {
                    setPharmacies([]);
                    setUniversityName('');
                    setError(
                        'Please select your university in your profile.'
                    );
                    return;
                }

                setUniversityName(
                    user?.profile?.university_name || ''
                );

                const response = await fetch(
                    `${API_URL}/university/${universityId}`,
                    { signal: controller.signal }
                );

                const data =
                    (await response.json()) as PharmacyResponse;

                if (!isCurrent()) return;

                if (!response.ok) {
                    throw new Error(
                        data.error ||
                            'Unable to load pharmacies.'
                    );
                }

                if (!Array.isArray(data.pharmacies)) {
                    throw new Error(
                        'Invalid pharmacy details received.'
                    );
                }

                setPharmacies(data.pharmacies);
                setUniversityName(
                    data.university?.name ||
                        user?.profile?.university_name ||
                        'Your university'
                );
            } catch (caughtError) {
                if (!isCurrent()) return;

                setPharmacies([]);
                setError(
                    caughtError instanceof Error
                        ? caughtError.message
                        : 'Unable to load pharmacies.'
                );
            } finally {
                if (isCurrent()) {
                    setLoading(false);
                    setRefreshing(false);
                }
            }
        },
        []
    );

    useFocusEffect(
        useCallback(() => {
            void loadPharmacies();

            // Refresh opening status while this page is visible.
            const timer = setInterval(() => {
                void loadPharmacies(true);
            }, 60000);

            return () => {
                clearInterval(timer);
                requestRef.current?.abort();
            };
        }, [loadPharmacies])
    );

    const query = search.trim().toLowerCase();

    const filteredPharmacies = pharmacies.filter(
        (pharmacy) => {
            const matchesSearch =
                !query ||
                [
                    pharmacy.name,
                    pharmacy.address,
                    pharmacy.city,
                    pharmacy.category_name,
                ].some((value) =>
                    value?.toLowerCase().includes(query)
                );

            const matchesFilter =
                filter === 'all' ||
                (filter === 'open' &&
                    pharmacy.opening_status === 'open') ||
                (filter === '24h' &&
                    pharmacy.is_open_24h === true);

            return matchesSearch && matchesFilter;
        }
    );

    const goBack = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/home_page');
        }
    };

    const openMedicinePopup = (pharmacy: Pharmacy) => {
        setSelectedPharmacy(pharmacy);
        setMedicineList('');
    };

    const closeMedicinePopup = () => {
        if (openingWhatsApp) return;

        setSelectedPharmacy(null);
        setMedicineList('');
    };

    const openWhatsApp = async () => {
        if (!selectedPharmacy || whatsappLock.current) {
            return;
        }

        const list = medicineList.trim();

        if (!list) {
            Alert.alert(
                'Medicine list',
                'Please enter your medicine list first.'
            );
            return;
        }

        const number = getWhatsAppNumber(
            selectedPharmacy.whatsapp_number ||
                selectedPharmacy.phone
        );

        if (!number) {
            Alert.alert(
                'WhatsApp unavailable',
                'This pharmacy needs a valid WhatsApp number.'
            );
            return;
        }

        whatsappLock.current = true;
        setOpeningWhatsApp(true);

        const message =
            `Hello ${selectedPharmacy.name},\n\n` +
            `Could you please check the availability of these medicines?\n\n` +
            `${list}\n\n` +
            `Sent via Unimate.`;

        const encodedMessage = encodeURIComponent(message);

        try {
            try {
                await Linking.openURL(
                    `whatsapp://send?phone=${number}&text=${encodedMessage}`
                );
            } catch {
                // Fall back to WhatsApp's browser link.
                await Linking.openURL(
                    `https://wa.me/${number}?text=${encodedMessage}`
                );
            }

            setSelectedPharmacy(null);
            setMedicineList('');
        } catch {
            Alert.alert(
                'Unable to open WhatsApp',
                'Please check that WhatsApp is installed or try again.'
            );
        } finally {
            whatsappLock.current = false;
            setOpeningWhatsApp(false);
        }
    };

    const filters: { value: Filter; label: string }[] = [
        { value: 'all', label: 'All' },
        { value: 'open', label: 'Open now' },
        { value: '24h', label: '24 hours' },
    ];

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
                        Nearby pharmacies
                    </Text>
                    <Text style={styles.headerSubtitle}>
                        Care closer to campus
                    </Text>
                </View>

                <View style={styles.headerIcon}>
                    <Ionicons
                        name="medical-outline"
                        size={24}
                        color="#EA580C"
                    />
                </View>
            </View>

            <FlatList
                data={
                    loading || error
                        ? []
                        : filteredPharmacies
                }
                keyExtractor={(pharmacy) => pharmacy.id}
                renderItem={({ item }) => (
                    <PharmacyListCard
                        pharmacy={item}
                        onWhatsAppPress={openMedicinePopup}
                    />
                )}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() =>
                            void loadPharmacies(true)
                        }
                        colors={['#EA580C']}
                        tintColor="#EA580C"
                    />
                }
                ListHeaderComponent={
                    <>
                        <View style={styles.hero}>
                            <Text style={styles.eyebrow}>
                                YOUR CAMPUS CARE GUIDE
                            </Text>
                            <Text style={styles.heroTitle}>
                                A little closer.{'\n'}
                                A little easier.
                            </Text>
                            <Text style={styles.heroText}>
                                Find pharmacies, check opening
                                hours and ask about your medicine
                                list.
                            </Text>

                            {!!universityName && (
                                <View style={styles.universityRow}>
                                    <Ionicons
                                        name="school-outline"
                                        size={17}
                                        color="#9A3412"
                                    />
                                    <Text style={styles.universityText}>
                                        {universityName}
                                    </Text>
                                </View>
                            )}
                        </View>

                        {!loading && !error && (
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
                                        placeholder="Search pharmacies..."
                                        placeholderTextColor="#9CA3AF"
                                        autoCorrect={false}
                                        autoCapitalize="none"
                                        accessibilityLabel="Search pharmacies"
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
                                    showsHorizontalScrollIndicator={
                                        false
                                    }
                                    contentContainerStyle={
                                        styles.filters
                                    }
                                >
                                    {filters.map((item) => (
                                        <TouchableOpacity
                                            key={item.value}
                                            style={[
                                                styles.filterButton,
                                                filter === item.value &&
                                                    styles.activeFilter,
                                            ]}
                                            onPress={() =>
                                                setFilter(item.value)
                                            }
                                            accessibilityRole="button"
                                            accessibilityState={{
                                                selected:
                                                    filter === item.value,
                                            }}
                                        >
                                            <Text
                                                style={[
                                                    styles.filterText,
                                                    filter === item.value &&
                                                        styles.activeFilterText,
                                                ]}
                                            >
                                                {item.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>

                                <View style={styles.sectionRow}>
                                    <Text style={styles.sectionTitle}>
                                        Around your campus
                                    </Text>
                                    <Text style={styles.resultCount}>
                                        {filteredPharmacies.length}{' '}
                                        found
                                    </Text>
                                </View>

                                <Text style={styles.hoursNote}>
                                    Hours follow Sri Lanka time.
                                    Call to confirm before visiting.
                                </Text>
                            </>
                        )}
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
                                    Finding nearby pharmacies…
                                </Text>
                            </>
                        ) : error ? (
                            <>
                                <Ionicons
                                    name={
                                        needsLogin
                                            ? 'person-circle-outline'
                                            : 'alert-circle-outline'
                                    }
                                    size={46}
                                    color="#EA580C"
                                />
                                <Text style={styles.emptyTitle}>
                                    {needsLogin
                                        ? 'Welcome to your care guide'
                                        : 'Unable to load pharmacies'}
                                </Text>
                                <Text style={styles.emptyText}>
                                    {error}
                                </Text>
                                <TouchableOpacity
                                    style={styles.primaryButton}
                                    onPress={() => {
                                        if (needsLogin) {
                                            router.push('/login');
                                        } else {
                                            void loadPharmacies();
                                        }
                                    }}
                                >
                                    <Text style={styles.primaryText}>
                                        {needsLogin
                                            ? 'Log in'
                                            : 'Try again'}
                                    </Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                <Ionicons
                                    name="medical-outline"
                                    size={46}
                                    color="#EA580C"
                                />
                                <Text style={styles.emptyTitle}>
                                    No pharmacies found
                                </Text>
                                <Text style={styles.emptyText}>
                                    {pharmacies.length > 0
                                        ? 'Try another search or select All.'
                                        : 'No published pharmacies were found within 5 km of your campus.'}
                                </Text>

                                {(query || filter !== 'all') && (
                                    <TouchableOpacity
                                        style={styles.primaryButton}
                                        onPress={() => {
                                            setSearch('');
                                            setFilter('all');
                                        }}
                                    >
                                        <Text style={styles.primaryText}>
                                            Reset filters
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </>
                        )}
                    </View>
                }
            />

            <Modal
                visible={!!selectedPharmacy}
                transparent
                animationType="slide"
                onRequestClose={closeMedicinePopup}
            >
                <KeyboardAvoidingView
                    style={styles.modalOverlay}
                    behavior={
                        Platform.OS === 'ios'
                            ? 'padding'
                            : undefined
                    }
                >
                    <View style={styles.modalCard}>
                        <ScrollView
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}
                        >
                            <View style={styles.modalHeader}>
                                <View style={styles.flex}>
                                    <Text style={styles.modalTitle}>
                                        Your medicine list
                                    </Text>
                                    <Text style={styles.modalSubtitle}>
                                        {selectedPharmacy?.name}
                                    </Text>
                                </View>

                                <TouchableOpacity
                                    style={styles.headerButton}
                                    onPress={closeMedicinePopup}
                                    disabled={openingWhatsApp}
                                    accessibilityRole="button"
                                    accessibilityLabel="Close medicine list"
                                >
                                    <Ionicons
                                        name="close"
                                        size={23}
                                        color="#374151"
                                    />
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.modalDescription}>
                                Write medicine names and quantities
                                to ask the pharmacy about availability.
                            </Text>

                            <TextInput
                                style={styles.medicineInput}
                                value={medicineList}
                                onChangeText={setMedicineList}
                                placeholder={
                                    'Medicine name — quantity\nMedicine name — quantity'
                                }
                                placeholderTextColor="#9CA3AF"
                                multiline
                                textAlignVertical="top"
                                maxLength={1500}
                                editable={!openingWhatsApp}
                                accessibilityLabel="Medicine list"
                            />

                            <Text style={styles.counter}>
                                {medicineList.length} / 1500
                            </Text>

                            <Text style={styles.whatsappNote}>
                                WhatsApp will open with your message.
                                Review it and tap Send there.
                            </Text>

                            <TouchableOpacity
                                style={[
                                    styles.whatsappButton,
                                    (!medicineList.trim() ||
                                        openingWhatsApp) &&
                                        styles.disabledButton,
                                ]}
                                onPress={() => void openWhatsApp()}
                                disabled={
                                    !medicineList.trim() ||
                                    openingWhatsApp
                                }
                                accessibilityRole="button"
                            >
                                {openingWhatsApp ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <>
                                        <Ionicons
                                            name="logo-whatsapp"
                                            size={22}
                                            color="#FFFFFF"
                                        />
                                        <Text style={styles.primaryText}>
                                            Open WhatsApp
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
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
    headerButton: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
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
        borderWidth: 1,
        borderColor: '#FED7AA',
        backgroundColor: '#FFF1E2',
    },
    eyebrow: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1.3,
        color: '#C2410C',
    },
    heroTitle: {
        marginTop: 12,
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
    universityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        padding: 12,
        marginTop: 16,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
    },
    universityText: {
        flex: 1,
        fontSize: 12,
        fontWeight: '600',
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
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#FED7AA',
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
    filters: {
        gap: 8,
        paddingVertical: 14,
    },
    filterButton: {
        minHeight: 44,
        paddingHorizontal: 18,
        paddingVertical: 12,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: '#FED7AA',
        backgroundColor: '#FFFFFF',
    },
    activeFilter: {
        backgroundColor: '#EA580C',
        borderColor: '#EA580C',
    },
    filterText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#9A3412',
    },
    activeFilterText: {
        color: '#FFFFFF',
    },
    sectionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 4,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#1F2937',
    },
    resultCount: {
        fontSize: 12,
        color: '#6B7280',
    },
    hoursNote: {
        marginTop: 8,
        marginBottom: 18,
        fontSize: 12,
        lineHeight: 18,
        color: '#6B7280',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 42,
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
        textAlign: 'center',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
        backgroundColor: 'rgba(17, 24, 39, 0.55)',
    },
    modalCard: {
        width: '100%',
        maxWidth: 500,
        maxHeight: '90%',
        alignSelf: 'center',
        padding: 22,
        borderRadius: 24,
        backgroundColor: '#FFFFFF',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
    },
    modalSubtitle: {
        marginTop: 4,
        fontSize: 13,
        color: '#EA580C',
    },
    modalDescription: {
        marginTop: 16,
        fontSize: 14,
        lineHeight: 22,
        color: '#6B7280',
    },
    medicineInput: {
        minHeight: 160,
        marginTop: 16,
        padding: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#FED7AA',
        backgroundColor: '#FFFAF5',
        fontSize: 14,
        lineHeight: 22,
        color: '#1F2937',
    },
    counter: {
        marginTop: 7,
        fontSize: 11,
        textAlign: 'right',
        color: '#9CA3AF',
    },
    whatsappNote: {
        marginTop: 16,
        marginBottom: 18,
        fontSize: 12,
        lineHeight: 19,
        color: '#6B7280',
    },
    whatsappButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        minHeight: 52,
        padding: 14,
        borderRadius: 14,
        backgroundColor: '#16A34A',
    },
    disabledButton: {
        backgroundColor: '#9CA3AF',
    },
});