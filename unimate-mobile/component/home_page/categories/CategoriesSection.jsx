import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

import BoardingCard from './BoardingCard';
import FoodCard from './FoodCard';
import PharmacyCard from './PharmacyCard';
// import HealthCard from './HealthCard';
import TransportCard from './TransportCard';
import ServiceCard from './ServiceCard';
import MarketplaceCard from './MarketplaceCard';

export default function CategoriesSection() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <Text style={styles.heading}>Categories</Text>

            <View style={styles.gridContainer}>
                <BoardingCard
                    onPress={() => router.push('/boardings')}
                />

                <FoodCard
                    onPress={() => router.push('/food')}
                />

                <PharmacyCard
                    onPress={() => router.push('/pharmacy')}
                />

                {/* Temporarily hidden
                <HealthCard
                    onPress={() => alert('Health clicked')}
                />
                */}

                <TransportCard
                    onPress={() => alert('Transport clicked')}
                />

                <ServiceCard
                    onPress={() => alert('Service clicked')}
                />

                <MarketplaceCard
                    onPress={() => router.push('/marketplace')}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 20,
        marginVertical: 10,
    },
    heading: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#332211',
        marginBottom: 15,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
});



// after update