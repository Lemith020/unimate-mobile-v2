import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Modal, TouchableWithoutFeedback } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MenuHeader from './MenuHeader';
import ActivitySection from './sections/ActivitySection';
import PrefsSection from './sections/PrefsSection';
import SupportSection from './sections/SupportSection';
import { useRouter } from 'expo-router';
import MenuFooter from './MenuFooter';


export default function MenuDrawer({ visible, onClose }) {
    const router = useRouter();
    const [fullName, setFullName] = useState('Student');


    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const storedUser = await AsyncStorage.getItem('userData');

                console.log("Stored User Data in Menu:", storedUser);

                if (storedUser) {
                    const parsedUser = JSON.parse(storedUser);

                    console.log(
                        "Parsed Profile Name:",
                        parsedUser?.profile?.full_name
                    );

                    if (parsedUser?.profile?.full_name) {
                        setFullName(parsedUser.profile.full_name);
                    }
                }
            } catch (error) {
                console.error("Error loading user data", error);
            }
        };

        if (visible) {
            fetchUserData();
        }
    }, [visible]);

    const handleLogout = async () => {
        await AsyncStorage.removeItem('userData'); // ලොග් අවුට් වෙද්දී ඩේටා ක්ලියර් කරනවා
        onClose();
        router.replace('/login');
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlayContainer}>
                {/* Left Side: Drawer Content */}
                <View style={styles.drawerContainer}>
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                        {/* මෙන්න මෙතැනට fullName එක පාස් කරනවා */}
                        <MenuHeader fullName={fullName} universityName="University of Kelaniya" />

                        <ActivitySection />
                        <View style={styles.sectionDivider} />

                        <PrefsSection />
                        <View style={styles.sectionDivider} />

                        <SupportSection />

                        <MenuFooter onPressLogout={handleLogout} />

                    </ScrollView>
                </View>

                {/* Right Side: Dimmed Background (Tapping closes drawer) */}
                <TouchableWithoutFeedback onPress={onClose}>
                    <View style={styles.dimmedOverlay} />
                </TouchableWithoutFeedback>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlayContainer: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    drawerContainer: {
        width: '80%',
        height: '100%',
        backgroundColor: '#FFFFFF',
        borderTopRightRadius: 20,
        borderBottomRightRadius: 20,
        overflow: 'hidden',
    },
    dimmedOverlay: {
        width: '20%',
        height: '100%',
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 20,
    },
    sectionDivider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginVertical: 10,
        marginHorizontal: 16,
    },
});