import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ActivitySection({ onNavigate }) {
    const items = [
        
        { icon: 'home-outline', label: 'Home', showChevron: false },
        { icon: 'notifications-outline', label: 'Notifications' },
        { icon: 'heart-outline', label: 'Saved' },
        { icon: 'document-text-outline', label: 'My Applications' },
        { icon: 'receipt-outline', label: 'My Orders' },
    ];

    return (
        <View style={styles.sectionContainer}>
            {items.map((item, index) => (
                <TouchableOpacity key={index} style={styles.row} onPress={() => onNavigate && onNavigate(item.label)}>
                    <View style={styles.iconContainer}>
                        <Ionicons name={item.icon} size={20} color="#0F766E" />
                    </View>
                    <Text style={styles.label}>{item.label}</Text>
                    {item.showChevron !== false && (
                        <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                    )}
                </TouchableOpacity>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    sectionContainer: {
        marginTop: 6,
        paddingHorizontal: 4,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        minHeight: 48,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: '#CCFBF1',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    label: {
        flex: 1,
        fontSize: 14,
        color: '#111827',
        fontWeight: '500',
    },
});
