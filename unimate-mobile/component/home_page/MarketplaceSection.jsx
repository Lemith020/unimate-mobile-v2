import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet } from 'react-native';

const items = [
    { id: '1', name: 'Table fan', price: 'Rs. 3,500', tag: 'Used', image: { uri: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=300' } },
    { id: '2', name: 'Study Desk', price: 'Rs. 6,000', tag: 'New', image: { uri: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=300' } },
    { id: '3', name: 'Scientific Calculator', price: 'Rs. 2,500', tag: 'Used', image: { uri: 'https://images.unsplash.com/photo-1594980599075-4308dc556f64?w=300' } },
];

export default function MarketplaceSection({ onSeeAll }) {
    return (
        <View style={styles.section}>
            <View style={styles.headerRow}>
                <Text style={styles.sectionTitle}>Latest in Marketplace</Text>
                <TouchableOpacity onPress={onSeeAll}><Text style={styles.seeAll}>See all</Text></TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {items.map((item) => (
                    <View key={item.id} style={styles.card}>
                        <Image source={item.image} style={styles.image} />
                        <View style={styles.cardBody}>
                            <View style={styles.tag}><Text style={styles.tagText}>{item.tag}</Text></View>
                            <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                            <Text style={styles.price}>{item.price}</Text>
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
    card: { width: 150, backgroundColor: '#FFFFFF', borderRadius: 12, elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, overflow: 'hidden', marginBottom: 5 },
    image: { width: '100%', height: 120 },
    cardBody: { padding: 10 },
    tag: { backgroundColor: '#F3F4F6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start', marginBottom: 4 },
    tagText: { fontSize: 10, color: '#4B5563', fontWeight: 'bold' },
    name: { fontSize: 13, fontWeight: '600', color: '#1F2937' },
    price: { fontSize: 13, fontWeight: 'bold', color: '#F97316', marginTop: 4 },
});