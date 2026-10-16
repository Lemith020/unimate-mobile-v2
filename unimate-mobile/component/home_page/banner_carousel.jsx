import React from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedScrollHandler, useAnimatedStyle, interpolate } from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.75; 
const SPACING = 15;
const SIDE_PADDING = (width - CARD_WIDTH) / 2;

const banners = [
    {
        id: '1',
        title: 'Food Shops',
        buttonText: 'Order Now',
        image: { uri: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600' },
    },
    {
        id: '2',
        title: 'Find New Boarding Places',
        buttonText: 'Explore Boardings',
        image: { uri: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=600' },
    },
    {
        id: '3',
        title: 'Marketplace',
        buttonText: 'Visit Marketplace',
        image: { uri: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=600' },
    },
];

export default function BannerCarousel() {
    const scrollX = useSharedValue(0);

    const onScroll = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollX.value = event.contentOffset.x;
        },
    });

    return (
        <View style={styles.container}>
            <Animated.ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={CARD_WIDTH + SPACING}
                decelerationRate="fast"
                onScroll={onScroll}
                scrollEventThrottle={16}
                contentContainerStyle={{
                    paddingHorizontal: SIDE_PADDING,
                    alignItems: 'center',
                }}
            >
                {banners.map((banner, index) => {
                    const animatedStyle = useAnimatedStyle(() => {
                        const inputRange = [
                            (index - 1) * (CARD_WIDTH + SPACING),
                            index * (CARD_WIDTH + SPACING),
                            (index + 1) * (CARD_WIDTH + SPACING),
                        ];

                        
                        const scale = interpolate(
                            scrollX.value,
                            inputRange,
                            [0.82, 1, 0.82],
                            'clamp'
                        );

                        const opacity = interpolate(
                            scrollX.value,
                            inputRange,
                            [0.5, 1, 0.5],
                            'clamp'
                        );

                        return {
                            transform: [{ scale }],
                            opacity,
                        };
                    });

                    return (
                        <Animated.View key={banner.id} style={[styles.bannerWrapper, animatedStyle, { marginRight: SPACING }]}>
                            <ImageBackground source={banner.image} style={styles.imageBackground} imageStyle={styles.imageStyle}>
                                <View style={styles.overlay}>
                                    <Text style={styles.title}>{banner.title}</Text>
                                    <TouchableOpacity style={styles.button} onPress={() => alert(`${banner.buttonText} clicked!`)}>
                                        <Text style={styles.buttonText}>{banner.buttonText}</Text>
                                    </TouchableOpacity>
                                </View>
                            </ImageBackground>
                        </Animated.View>
                    );
                })}
            </Animated.ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginVertical: 15,
    },
    bannerWrapper: {
        width: CARD_WIDTH,
        height: 160,
        borderRadius: 18,
        overflow: 'hidden',
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
        elevation: 8,
    },
    imageBackground: {
        width: '100%',
        height: '100%',
        justifyContent: 'flex-end',
    },
    imageStyle: {
        borderRadius: 18,
    },
    overlay: {
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        padding: 15,
        height: '100%',
        justifyContent: 'space-between',
    },
    title: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: 'bold',
        maxWidth: '90%',
    },
    button: {
        backgroundColor: '#F97316',
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    buttonText: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 14,
    },
});