import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';

export default function LoadingState() {
    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color="#F97316" />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { padding: 30, justifyContent: 'center', alignItems: 'center' },
});