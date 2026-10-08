import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeNav from './HomeNav';
import ExploreNav from './ExploreNav';
import ChatNav from './ChatNav';
import ProfileNav from './ProfileNav';

export default function NavigationBar() {
    const [activeTab, setActiveTab] = useState('Home');
    const insets = useSafeAreaInsets(); 

    return (
        <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 10) }]}>
            <HomeNav active={activeTab === 'Home'} onPress={() => setActiveTab('Home')} />
            <ExploreNav active={activeTab === 'Explore'} onPress={() => setActiveTab('Explore')} />
            <ChatNav active={activeTab === 'Chats'} onPress={() => setActiveTab('Chats')} />
            <ProfileNav active={activeTab === 'Profile'} onPress={() => setActiveTab('Profile')} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: '#FFFBEB',
        paddingTop: 10,
        paddingHorizontal: 25,
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#F3E8FF',
        elevation: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.15,
        shadowRadius: 5,
    },
});