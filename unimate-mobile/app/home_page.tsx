import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


import Header from '../component/home_page/header';
import SearchBox from '../component/home_page/search_box';
import BannerCarousel from '../component/home_page/banner_carousel';
import CategoriesSection from '../component/home_page/categories/CategoriesSection';
import EmergencyStrip from '../component/home_page/EmergencyStrip';
import FeaturedBoardings from '../component/home_page/FeaturedBoardings';
import FoodShops from '../component/home_page/FoodShops';
import NearYou from '../component/home_page/NearYou';
import MarketplaceSection from '../component/home_page/MarketplaceSection';
import NavigationBar from '../component/home_page/navigation_bar/NavigationBar';
import MenuDrawer from '../component/home_page/menu/MenuDrawer';
import ProfileModal from '../component/home_page/profile/ProfileModal'; 

export default function HomeScreen() {
    const [menuVisible, setMenuVisible] = useState(false);
    const [profileVisible, setProfileVisible] = useState(false);
    
    

console.log('HOME COMPONENT CHECK:', {
    Header: typeof Header,
    SearchBox: typeof SearchBox,
    BannerCarousel: typeof BannerCarousel,
    CategoriesSection: typeof CategoriesSection,
    EmergencyStrip: typeof EmergencyStrip,
    FeaturedBoardings: typeof FeaturedBoardings,
    FoodShops: typeof FoodShops,
    NearYou: typeof NearYou,
    MarketplaceSection: typeof MarketplaceSection,
    NavigationBar: typeof NavigationBar,
    MenuDrawer: typeof MenuDrawer,
    ProfileModal: typeof ProfileModal,
});
    

    return (
        <SafeAreaView style={styles.mainContainer} edges={['top']}>
            <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                <Header 
                    onMenuPress={() => setMenuVisible(true)} 
                    onProfilePress={() => setProfileVisible(true)} 
                />
                <SearchBox />
                <BannerCarousel />
                <CategoriesSection />
                <EmergencyStrip />
                <FeaturedBoardings />
                <FoodShops />
                <NearYou />
                <MarketplaceSection />
            </ScrollView>
            <NavigationBar />

            <MenuDrawer visible={menuVisible} onClose={() => setMenuVisible(false)} />
            <ProfileModal visible={profileVisible} onClose={() => setProfileVisible(false)} />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    mainContainer: { flex: 1, backgroundColor: '#FFF8EE' },
    scrollContainer: { flex: 1 },
});