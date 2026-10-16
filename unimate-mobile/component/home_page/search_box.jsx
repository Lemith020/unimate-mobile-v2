import React, { useState } from 'react';
import {
    View,
    TextInput,
    TouchableOpacity,
    Keyboard,
    StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function SearchBox() {
    const router = useRouter();
    const [query, setQuery] = useState('');

    const canSearch = query.trim().length > 0;

    const handleSearch = () => {
        const searchText = query.trim();

        if (!searchText) return;

        Keyboard.dismiss();

        router.push({
            pathname: '/search',
            params: { q: searchText },
        });
    };

    return (
        <View style={styles.container}>
            <View style={styles.searchContainer}>
                <Ionicons
                    name="search-outline"
                    size={21}
                    color="#EA580C"
                    style={styles.icon}
                />

                <TextInput
                    value={query}
                    onChangeText={setQuery}
                    placeholder="Search boardings, shops, items..."
                    placeholderTextColor="#9A8170"
                    style={styles.input}
                    returnKeyType="search"
                    onSubmitEditing={handleSearch}
                    autoCapitalize="none"
                    autoCorrect={false}
                    maxLength={100}
                    accessibilityLabel="Search Unimate"
                />

                {query.length > 0 && (
                    <TouchableOpacity
                        onPress={() => setQuery('')}
                        style={styles.clearButton}
                        accessibilityRole="button"
                        accessibilityLabel="Clear search"
                        hitSlop={8}
                    >
                        <Ionicons
                            name="close-circle"
                            size={20}
                            color="#A8A29E"
                        />
                    </TouchableOpacity>
                )}

                <TouchableOpacity
                    onPress={handleSearch}
                    disabled={!canSearch}
                    activeOpacity={0.8}
                    style={[
                        styles.searchButton,
                        !canSearch && styles.disabledButton,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Show search results"
                    accessibilityState={{ disabled: !canSearch }}
                >
                    <Ionicons
                        name="arrow-forward"
                        size={20}
                        color="#FFFFFF"
                    />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 56,
        paddingLeft: 14,
        paddingRight: 6,
        borderWidth: 1,
        borderColor: '#FED7AA',
        borderRadius: 18,
        backgroundColor: '#FFFFFF',
    },
    icon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        minWidth: 0,
        paddingVertical: 14,
        fontSize: 14,
        color: '#292524',
    },
    clearButton: {
        padding: 7,
        marginRight: 2,
    },
    searchButton: {
        width: 42,
        height: 42,
        borderRadius: 13,
        backgroundColor: '#EA580C',
        alignItems: 'center',
        justifyContent: 'center',
    },
    disabledButton: {
        backgroundColor: '#FDBA74',
    },
});