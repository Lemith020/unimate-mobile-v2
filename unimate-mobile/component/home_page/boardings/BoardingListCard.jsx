import React from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const BOARDING_PHOTO_1 = require(
    '../../../assets/bodim-images/bordim1.png'
);

const BOARDING_PHOTO_2 = require(
    '../../../assets/bodim-images/bordim2.png'
);

export default function BoardingListCard({
    boarding,
    onPress,
}) {
    const imageSource =
        boarding?.id === '9df8696f-920f-4d25-a512-f7faff534d0b'
            ? BOARDING_PHOTO_2
            : BOARDING_PHOTO_1;

    const distance =
        boarding?.distance_km !== null &&
        boarding?.distance_km !== undefined
            ? Number(boarding.distance_km).toFixed(1)
            : null;

    const monthlyRent = Number(
        boarding?.monthly_rent || 0
    ).toLocaleString();

    return (
        <TouchableOpacity
            style={styles.card}
            onPress={onPress}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={`View ${boarding?.title || 'boarding'}`}
        >
            <Image
                source={imageSource}
                style={styles.image}
                resizeMode="cover"
                accessibilityLabel={boarding?.title || 'Boarding photo'}
            />

            <View style={styles.content}>
                <Text
                    style={styles.title}
                    numberOfLines={1}
                >
                    {boarding?.title || 'Boarding'}
                </Text>

                <View style={styles.locationRow}>
                    <Ionicons
                        name="location-outline"
                        size={16}
                        color="#F97316"
                    />

                    <Text
                        style={styles.locationText}
                        numberOfLines={1}
                    >
                        {boarding?.address ||
                            boarding?.city ||
                            boarding?.district ||
                            'Location unavailable'}
                    </Text>
                </View>

                {distance !== null && (
                    <View style={styles.distanceRow}>
                        <Ionicons
                            name="navigate-outline"
                            size={15}
                            color="#2563EB"
                        />

                        <Text style={styles.distanceText}>
                            {distance} km from university
                        </Text>
                    </View>
                )}

                <View style={styles.infoRow}>
                    <View style={styles.infoItem}>
                        <Ionicons
                            name="bed-outline"
                            size={17}
                            color="#6B7280"
                        />

                        <Text style={styles.infoText}>
                            {boarding?.available_rooms ?? 0} rooms
                        </Text>
                    </View>

                    <View style={styles.infoItem}>
                        <Ionicons
                            name="people-outline"
                            size={17}
                            color="#6B7280"
                        />

                        <Text style={styles.infoText}>
                            {boarding?.gender_type || 'Any'}
                        </Text>
                    </View>
                </View>

                <View style={styles.bottomRow}>
                    <View>
                        <Text style={styles.rentLabel}>
                            Monthly Rent
                        </Text>

                        <Text style={styles.rentText}>
                            Rs. {monthlyRent}
                        </Text>
                    </View>

                    <View style={styles.viewButton}>
                        <Text style={styles.viewButtonText}>
                            View
                        </Text>

                        <Ionicons
                            name="chevron-forward"
                            size={16}
                            color="#FFFFFF"
                        />
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        marginBottom: 18,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    image: {
        width: '100%',
        height: 190,
        backgroundColor: '#E5E7EB',
    },
    content: {
        padding: 15,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 8,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    locationText: {
        flex: 1,
        marginLeft: 5,
        fontSize: 13,
        color: '#6B7280',
    },
    distanceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 7,
    },
    distanceText: {
        marginLeft: 5,
        fontSize: 12,
        color: '#2563EB',
        fontWeight: '500',
    },
    infoRow: {
        flexDirection: 'row',
        marginTop: 14,
        gap: 20,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoText: {
        marginLeft: 5,
        color: '#4B5563',
        fontSize: 13,
    },
    bottomRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 18,
    },
    rentLabel: {
        fontSize: 11,
        color: '#9CA3AF',
    },
    rentText: {
        color: '#F97316',
        fontSize: 17,
        fontWeight: 'bold',
        marginTop: 2,
    },
    viewButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F97316',
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderRadius: 9,
    },
    viewButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        marginRight: 2,
    },
});