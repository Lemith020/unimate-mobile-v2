import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function EmergencyStrip({ onCall }) {
    return (
        <View style={styles.container}>
            <View style={styles.leftContent}>
                <Ionicons name="alert-circle" size={24} color="#DC2626" />
                <Text style={styles.text}>Emergency</Text>
            </View>
            <TouchableOpacity style={styles.button} onPress={onCall}>
                <Text style={styles.buttonText}>Call 1990</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        height: 56,
        backgroundColor: '#FEE2E2',
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        marginVertical: 10,
        marginHorizontal: 20,
    },
    leftContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    text: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#991B1B',
    },
    button: {
        backgroundColor: '#DC2626',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 10,
    },
    buttonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 14,
    },
});