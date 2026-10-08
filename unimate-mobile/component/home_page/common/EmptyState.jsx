import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function EmptyState() {
    return (
        <View style={styles.container}>
            <Ionicons name="file-tray-outline" size={40} color="#9CA3AF" />
            <Text style={styles.text}>මෙතන දැනට කිසිවක් නෑ</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { padding: 30, justifyContent: 'center', alignItems: 'center', gap: 8 },
    text: { fontSize: 14, color: '#6B7280', fontWeight: '600' },
});