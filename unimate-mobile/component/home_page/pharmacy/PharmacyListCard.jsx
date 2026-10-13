import React, { useEffect, useState } from 'react';
import {
    Alert,
    Image,
    Linking,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { getPharmacyImage } from '../../../constants/pharmacyImages';

function cleanPhoneNumber(value) {
    if (typeof value !== 'string') return '';

    const cleaned = value.trim().replace(/[\s()-]/g, '');

    return /^\+?\d{9,15}$/.test(cleaned) ? cleaned : '';
}

function formatDistance(value) {
    if (
        value === null ||
        value === undefined ||
        value === ''
    ) {
        return null;
    }

    const distance = Number(value);

    if (!Number.isFinite(distance) || distance < 0) {
        return null;
    }

    return distance < 1
        ? `${Math.round(distance * 1000)} m`
        : `${distance.toFixed(1)} km`;
}

export default function PharmacyListCard({
    pharmacy,
    onWhatsAppPress,
}) {
    const [imageFailed, setImageFailed] = useState(false);

    useEffect(() => {
        setImageFailed(false);
    }, [
        pharmacy?.id,
        pharmacy?.name,
        pharmacy?.cover_image_url,
    ]);

    if (!pharmacy) return null;

    const imageSource = getPharmacyImage(pharmacy);
    const phone = cleanPhoneNumber(pharmacy.phone);

    // A separate WhatsApp number can be supplied later.
    const whatsappPhone = cleanPhoneNumber(
        pharmacy.whatsapp_number || pharmacy.phone
    );

    const distance = formatDistance(pharmacy.distance_km);
    const is24Hours = pharmacy.is_open_24h === true;

    const status = is24Hours
        ? 'open'
        : pharmacy.opening_status || 'unknown';

    const isOpen = status === 'open';
    const isClosed = status === 'closed';

    const statusLabel = isOpen
        ? 'Open now'
        : isClosed
          ? 'Closed'
          : 'Hours unavailable';

    const openingText = is24Hours
        ? 'Open 24 hours'
        : pharmacy.opening_text ||
          'Opening hours unavailable';

    const canWhatsApp =
        !!whatsappPhone &&
        typeof onWhatsAppPress === 'function';

    const callPharmacy = async () => {
        if (!phone) return;

        try {
            await Linking.openURL(`tel:${phone}`);
        } catch {
            Alert.alert(
                'Unable to open dialer',
                'Please try calling this pharmacy manually.'
            );
        }
    };

    return (
        <View style={styles.card}>
            <View style={styles.imageContainer}>
                {imageSource && !imageFailed ? (
                    <Image
                        source={imageSource}
                        style={styles.image}
                        resizeMode="cover"
                        accessibilityLabel={pharmacy.name}
                        onError={() => setImageFailed(true)}
                    />
                ) : (
                    <View style={styles.imagePlaceholder}>
                        <Ionicons
                            name="medical-outline"
                            size={44}
                            color="#EA580C"
                        />
                        <Text style={styles.placeholderText}>
                            Care near your campus
                        </Text>
                    </View>
                )}

                <View style={styles.categoryBadge}>
                    <Ionicons
                        name="medical-outline"
                        size={14}
                        color="#9A3412"
                    />
                    <Text style={styles.categoryText}>
                        {pharmacy.category_name || 'Pharmacy'}
                    </Text>
                </View>

                {is24Hours && (
                    <View style={styles.hoursBadge}>
                        <Ionicons
                            name="time-outline"
                            size={14}
                            color="#FFFFFF"
                        />
                        <Text style={styles.hoursBadgeText}>
                            24 hours
                        </Text>
                    </View>
                )}

                {distance && (
                    <View style={styles.distanceBadge}>
                        <Ionicons
                            name="location-outline"
                            size={14}
                            color="#FFFFFF"
                        />
                        <Text style={styles.distanceText}>
                            {distance} from campus
                        </Text>
                    </View>
                )}
            </View>

            <View style={styles.content}>
                <Text style={styles.name}>
                    {pharmacy.name}
                </Text>

                {!!(pharmacy.address || pharmacy.city) && (
                    <View style={styles.addressRow}>
                        <Ionicons
                            name="location-outline"
                            size={16}
                            color="#9CA3AF"
                        />
                        <Text style={styles.address}>
                            {pharmacy.address || pharmacy.city}
                        </Text>
                    </View>
                )}

                <View style={styles.openingRow}>
                    <View
                        style={[
                            styles.statusBadge,
                            isOpen && styles.openBadge,
                            isClosed && styles.closedBadge,
                        ]}
                    >
                        <View
                            style={[
                                styles.statusDot,
                                isOpen && styles.openDot,
                                isClosed && styles.closedDot,
                            ]}
                        />
                        <Text
                            style={[
                                styles.statusText,
                                isOpen && styles.openText,
                                isClosed && styles.closedText,
                            ]}
                        >
                            {statusLabel}
                        </Text>
                    </View>

                    {status !== 'unknown' && (
                        <Text style={styles.openingText}>
                            {openingText}
                        </Text>
                    )}
                </View>

                <View style={styles.divider} />

                <View style={styles.actions}>
                    <TouchableOpacity
                        style={[
                            styles.callButton,
                            !phone && styles.disabledButton,
                        ]}
                        onPress={callPharmacy}
                        disabled={!phone}
                        activeOpacity={0.75}
                        accessibilityRole="button"
                        accessibilityLabel={`Call ${pharmacy.name}`}
                        accessibilityState={{
                            disabled: !phone,
                        }}
                    >
                        <Ionicons
                            name="call-outline"
                            size={18}
                            color={phone ? '#EA580C' : '#9CA3AF'}
                        />
                        <Text
                            style={[
                                styles.callText,
                                !phone && styles.disabledText,
                            ]}
                        >
                            Call
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.whatsappButton,
                            !canWhatsApp &&
                                styles.disabledButton,
                        ]}
                        onPress={() =>
                            onWhatsAppPress?.(pharmacy)
                        }
                        disabled={!canWhatsApp}
                        activeOpacity={0.75}
                        accessibilityRole="button"
                        accessibilityLabel={`Send medicine list to ${pharmacy.name} on WhatsApp`}
                        accessibilityState={{
                            disabled: !canWhatsApp,
                        }}
                    >
                        <Ionicons
                            name="logo-whatsapp"
                            size={20}
                            color={
                                canWhatsApp
                                    ? '#FFFFFF'
                                    : '#9CA3AF'
                            }
                        />
                        <Text
                            style={[
                                styles.whatsappText,
                                !canWhatsApp &&
                                    styles.disabledText,
                            ]}
                        >
                            Medicine list
                        </Text>
                    </TouchableOpacity>
                </View>

                {!phone && !whatsappPhone && (
                    <Text style={styles.contactNote}>
                        Contact number unavailable
                    </Text>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        marginBottom: 20,
        borderRadius: 22,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#F0E7DE',
        shadowColor: '#9A3412',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 2,
    },
    imageContainer: {
        height: 185,
        borderTopLeftRadius: 21,
        borderTopRightRadius: 21,
        overflow: 'hidden',
        backgroundColor: '#FFF7ED',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    imagePlaceholder: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    placeholderText: {
        marginTop: 10,
        fontSize: 13,
        fontWeight: '500',
        color: '#9A3412',
    },
    categoryBadge: {
        position: 'absolute',
        top: 12,
        left: 12,
        maxWidth: '60%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 10,
        paddingVertical: 7,
        borderRadius: 11,
        backgroundColor: '#FFFFFF',
    },
    categoryText: {
        flexShrink: 1,
        fontSize: 12,
        fontWeight: '700',
        color: '#9A3412',
    },
    hoursBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 9,
        paddingVertical: 7,
        borderRadius: 11,
        backgroundColor: '#EA580C',
    },
    hoursBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    distanceBadge: {
        position: 'absolute',
        bottom: 12,
        left: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 11,
        paddingVertical: 7,
        borderRadius: 10,
        backgroundColor: 'rgba(17, 24, 39, 0.8)',
    },
    distanceText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    content: {
        padding: 18,
    },
    name: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 5,
        marginTop: 9,
    },
    address: {
        flex: 1,
        fontSize: 13,
        lineHeight: 20,
        color: '#6B7280',
    },
    openingRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 9,
        marginTop: 14,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 7,
        borderRadius: 10,
        backgroundColor: '#F3F4F6',
    },
    openBadge: {
        backgroundColor: '#ECFDF5',
    },
    closedBadge: {
        backgroundColor: '#FEF2F2',
    },
    statusDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: '#9CA3AF',
    },
    openDot: {
        backgroundColor: '#16A34A',
    },
    closedDot: {
        backgroundColor: '#EF4444',
    },
    statusText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#6B7280',
    },
    openText: {
        color: '#15803D',
    },
    closedText: {
        color: '#B91C1C',
    },
    openingText: {
        fontSize: 12,
        color: '#6B7280',
    },
    divider: {
        height: 1,
        marginVertical: 16,
        backgroundColor: '#F3F4F6',
    },
    actions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    callButton: {
        flexGrow: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
        minHeight: 48,
        paddingHorizontal: 18,
        paddingVertical: 12,
        borderRadius: 14,
        backgroundColor: '#FFF7ED',
    },
    callText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#EA580C',
    },
    whatsappButton: {
        flexGrow: 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
        minHeight: 48,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 14,
        backgroundColor: '#16A34A',
    },
    whatsappText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    disabledButton: {
        backgroundColor: '#F3F4F6',
    },
    disabledText: {
        color: '#9CA3AF',
    },
    contactNote: {
        marginTop: 10,
        fontSize: 12,
        textAlign: 'center',
        color: '#9CA3AF',
    },
});