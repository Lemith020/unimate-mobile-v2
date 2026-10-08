import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function MenuFooter({ onPressLogout }) {
    return (
        <View style={styles.footerContainer}>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.logoutRow} onPress={onPressLogout} activeOpacity={0.7}>
                <View style={styles.iconContainer}>
                    <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                </View>
                <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
            <Text style={styles.versionText}>App version 1.0.0</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    footerContainer: {
        paddingHorizontal: 8,
        paddingBottom: 20,
        paddingTop: 10,
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginBottom: 6,
        marginHorizontal: 16,
    },
    logoutRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 8,
        minHeight: 48,
        backgroundColor: '#FEF2F2',
        borderRadius: 8,
        marginHorizontal: 8,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: '#FEE2E2',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    logoutText: {
        fontSize: 14,
        color: '#EF4444',
        fontWeight: '600',
    },
    versionText: {
        fontSize: 11,
        color: '#9CA3AF',
        textAlign: 'center',
        marginTop: 14,
    },
});