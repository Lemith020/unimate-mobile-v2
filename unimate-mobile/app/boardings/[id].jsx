import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    Image,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

const BOARDING_PHOTO_1 = require(
    '../../assets/bodim-images/bordim1.png'
);

const BOARDING_PHOTO_2 = require(
    '../../assets/bodim-images/bordim2.png'
);

export default function BoardingDetailsScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams();

    const boardingId = Array.isArray(id) ? id[0] : id;

    const [boarding, setBoarding] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        const controller = new AbortController();

        const loadBoardingDetails = async () => {
            setLoading(true);
            setBoarding(null);

            try {
                const response = await fetch(
                    `http://10.0.2.2:5000/api/boardings/${encodeURIComponent(boardingId)}`,
                    { signal: controller.signal }
                );

                const responseText = await response.text();

                if (!active) return;

                let data;

                try {
                    data = JSON.parse(responseText);
                } catch {
                    Alert.alert(
                        'Server Error',
                        'Invalid response from server'
                    );
                    return;
                }

                if (!response.ok) {
                    Alert.alert(
                        'Error',
                        data.error || 'Failed to load boarding details'
                    );
                    return;
                }

                setBoarding(data.boarding || null);
            } catch (error) {
                if (!active || controller.signal.aborted) return;

                console.error('Boarding detail load error:', error);

                Alert.alert(
                    'Connection Error',
                    'Could not connect to server'
                );
            } finally {
                if (active) setLoading(false);
            }
        };

        if (boardingId) {
            loadBoardingDetails();
        } else {
            setBoarding(null);
            setLoading(false);
        }

        return () => {
            active = false;
            controller.abort();
        };
    }, [boardingId]);

    const goBack = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/boardings');
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator
                    size="large"
                    color="#F97316"
                />

                <Text style={styles.loadingText}>
                    Loading boarding...
                </Text>
            </View>
        );
    }

    if (!boarding) {
        return (
            <View style={styles.errorContainer}>
                <Ionicons
                    name="alert-circle-outline"
                    size={55}
                    color="#9CA3AF"
                />

                <Text style={styles.errorTitle}>
                    Boarding not found
                </Text>

                <TouchableOpacity
                    style={styles.backHomeButton}
                    onPress={goBack}
                    accessibilityRole="button"
                >
                    <Text style={styles.backHomeButtonText}>
                        Go Back
                    </Text>
                </TouchableOpacity>
            </View>
        );
    }

    const imageSource =
        boarding.id === '9df8696f-920f-4d25-a512-f7faff534d0b'
            ? BOARDING_PHOTO_2
            : BOARDING_PHOTO_1;

    const distance =
        boarding.distance_km !== null &&
        boarding.distance_km !== undefined
            ? Number(boarding.distance_km).toFixed(1)
            : null;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={goBack}
                    accessibilityRole="button"
                    accessibilityLabel="Go back"
                >
                    <Ionicons
                        name="arrow-back"
                        size={24}
                        color="#111827"
                    />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>
                    Boarding Details
                </Text>

                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <Image
                    source={imageSource}
                    style={styles.mainImage}
                    resizeMode="cover"
                    accessibilityLabel={
                        boarding.title || 'Boarding photo'
                    }
                />

                <View style={styles.content}>
                    <Text style={styles.title}>
                        {boarding.title || 'Boarding'}
                    </Text>

                    <View style={styles.locationRow}>
                        <Ionicons
                            name="location-outline"
                            size={18}
                            color="#F97316"
                        />

                        <Text style={styles.locationText}>
                            {boarding.address ||
                                boarding.city ||
                                boarding.district ||
                                'Location unavailable'}
                        </Text>
                    </View>

                    {distance !== null && (
                        <View style={styles.distanceBox}>
                            <Ionicons
                                name="navigate-outline"
                                size={18}
                                color="#2563EB"
                            />

                            <Text style={styles.distanceText}>
                                {distance} km from university
                            </Text>
                        </View>
                    )}

                    <View style={styles.rentBox}>
                        <Text style={styles.rentLabel}>
                            Monthly Rent
                        </Text>

                        <Text style={styles.rentText}>
                            Rs.{' '}
                            {Number(
                                boarding.monthly_rent || 0
                            ).toLocaleString()}
                        </Text>
                    </View>

                    <Text style={styles.sectionTitle}>
                        Boarding Information
                    </Text>

                    <InfoRow
                        icon="bed-outline"
                        label="Available Rooms"
                        value={boarding.available_rooms ?? 0}
                    />

                    <InfoRow
                        icon="home-outline"
                        label="Total Rooms"
                        value={boarding.total_rooms ?? 0}
                    />

                    <InfoRow
                        icon="people-outline"
                        label="Gender Type"
                        value={
                            boarding.gender_type || 'Not specified'
                        }
                    />

                    <InfoRow
                        icon="business-outline"
                        label="Room Type"
                        value={
                            boarding.room_type || 'Not specified'
                        }
                    />

                    <InfoRow
                        icon="cash-outline"
                        label="Deposit"
                        value={
                            boarding.deposit !== null &&
                            boarding.deposit !== undefined
                                ? `Rs. ${Number(
                                      boarding.deposit
                                  ).toLocaleString()}`
                                : 'Not specified'
                        }
                    />

                    <InfoRow
                        icon="call-outline"
                        label="Contact"
                        value={
                            boarding.contact_phone || 'Not available'
                        }
                    />

                    <InfoRow
                        icon="school-outline"
                        label="University"
                        value={
                            boarding.university_name || 'Not available'
                        }
                    />

                    <Text style={styles.sectionTitle}>
                        Description
                    </Text>

                    <Text style={styles.description}>
                        {boarding.description ||
                            'No description available.'}
                    </Text>

                    {boarding.latitude !== null &&
                        boarding.latitude !== undefined &&
                        boarding.longitude !== null &&
                        boarding.longitude !== undefined && (
                            <View style={styles.coordinatesBox}>
                                <Text style={styles.coordinateText}>
                                    Latitude: {boarding.latitude}
                                </Text>

                                <Text style={styles.coordinateText}>
                                    Longitude: {boarding.longitude}
                                </Text>
                            </View>
                        )}
                </View>
            </ScrollView>
        </View>
    );
}

