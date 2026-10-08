import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';

const items = [
    { id: '1', name: 'City Pharmacy', tag: 'Pharmacy', distance: '350 m', isOpen: true, image: { uri: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200' } },
    { id: '2', name: 'Suhada Hotel', tag: 'Food', distance: '400 m', isOpen: true, image: { uri: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200' } },
    { id: '3', name: 'Sun Beam Boarding', tag: 'Boarding', distance: '550 m', isOpen: false, image: { uri: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=200' } },
    { id: '4', name: 'MediCare Clinic', tag: 'Health', distance: '700 m', isOpen: true, image: { uri: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=200' } },
];

export default function NearYou({ onSeeAll }) {
    const [locationOn, setLocationOn] = useState(true);

    if (!locationOn) {
        return (
            <View style={styles.section}>
                <View style={styles.locationCard}>
                    <Text style={styles.locText}>ළඟ තියෙන දේවල් බලන්න Location on කරන්න</Text>
                    <TouchableOpacity style={styles.enableBtn} onPress={() => setLocationOn(true)}>
                        <Text style={styles.enableText}>Enable</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.section}>
            <View style={styles.headerRow}>
                <Text style={styles.sectionTitle}>Near you</Text>
                <TouchableOpacity onPress={onSeeAll}><Text style={styles.seeAll}>See all</Text></TouchableOpacity>
            </View>
            <View style={styles.listContainer}>
                {items.map((item) => (
                    <View key={item.id} style={styles.rowItem}>
                        <Image source={item.image} style={styles.thumbnail} />
                        <View style={styles.info}>
                            <Text style={styles.itemName}>{item.name}</Text>
                            <View style={styles.subRow}>
                                <Text style={styles.categoryTag}>{item.tag}</Text>
                                <Text style={styles.distance}>• {item.distance}</Text>
                            </View>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: item.isOpen ? '#D1FAE5' : '#FEE2E2' }]}>
                            <Text style={[styles.statusText, { color: item.isOpen ? '#065F46' : '#991B1B' }]}>
                                {item.isOpen ? 'Open' : 'Closed'}
                            </Text>
                        </View>
                    </View>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    section: { marginVertical: 15, paddingHorizontal: 20 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, alignItems: 'center' },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#332211' },
    seeAll: { fontSize: 14, color: '#F97316', fontWeight: '600' },
    listContainer: { gap: 12 },
    rowItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 10, borderRadius: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3 },
    thumbnail: { width: 64, height: 64, borderRadius: 12 },
    info: { flex: 1, marginLeft: 12 },
    itemName: { fontSize: 15, fontWeight: 'bold', color: '#1F2937' },
    subRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 },
    categoryTag: { fontSize: 12, color: '#D97706', fontWeight: '600' },
    distance: { fontSize: 12, color: '#6B7280' },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    statusText: { fontSize: 12, fontWeight: 'bold' },
    locationCard: { backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#F59E0B', padding: 20, borderRadius: 16, alignItems: 'center', gap: 12 },
    locText: { fontSize: 14, fontWeight: '600', color: '#92400E', textAlign: 'center' },
    enableBtn: { backgroundColor: '#F59E0B', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8 },
    enableText: { color: '#fff', fontWeight: 'bold' },
});