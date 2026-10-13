import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function NotificationsScreen() {
    const router = useRouter();

    const goBack = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/home_page');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={goBack}
                    accessibilityRole="button"
                    accessibilityLabel="Go back"
                >
                    <Ionicons
                        name="arrow-back"
                        size={23}
                        color="#431407"
                    />
                </TouchableOpacity>

                <Text style={styles.title}>Notifications</Text>
            </View>

            <View style={styles.content}>
                <View style={styles.iconCircle}>
                    <Ionicons
                        name="notifications-outline"
                        size={48}
                        color="#F97316"
                    />
                </View>

                <Text style={styles.emptyTitle}>
                    Your updates, in one place
                </Text>

                <Text style={styles.description}>
                    Order updates and other notifications will appear
                    here once notifications are connected.
                </Text>

                <TouchableOpacity
                    style={styles.homeButton}
                    onPress={() => router.replace('/home_page')}
                    accessibilityRole="button"
                >
                    <Text style={styles.homeButtonText}>
                        Back to Home
                    </Text>
                    <Ionicons
                        name="arrow-forward"
                        size={18}
                        color="#FFFFFF"
                    />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF8EE',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#FFEDD5',
        backgroundColor: '#FFFFFF',
        gap: 12,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#FFF7ED',
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#431407',
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 30,
    },
    iconCircle: {
        width: 110,
        height: 110,
        borderRadius: 55,
        backgroundColor: '#FFEDD5',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 21,
        fontWeight: '700',
        textAlign: 'center',
        color: '#431407',
    },
    description: {
        marginTop: 12,
        fontSize: 14,
        lineHeight: 23,
        textAlign: 'center',
        color: '#78716C',
    },
    homeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        marginTop: 26,
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 14,
        backgroundColor: '#F97316',
    },
    homeButtonText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});