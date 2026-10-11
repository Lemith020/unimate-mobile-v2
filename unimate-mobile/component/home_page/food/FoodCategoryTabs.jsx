import React from 'react';
import {
    ScrollView,
    TouchableOpacity,
    Text,
    StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function FoodCategoryTabs({
    categories = [],
    selectedCategoryId = null,
    onSelectCategory,
}) {
    const tabs = [
        { id: null, name: 'All' },
        ...categories.filter(
            (category) => category?.id && category?.name
        ),
    ];

    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.container}
        >
            {tabs.map((category) => {
                const isSelected =
                    selectedCategoryId === category.id;

                return (
                    <TouchableOpacity
                        key={category.id ?? 'all'}
                        style={[
                            styles.tab,
                            isSelected && styles.selectedTab,
                        ]}
                        onPress={() =>
                            onSelectCategory?.(category.id)
                        }
                        activeOpacity={0.75}
                        accessibilityRole="button"
                        accessibilityLabel={category.name}
                        accessibilityState={{
                            selected: isSelected,
                        }}
                    >
                        {category.id === null && (
                            <Ionicons
                                name="grid-outline"
                                size={16}
                                color={
                                    isSelected
                                        ? '#FFFFFF'
                                        : '#EA580C'
                                }
                                style={styles.icon}
                            />
                        )}

                        <Text
                            style={[
                                styles.label,
                                isSelected &&
                                    styles.selectedLabel,
                            ]}
                        >
                            {category.name}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingVertical: 12,
        paddingRight: 4,
        alignItems: 'center',
    },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 44,
        paddingHorizontal: 18,
        paddingVertical: 10,
        marginRight: 8,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: '#FED7AA',
        backgroundColor: '#FFFFFF',
    },
    selectedTab: {
        backgroundColor: '#EA580C',
        borderColor: '#EA580C',
    },
    icon: {
        marginRight: 6,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#9A3412',
    },
    selectedLabel: {
        color: '#FFFFFF',
    },
});