function InfoRow({ icon, label, value }) {
    return (
        <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
                <Ionicons
                    name={icon}
                    size={19}
                    color="#F97316"
                />

                <Text style={styles.infoLabel}>
                    {label}
                </Text>
            </View>

            <Text style={styles.infoValue}>
                {String(value)}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
    },
    loadingText: {
        marginTop: 10,
        color: '#6B7280',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30,
        backgroundColor: '#F8FAFC',
    },
    errorTitle: {
        marginTop: 12,
        fontSize: 18,
        fontWeight: 'bold',
        color: '#374151',
    },
    backHomeButton: {
        marginTop: 18,
        backgroundColor: '#F97316',
        paddingHorizontal: 20,
        paddingVertical: 11,
        borderRadius: 10,
    },
    backHomeButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingTop: 45,
        paddingBottom: 15,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
        fontSize: 19,
        fontWeight: 'bold',
        color: '#111827',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    mainImage: {
        width: '100%',
        height: 260,
        backgroundColor: '#E5E7EB',
    },
    content: {
        padding: 18,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginTop: 10,
    },
    locationText: {
        flex: 1,
        marginLeft: 6,
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 20,
    },
    distanceBox: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
    },
    distanceText: {
        marginLeft: 6,
        color: '#2563EB',
        fontWeight: '500',
        fontSize: 13,
    },
    rentBox: {
        marginTop: 20,
        padding: 15,
        backgroundColor: '#FFF7ED',
        borderRadius: 12,
    },
    rentLabel: {
        fontSize: 12,
        color: '#6B7280',
    },
    rentText: {
        marginTop: 3,
        color: '#F97316',
        fontSize: 22,
        fontWeight: 'bold',
    },
    sectionTitle: {
        marginTop: 24,
        marginBottom: 12,
        fontSize: 17,
        fontWeight: 'bold',
        color: '#111827',
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 14,
        marginBottom: 9,
        borderRadius: 11,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    infoLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flexShrink: 1,
        marginRight: 8,
    },
    infoLabel: {
        marginLeft: 8,
        color: '#4B5563',
        fontSize: 14,
        flexShrink: 1,
    },
    infoValue: {
        color: '#111827',
        fontSize: 14,
        fontWeight: '600',
        maxWidth: '45%',
        textAlign: 'right',
    },
    description: {
        fontSize: 14,
        lineHeight: 22,
        color: '#4B5563',
    },
    coordinatesBox: {
        marginTop: 20,
        padding: 12,
        backgroundColor: '#EFF6FF',
        borderRadius: 10,
    },
    coordinateText: {
        fontSize: 12,
        color: '#1E40AF',
        marginBottom: 3,
    },
});