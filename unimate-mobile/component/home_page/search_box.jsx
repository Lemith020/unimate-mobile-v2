import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SearchBox() {
    return (
        <View style={styles.container}>
            <View style={styles.searchContainer}>
                <Ionicons name="search-outline" size={20} color="#C25E00" style={styles.icon} />
                <TextInput
                    placeholder="Search boardings, food..."
                    placeholderTextColor="#A07855"
                    style={styles.input}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: 'transparent',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#D97706', 
        borderRadius: 12,
        paddingHorizontal: 15,
        height: 50,
        backgroundColor: '#FFFBEB',
    },
    icon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#4B382A',
    },
});