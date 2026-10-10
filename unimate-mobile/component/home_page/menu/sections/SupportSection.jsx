import React from 'react';
import {
    View,
    TouchableOpacity,
    Text,
    StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function SupportSection() {
    const router = useRouter();

    const items = [
        {
            icon: 'help-circle-outline',
            label: 'Help & FAQ',
            route: '/support/help-faq',
        },
        {
            icon: 'chatbubble-ellipses-outline',
            label: 'Send feedback',
            route: '/support/feedback',
        },
        {
            icon: 'flag-outline',
            label: 'Report a problem',
            route: '/support/report-problem',
        },
        {
            icon: 'call-outline',
            label: 'Contact us',
        },
        {
            icon: 'information-circle-outline',
            label: 'About',
        },

        //remove terms and privacy

    ];

    return (
        <View style={styles.sectionContainer}>
            {items.map((item) => (
                <TouchableOpacity
                    key={item.label}
                    style={styles.row}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={item.label}
                    onPress={() => {
                        if (item.route) {
                            router.push(item.route);
                        }
                    }}
                >
                    <View style={styles.iconContainer}>
                        <Ionicons
                            name={item.icon}
                            size={20}
                            color="#D97706"
                        />
                    </View>

                    <Text style={styles.label}>
                        {item.label}
                    </Text>

                    <Ionicons
                        name="chevron-forward"
                        size={16}
                        color="#9CA3AF"
                    />
                </TouchableOpacity>
            ))}
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
        backgroundColor: '#FEF3C7',
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
});