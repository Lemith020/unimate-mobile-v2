import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AccountCard() {
    return (
        <View style={styles.cardContainer}>
            {/* Change Password */}
            <TouchableOpacity style={styles.row} onPress={() => alert('Change Password Clicked!')}>
                <Ionicons name="lock-closed-outline" size={18} color="#4B5563" />
                <Text style={styles.label}>Change password</Text>
                <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
            </TouchableOpacity>

            {/* Logout */}
            <TouchableOpacity style={[styles.row, { borderBottomWidth: 0 }]} onPress={() => alert('Logout Clicked!')}>
                <Ionicons name="log-out-outline" size={18} color="#EF4444" />
                <Text style={[styles.label, { color: '#EF4444', fontWeight: '600' }]}>Logout</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    cardContainer: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 16,
        marginTop: 12,
        marginBottom: 30,
        borderRadius: 12,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        gap: 12,
    },
    label: {
        flex: 1,
        fontSize: 14,
        color: '#374151',
    },
});