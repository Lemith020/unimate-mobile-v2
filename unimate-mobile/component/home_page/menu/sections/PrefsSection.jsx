import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function PrefsSection() {
    const [theme, setTheme] = useState('Light');

    return (
        <View style={styles.sectionContainer}>
            {/* Appearance */}
            <View style={styles.row}>
                <View style={styles.iconContainer}>
                    <Ionicons name="sunny-outline" size={20} color="#0284C7" />
                </View>
                <Text style={styles.label}>Appearance</Text>
            </View>

            {/* Segmented Control */}
            <View style={styles.segmentedControl}>
                {['Light', 'Dark', 'Auto'].map((item) => (
                    <TouchableWithoutFeedback key={item} onPress={() => setTheme(item)}>
                        <View style={[styles.segmentBtn, theme === item && styles.activeSegment]}>
                            <Text style={[styles.segmentText, theme === item && styles.activeSegmentText]}>
                                {item === 'Light' ? '☀ Light' : item === 'Dark' ? '🌙 Dark' : '⚙ Auto'}
                            </Text>
                        </View>
                    </TouchableWithoutFeedback>
                ))}
            </View>

            {/* Language */}
            <TouchableOpacity style={styles.row}>
                <View style={styles.iconContainer}>
                    <Ionicons name="globe-outline" size={20} color="#0284C7" />
                </View>
                <Text style={styles.label}>Language</Text>
                <Text style={styles.badge}>English</Text>
            </TouchableOpacity>

            {/* Notification Settings */}
            <TouchableOpacity style={styles.row}>
                <View style={styles.iconContainer}>
                    <Ionicons name="notifications-circle-outline" size={20} color="#0284C7" />
                </View>
                <Text style={styles.label}>Notification settings</Text>
                <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
            </TouchableOpacity>
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
        backgroundColor: '#E0F2FE',
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
    badge: {
        fontSize: 12,
        color: '#6B7280',
        backgroundColor: '#E5E7EB',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
        marginRight: 6,
    },
    segmentedControl: {
        flexDirection: 'row',
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        marginHorizontal: 16,
        marginVertical: 4,
        padding: 2,
    },
    segmentBtn: {
        flex: 1,
        paddingVertical: 6,
        alignItems: 'center',
        borderRadius: 6,
    },
    activeSegment: {
        backgroundColor: '#0F766E',
    },
    segmentText: {
        fontSize: 12,
        color: '#4B5563',
        fontWeight: '500',
    },
    activeSegmentText: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
});