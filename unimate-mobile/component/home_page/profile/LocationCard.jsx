import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function LocationCard() {
    return (
        <View style={styles.cardContainer}>
            <Text style={styles.cardHeader}>Location</Text>
            
            {/* Current Address */}
            <View style={styles.addressSection}>
                <View style={styles.rowTop}>
                    <Ionicons name="location-outline" size={18} color="#4B5563" />
                    <Text style={styles.label}>Current address</Text>
                </View>
                <Text style={styles.addressText}>
                    No. 25, Temple Road,{'\n'}Maharagama
                </Text>
            </View>

            {/* GPS Location */}
            <View style={styles.gpsRow}>
                <Ionicons name="compass-outline" size={18} color="#4B5563" />
                <Text style={styles.label}>GPS location</Text>
                <View style={styles.savedBadge}>
                    <Text style={styles.savedText}>Saved ✔</Text>
                </View>
            </View>

            {/* View on Map Button */}
            <TouchableOpacity style={styles.mapButton} onPress={() => alert('View on Map Clicked!')}>
                <Text style={styles.mapButtonText}>[ View on map ]</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    cardContainer: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 16,
        marginTop: 12,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    cardHeader: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#9CA3AF',
        marginBottom: 10,
        textTransform: 'uppercase',
    },
    addressSection: {
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    rowTop: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 4,
    },
    label: {
        flex: 1,
        fontSize: 14,
        color: '#374151',
    },
    addressText: {
        fontSize: 13,
        color: '#6B7280',
        marginLeft: 30,
        lineHeight: 18,
    },
    gpsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        gap: 12,
    },
    savedBadge: {
        backgroundColor: '#CCFBF1',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    savedText: {
        fontSize: 12,
        color: '#0F766E',
        fontWeight: '600',
    },
    mapButton: {
        marginTop: 10,
        alignItems: 'center',
        paddingVertical: 6,
    },
    mapButtonText: {
        fontSize: 13,
        color: '#0F766E',
        fontWeight: '600',
    },
});