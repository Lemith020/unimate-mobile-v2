import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function QuantitySelector({
    quantity = 1,
    onChange,
    min = 1,
    max = 20,
    disabled = false,
}) {
    const canDecrease = !disabled && quantity > min;
    const canIncrease = !disabled && quantity < max;

    return (
        <View
            style={[
                styles.container,
                disabled && styles.disabledContainer,
            ]}
        >
            <TouchableOpacity
                style={[
                    styles.button,
                    !canDecrease && styles.disabledButton,
                ]}
                onPress={() => onChange?.(quantity - 1)}
                disabled={!canDecrease}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Decrease quantity"
                accessibilityState={{
                    disabled: !canDecrease,
                }}
            >
                <Ionicons
                    name="remove"
                    size={20}
                    color={canDecrease ? '#EA580C' : '#9CA3AF'}
                />
            </TouchableOpacity>

            <Text
                style={styles.quantity}
                accessibilityLabel={`Quantity: ${quantity}`}
                accessibilityLiveRegion="polite"
            >
                {quantity}
            </Text>

            <TouchableOpacity
                style={[
                    styles.button,
                    styles.addButton,
                    !canIncrease && styles.disabledButton,
                ]}
                onPress={() => onChange?.(quantity + 1)}
                disabled={!canIncrease}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Increase quantity"
                accessibilityState={{
                    disabled: !canIncrease,
                }}
            >
                <Ionicons
                    name="add"
                    size={20}
                    color={canIncrease ? '#FFFFFF' : '#9CA3AF'}
                />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        padding: 4,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#FED7AA',
        backgroundColor: '#FFF7ED',
    },
    disabledContainer: {
        opacity: 0.6,
    },
    button: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
    },
    addButton: {
        backgroundColor: '#EA580C',
    },
    disabledButton: {
        backgroundColor: '#F3F4F6',
    },
    quantity: {
        minWidth: 40,
        paddingHorizontal: 6,
        textAlign: 'center',
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        fontVariant: ['tabular-nums'],
    },
});