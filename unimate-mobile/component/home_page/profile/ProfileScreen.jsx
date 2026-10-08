import React from 'react';
import {
    ScrollView,
    StyleSheet
} from 'react-native';

import ProfileHeader from './ProfileHeader';
import ContactCard from './ContactCard';
import UniversityCard from './UniversityCard';
import LocationCard from './LocationCard';
import AccountCard from './AccountCard';

export default function ProfileScreen() {

    return (

        <ScrollView
            style={styles.container}
            showsVerticalScrollIndicator={false}
        >

            <ProfileHeader />

            <ContactCard />

            <UniversityCard />

            <LocationCard />

            <AccountCard />

        </ScrollView>

    );
}

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: '#F3F4F6'
    }

});