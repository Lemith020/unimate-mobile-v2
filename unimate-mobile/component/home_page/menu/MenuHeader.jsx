import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function MenuHeader({ fullName, universityName, onPressProfile }) {
    return (
        <TouchableOpacity style={styles.headerContainer} onPress={onPressProfile} activeOpacity={0.8}>
            <View style={styles.avatarContainer}>
                <Image 
                    source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500' }} 
                    style={styles.avatar} 
                />
            </View>
            <View style={styles.userInfo}>
                <Text style={styles.name}>{fullName || 'Student'}</Text>
                {/* <Text style={styles.university}>{universityName || 'University of Kelaniya'}</Text> */}
                <View style={styles.badgePill}>
                    {/*<Ionicons name="checkmark-circle" size={12} color="#0F766E" />*/}
                    {/*<Text style={styles.badgeText}>Verified student</Text>*/}
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    headerContainer: {
        padding: 20,
        backgroundColor: '#E6F4F1',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    avatarContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#FFF',
        marginBottom: 10,
        overflow: 'hidden',
        elevation: 2,
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    userInfo: {
        alignItems: 'flex-start',
    },
    name: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 2,
    },
    university: {
        fontSize: 13,
        color: '#6B7280',
        marginBottom: 8,
    },
    badgePill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#CCFBF1',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    badgeText: {
        fontSize: 11,
        color: '#0F766E',
        fontWeight: '600',
    },
});