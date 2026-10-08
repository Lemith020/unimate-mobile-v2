import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ContactCard() {
    return (
        <View style={styles.cardContainer}>
            <Text style={styles.cardHeader}>Contact</Text>
            
            <View style={styles.row}>
                <Ionicons name="person-outline" size={18} color="#4B5563" />
                <Text style={styles.label}>Full name</Text>
                <Text style={styles.value}>Lemith</Text>
            </View>

            <View style={styles.row}>
                <Ionicons name="call-outline" size={18} color="#4B5563" />
                <Text style={styles.label}>Phone</Text>
                <Text style={styles.value}>07X XXX XXXX</Text>
            </View>

            <View style={[styles.row, { borderBottomWidth: 0 }]}>
                <Ionicons name="mail-outline" size={18} color="#4B5563" />
                <Text style={styles.label}>Email</Text>
                <Text style={styles.value}>name@uni.lk</Text>
            </View>
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
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        gap: 12,
    },
    label: {
        flex: 1,
        fontSize: 14,
        color: '#374151',
    },
    value: {
        fontSize: 14,
        color: '#111827',
        fontWeight: '500',
    },
});