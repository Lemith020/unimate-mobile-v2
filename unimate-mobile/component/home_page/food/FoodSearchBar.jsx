import React from 'react';
import {
    View,
    TextInput,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function FoodSearchBar({
    value = '',
    onChangeText,
    placeholder = 'Search foods in this shop...',
}) {
    const hasText = value.length > 0;

    return (
        <View style={styles.container}>
            <View style={styles.iconContainer}>
                <Ionicons
                    name="search-outline"
                    size={21}
                    color="#EA580C"
                />
            </View>

            <TextInput
                style={styles.input}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor="#9CA3AF"
                accessibilityLabel="Search food"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
            />

            {hasText && (
                <TouchableOpacity
                    style={styles.clearButton}
                    onPress={() => onChangeText?.('')}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel="Clear food search"
                    hitSlop={8}
                >
                    <Ionicons
                        name="close-circle"
                        size={21}
                        color="#9CA3AF"
                    />
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 56,
        paddingHorizontal: 12,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#FED7AA',
        borderRadius: 18,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: '#FFF7ED',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    input: {
        flex: 1,
        minWidth: 0,
        paddingVertical: 14,
        fontSize: 14,
        color: '#1F2937',
    },
    clearButton: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
});