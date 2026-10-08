import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileNav({ active, onPress }) {
    const color = active ? '#F97316' : '#71717A';
    return (
        <TouchableOpacity style={styles.navItem} onPress={onPress}>
            <Ionicons name={active ? "person" : "person-outline"} size={24} color={color} />
            <Text style={[styles.navText, { color }]}>Profile</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    navItem: { alignItems: 'center', justifyContent: 'center' },
    navText: { fontSize: 12, marginTop: 4, fontWeight: '600' },
});