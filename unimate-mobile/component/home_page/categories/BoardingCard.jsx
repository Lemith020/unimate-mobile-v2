import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';


export default function BoardingCard({
    onPress
}) {

    return (

        <TouchableOpacity
            style={styles.card}
            onPress={onPress}
        >

            <Ionicons
                name="home-outline"
                size={28}
                color="#D97706"
            />

            <Text style={styles.text}>
                Boarding
            </Text>

        </TouchableOpacity>

    );

}


const styles = StyleSheet.create({

    card: {
        width: '30%',
        aspectRatio: 1,
        backgroundColor: '#4f7edd',
        borderWidth: 1.5,
        borderColor: '#e58e36',
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },

    text: {
        marginTop: 8,
        fontSize: 13,
        fontWeight: 'bold',
        color: '#4B382A',
    },

});