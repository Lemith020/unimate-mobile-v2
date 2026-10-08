import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SupportSection() {
    const items = [
        { icon: 'help-circle-outline', label: 'Help & FAQ' },
        { icon: 'chatbubble-ellipses-outline', label: 'Send feedback' },
        { icon: 'flag-outline', label: 'Report a problem' },
        { icon: 'call-outline', label: 'Contact us' },
        { icon: 'information-circle-outline', label: 'About' },
        { icon: 'document-lock-outline', label: 'Terms & Privacy' },
    ];

    return (
        <View style={styles.sectionContainer}>
            {items.map((item, index) => (
                <TouchableOpacity key={index} style={styles.row}>
                    <View style={styles.iconContainer}>
                        <Ionicons name={item.icon} size={20} color="#D97706" />
                    </View>
                    <Text style={styles.label}>{item.label}</Text>
                    <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
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
        backgroundColor: '#FEF3C7',
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