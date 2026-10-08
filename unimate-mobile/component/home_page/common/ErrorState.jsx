import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ErrorState({ onRetry }) {
    return (
        <View style={styles.container}>
            <Ionicons name="warning-outline" size={36} color="#DC2626" />
            <Text style={styles.text}>Load කරන්න බැරි වුණා</Text>
            <TouchableOpacity style={styles.button} onPress={onRetry}>
                <Text style={styles.buttonText}>Retry</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { padding: 25, justifyContent: 'center', alignItems: 'center', gap: 10 },
    text: { fontSize: 14, color: '#DC2626', fontWeight: '600' },
    button: { backgroundColor: '#DC2626', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 8 },
    buttonText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
});