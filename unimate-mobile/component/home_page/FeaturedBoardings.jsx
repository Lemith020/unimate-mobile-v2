import React from 'react';
import { View, Text, ScrollView, ImageBackground, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const boardings = [
    { id: '1', name: 'Campus View Boarding', price: 'Rs. 12,000 / month', distance: '0.8 km from campus', tags: ['Boys', 'WiFi'], image: { uri: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=600' } },
    { id: '2', name: 'Green Nest Hostel', price: 'Rs. 15,000 / month', distance: '1.2 km from campus', tags: ['Girls', 'AC'], image: { uri: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600' } },
];

export default function FeaturedBoardings({ onSeeAll }) {
    return (
        <View style={styles.section}>
            <View style={styles.headerRow}>
                <Text style={styles.sectionTitle}>Featured Boardings</Text>
                <TouchableOpacity onPress={onSeeAll}><Text style={styles.seeAll}>See all</Text></TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {boardings.map((item) => (
                    <View key={item.id} style={styles.card}>
                        <ImageBackground source={item.image} style={styles.cardImage} imageStyle={{ borderTopLeftRadius: 14, borderTopRightRadius: 14 }}>
                            <View style={styles.badgeLeft}><Text style={styles.badgeText}>Verified ✔</Text></View>
                            <TouchableOpacity style={styles.badgeRight}><Ionicons name="heart-outline" size={18} color="#EF4444" /></TouchableOpacity>
                        </ImageBackground>
                        <View style={styles.cardBody}>
                            <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
                            <Text style={styles.price}>{item.price}</Text>
                            <Text style={styles.distance}>{item.distance}</Text>
                            <View style={styles.tagRow}>
                                {item.tags.map((tag, idx) => (
                                    <View key={idx} style={styles.tag}><Text style={styles.tagText}>{tag}</Text></View>
                                ))}
                            </View>
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
    card: { width: 240, backgroundColor: '#FFFFFF', borderRadius: 14, elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, marginBottom: 5 },
    cardImage: { width: '100%', height: 135, flexDirection: 'row', justifyContent: 'space-between', padding: 10 },
    badgeLeft: { backgroundColor: '#10B981', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, height: 24 },
    badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
    badgeRight: { backgroundColor: '#fff', width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', elevation: 2 },
    cardBody: { padding: 12 },
    cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#1F2937' },
    price: { fontSize: 14, fontWeight: 'bold', color: '#F97316', marginVertical: 4 },
    distance: { fontSize: 12, color: '#6B7280', marginBottom: 8 },
    tagRow: { flexDirection: 'row', gap: 6 },
    tag: { backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
    tagText: { fontSize: 10, color: '#92400E', fontWeight: '600' },
});