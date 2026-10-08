import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const shops = [
    { id: '1', name: 'Campus Kitchen', cuisine: 'Rice & Curry', rating: 4.5, time: 'Open till 9 PM', type: 'Pickup / Delivery', image: { uri: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600' } },
    { id: '2', name: 'Spice Hub', cuisine: 'Kottu & Fried Rice', rating: 4.3, time: 'Open till 10 PM', type: 'Delivery', image: { uri: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600' } },
];

export default function FoodShops({ onSeeAll }) {
    return (
        <View style={styles.section}>
            <View style={styles.headerRow}>
                <Text style={styles.sectionTitle}>Open now: Food Shops</Text>
                <TouchableOpacity onPress={onSeeAll}><Text style={styles.seeAll}>See all</Text></TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {shops.map((item) => (
                    <View key={item.id} style={styles.card}>
                        <Image source={item.image} style={styles.image} />
                        <View style={styles.cardBody}>
                            <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                            <Text style={styles.cuisine}>{item.cuisine}</Text>
                            <View style={styles.rowBetween}>
                                <View style={styles.ratingRow}>
                                    <Ionicons name="star" size={12} color="#F59E0B" />
                                    <Text style={styles.ratingText}>{item.rating}</Text>
                                </View>
                                <Text style={styles.time}>{item.time}</Text>
                            </View>
                            <View style={styles.tag}><Text style={styles.tagText}>{item.type}</Text></View>
                        </View>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    section: { marginVertical: 15 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 10, alignItems: 'center' },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#332211' },
    seeAll: { fontSize: 14, color: '#F97316', fontWeight: '600' },
    scrollContent: { paddingHorizontal: 20, gap: 15 },
    card: { width: 200, backgroundColor: '#FFFFFF', borderRadius: 14, elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, overflow: 'hidden', marginBottom: 5 },
    image: { width: '100%', height: 110 },
    cardBody: { padding: 10 },
    name: { fontSize: 14, fontWeight: 'bold', color: '#1F2937' },
    cuisine: { fontSize: 12, color: '#6B7280', marginVertical: 2 },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 4 },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    ratingText: { fontSize: 12, fontWeight: 'bold', color: '#374151' },
    time: { fontSize: 11, color: '#10B981', fontWeight: '600' },
    tag: { backgroundColor: '#EDFDFD', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start', marginTop: 4 },
    tagText: { fontSize: 10, color: '#0D9488', fontWeight: '600' },
});