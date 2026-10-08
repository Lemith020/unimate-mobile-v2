import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';

export default function UniversityCard() {
    const [universityName, setUniversityName] = useState('Not added');
    const [facultyName, setFacultyName] = useState('Not added');
    const [yearOfStudy, setYearOfStudy] = useState('');

    useFocusEffect(
        useCallback(() => {
            const loadUniversityData = async () => {
                try {
                    const storedUser = await AsyncStorage.getItem('userData');

                    console.log(
                        'UNIVERSITY CARD USER:',
                        storedUser
                    );

                    if (storedUser) {
                        const parsedUser = JSON.parse(storedUser);
                        const profile = parsedUser?.profile;

                        console.log(
                            'UNIVERSITY NAME:',
                            profile?.university_name
                        );

                        console.log(
                            'FACULTY NAME:',
                            profile?.faculty_name
                        );

                        if (profile?.university_name) {
                            setUniversityName(
                                profile.university_name
                            );
                        }

                        if (profile?.faculty_name) {
                            setFacultyName(
                                profile.faculty_name
                            );
                        }

                        if (profile?.year_of_study) {
                            setYearOfStudy(
                                String(profile.year_of_study)
                            );
                        }
                    }
                } catch (error) {
                    console.error(
                        'Error loading university data:',
                        error
                    );
                }
            };

            loadUniversityData();
        }, [])
    );

    const getYearText = () => {
        if (!yearOfStudy) {
            return 'Not added';
        }

        const year = Number(yearOfStudy);

        if (year === 1) {
            return '1st year';
        }

        if (year === 2) {
            return '2nd year';
        }

        if (year === 3) {
            return '3rd year';
        }

        return `${year}th year`;
    };

    return (
        <View style={styles.cardContainer}>

            <Text style={styles.cardHeader}>
                University
            </Text>

            <View style={styles.row}>
                <Ionicons
                    name="school-outline"
                    size={18}
                    color="#4B5563"
                />

                <Text style={styles.label}>
                    University
                </Text>

                <Text style={styles.value}>
                    {universityName}
                </Text>
            </View>

            <View style={styles.row}>
                <MaterialCommunityIcons
                    name="bank-outline"
                    size={18}
                    color="#4B5563"
                />

                <Text style={styles.label}>
                    Faculty
                </Text>

                <Text style={styles.value}>
                    {facultyName}
                </Text>
            </View>

            <View
                style={[
                    styles.row,
                    { borderBottomWidth: 0 }
                ]}
            >
                <Ionicons
                    name="calendar-outline"
                    size={18}
                    color="#4B5563"
                />

                <Text style={styles.label}>
                    Year of study
                </Text>

                <Text style={styles.value}>
                    {getYearText()}
                </Text>
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
        maxWidth: '55%',
        textAlign: 'right',
    },
});