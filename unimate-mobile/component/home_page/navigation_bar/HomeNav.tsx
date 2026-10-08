import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface HomeNavProps {
    active?: boolean;
    onPress?: () => void;
}

export default function HomeNav({ active, onPress }: HomeNavProps) {
    const color = active ? '#F97316' : '#71717A';
    return (
        <TouchableOpacity style={styles.navItem} onPress={onPress}>
            <Ionicons name={active ? "home" : "home-outline"} size={24} color={color} />
            <Text style={[styles.navText, { color }]}>Home</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    navItem: { 
        alignItems: 'center', 
        justifyContent: 'center' 
    },
    navText: { 
        fontSize: 12, 
        marginTop: 4, 
        fontWeight: '600' 
    },
});