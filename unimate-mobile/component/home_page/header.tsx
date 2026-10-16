import React, { useCallback, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Image,
    StyleSheet
} from 'react-native';

import { Ionicons, Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';


interface HeaderProps {
    onMenuPress?: () => void;
    onProfilePress?: () => void;
}


export default function Header({
    onMenuPress,
    onProfilePress
}: HeaderProps) {

    const [fullName, setFullName] =
        useState('Student');

    const [universityName, setUniversityName] =
        useState('University');


    // Login userගේ latest data load කරනවා
    useFocusEffect(
        useCallback(() => {

            const loadUserData = async () => {

                try {

                    const storedUser =
                        await AsyncStorage.getItem(
                            'userData'
                        );


                    console.log(
                        'HEADER USER DATA:',
                        storedUser
                    );


                    if (!storedUser) {

                        setFullName('Student');
                        setUniversityName('University');

                        return;
                    }


                    const parsedUser =
                        JSON.parse(storedUser);


                    const profile =
                        parsedUser?.profile;


                    console.log(
                        'HEADER NAME:',
                        profile?.full_name
                    );


                    console.log(
                        'HEADER UNIVERSITY:',
                        profile?.university_name
                    );


                    if (profile?.full_name) {

                        setFullName(
                            profile.full_name
                        );

                    } else {

                        setFullName('Student');

                    }


                    if (profile?.university_name) {

                        setUniversityName(
                            profile.university_name
                        );

                    } else {

                        setUniversityName(
                            'University'
                        );

                    }


                } catch (error) {

                    console.error(
                        'Header user data load error:',
                        error
                    );

                }

            };


            loadUserData();


        }, [])
    );


    return (

        <View style={styles.headerContainer}>


            {/* Left Side */}

            <View style={styles.leftContainer}>


                {/* Menu Button */}

                <TouchableOpacity
                    onPress={onMenuPress}
                    style={styles.menuButton}
                >

                    <Ionicons
                        name="menu"
                        size={26}
                        color="#ffffff"
                        style={styles.menuIcon}
                    />

                </TouchableOpacity>


                {/* User Details */}

                <View style={styles.userTextContainer}>


                    <Text
                        style={styles.greetingText}
                        numberOfLines={1}
                    >

                        Hi, {fullName}

                    </Text>


                    <View
                        style={
                            styles.locationContainer
                        }
                    >

                        <Ionicons
                            name="location-sharp"
                            size={14}
                            color="#dee8e0"
                        />


                        <Text
                            style={
                                styles.locationText
                            }
                            numberOfLines={1}
                        >

                            {universityName}

                        </Text>

                    </View>


                </View>

            </View>



            {/* Right Side */}

            <View style={styles.rightContainer}>


                {/* Notification Button */}

                {/*<TouchableOpacity

                    style={styles.bellButton}

                    onPress={() =>
                        alert(
                            'Notifications Clicked!'
                        )
                    }

                >

                    <Feather
                        name="bell"
                        size={22}
                        color="#ffffff"
                    />

                </TouchableOpacity>*/}


                {/* Profile Avatar */}

                <TouchableOpacity
                    onPress={
                        onProfilePress
                    }
                >

                <Image
                    source={require('../../assets/about_us_page_developers_photos/lemith.png')}
                    style={styles.avatar}
                    resizeMode="cover"
                />

                </TouchableOpacity>


            </View>


        </View>

    );

}



const styles = StyleSheet.create({

    headerContainer: {

        backgroundColor: '#FF6B00',

        paddingTop: 50,

        paddingBottom: 20,

        paddingHorizontal: 20,

        flexDirection: 'row',

        justifyContent: 'space-between',

        alignItems: 'center',

        borderBottomLeftRadius: 5,

        borderBottomRightRadius: 5,

    },


    leftContainer: {

        flexDirection: 'row',

        alignItems: 'center',

        flex: 1,

    },


    menuButton: {

        padding: 2,

    },


    menuIcon: {

        marginRight: 15,

    },


    userTextContainer: {

        flex: 1,

    },


    greetingText: {

        fontSize: 18,

        fontWeight: 'bold',

        color: '#ffffff',

    },


    locationContainer: {

        flexDirection: 'row',

        alignItems: 'center',

        marginTop: 2,

    },


    locationText: {

        fontSize: 13,

        color: '#ffedd5',

        marginLeft: 3,

        flexShrink: 1,

    },


    rightContainer: {

        flexDirection: 'row',

        alignItems: 'center',

        marginLeft: 10,

    },


    bellButton: {

        marginRight: 15,

        backgroundColor:
            'rgba(255, 255, 255, 0.2)',

        padding: 8,

        borderRadius: 50,

    },


    avatar: {

        width: 40,

        height: 40,

        borderRadius: 20,

        borderWidth: 2,

        borderColor: '#ffffff',

    },

});