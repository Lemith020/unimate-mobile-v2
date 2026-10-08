import React, { useState, useCallback } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';

export default function ProfileHeader() {
    const [fullName, setFullName] = useState('Student');

    useFocusEffect(
        useCallback(() => {
            const loadUserData = async () => {
                try {
                    const storedUser = await AsyncStorage.getItem('userData');

                    console.log('PROFILE HEADER USER:', storedUser);

                    if (storedUser) {
                        const parsedUser = JSON.parse(storedUser);

                        console.log(
                            'PROFILE HEADER NAME:',
                            parsedUser?.profile?.full_name
                        );

                        if (parsedUser?.profile?.full_name) {
                            setFullName(parsedUser.profile.full_name);
                        } else {
                            setFullName('Student');
                        }
                    }
                } catch (error) {
                    console.error(
                        'Error loading profile header data:',
                        error
                    );
                }
            };

            loadUserData();
        }, [])
    );

    return (
        <View style={styles.headerContainer}>

            <View style={styles.avatarContainer}>
                <Image
                    source={{
                        uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500',
                    }}
                    style={styles.avatar}
                />
            </View>

            <Text style={styles.name}>
                {fullName}
            </Text>

        </View>
    );
}

const styles = StyleSheet.create({

    headerContainer: {
        alignItems: 'center',
        paddingVertical: 20,
        backgroundColor: '#F9FAFB',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },

    avatarContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#E5E7EB',
        marginBottom: 10,
        overflow: 'hidden',
    },

    avatar: {
        width: '100%',
        height: '100%',
    },

    name: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 4,
    },

});