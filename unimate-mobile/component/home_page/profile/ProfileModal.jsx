import React, { useState, useCallback } from 'react';

import {
    View,
    ScrollView,
    StyleSheet,
    Modal,
    TouchableWithoutFeedback,
    Text,
    TouchableOpacity,
    Image
} from 'react-native';

import {
    Ionicons,
    MaterialCommunityIcons
} from '@expo/vector-icons';

import {
    useRouter,
    useFocusEffect
} from 'expo-router';

import AsyncStorage from '@react-native-async-storage/async-storage';


export default function ProfileModal({ visible, onClose }) {

    const router = useRouter();

    const [fullName, setFullName] = useState('Student');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');

    const [universityName, setUniversityName] =
        useState('University');

    const [facultyName, setFacultyName] =
        useState('Faculty');

    const [yearOfStudy, setYearOfStudy] =
        useState('');

    const [currentAddress, setCurrentAddress] =
        useState('');


    useFocusEffect(
        useCallback(() => {

            const loadUserData = async () => {

                try {

                    const storedUser =
                        await AsyncStorage.getItem('userData');

                    console.log(
                        'PROFILE MODAL USER:',
                        storedUser
                    );

                    if (storedUser) {

                        const parsedUser =
                            JSON.parse(storedUser);

                        const profile =
                            parsedUser?.profile;


                        if (profile?.full_name) {
                            setFullName(
                                profile.full_name
                            );
                        }


                        if (parsedUser?.email) {
                            setEmail(
                                parsedUser.email
                            );
                        }


                        if (profile?.phone) {
                            setPhone(
                                profile.phone
                            );
                        }


                        if (profile?.university_name) {
                            setUniversityName(
                                profile.university_name
                            );
                        }


                        if (profile?.faculty_name) {
                            setFacultyName(
                                profile.faculty_name
                            );
                        }


                        if (profile?.year_of_study) {
                            setYearOfStudy(
                                String(
                                    profile.year_of_study
                                )
                            );
                        }


                        if (profile?.current_address) {
                            setCurrentAddress(
                                profile.current_address
                            );
                        }

                    }

                } catch (error) {

                    console.error(
                        'Profile modal load error:',
                        error
                    );

                }

            };


            if (visible) {
                loadUserData();
            }

        }, [visible])
    );


    const handleEditProfilePress = () => {

        onClose();

        router.push(
            '/edit-profile'
        );

    };


    return (

        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >

            <View style={styles.overlayContainer}>


                <TouchableWithoutFeedback
                    onPress={onClose}
                >

                    <View
                        style={
                            styles.topDimmedOverlay
                        }
                    />

                </TouchableWithoutFeedback>


                <View
                    style={
                        styles.modalContentContainer
                    }
                >

                    <View
                        style={styles.dragHandleBar}
                    />


                    {/* Header */}

                    <View style={styles.modalHeader}>

                        <Text style={styles.modalTitle}>
                            My Profile
                        </Text>

                        <TouchableOpacity
                            onPress={onClose}
                        >

                            <Ionicons
                                name="close"
                                size={24}
                                color="#111827"
                            />

                        </TouchableOpacity>

                    </View>


                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={
                            styles.scrollContent
                        }
                    >


                        {/* Profile Header */}

                        <View
                            style={
                                styles.profileHeaderBox
                            }
                        >

                            <Image
                                source={{
                                    uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500'
                                }}
                                style={styles.avatar}
                            />


                            <Text
                                style={
                                    styles.nameText
                                }
                            >
                                {fullName}
                            </Text>


                            


                            <TouchableOpacity
                                style={
                                    styles.editButton
                                }
                                onPress={
                                    handleEditProfilePress
                                }
                            >

                                <Ionicons
                                    name="pencil-outline"
                                    size={16}
                                    color="#0F766E"
                                />

                                <Text
                                    style={
                                        styles.editButtonText
                                    }
                                >
                                    Edit Profile
                                </Text>

                            </TouchableOpacity>

                        </View>


                        {/* Contact Card */}

                        <View
                            style={
                                styles.cardContainer
                            }
                        >

                            <Text
                                style={
                                    styles.cardHeader
                                }
                            >
                                Contact
                            </Text>


                            <View style={styles.row}>

                                <Ionicons
                                    name="person-outline"
                                    size={18}
                                    color="#4B5563"
                                />

                                <Text style={styles.label}>
                                    Full name
                                </Text>

                                <Text style={styles.value}>
                                    {fullName}
                                </Text>

                            </View>


                            <View style={styles.row}>

                                <Ionicons
                                    name="call-outline"
                                    size={18}
                                    color="#4B5563"
                                />

                                <Text style={styles.label}>
                                    Phone
                                </Text>

                                <Text style={styles.value}>
                                    {phone || 'Not added'}
                                </Text>

                            </View>


                            <View
                                style={[
                                    styles.row,
                                    {
                                        borderBottomWidth: 0
                                    }
                                ]}
                            >

                                <Ionicons
                                    name="mail-outline"
                                    size={18}
                                    color="#4B5563"
                                />

                                <Text style={styles.label}>
                                    Email
                                </Text>

                                <Text style={styles.value}>
                                    {email}
                                </Text>

                            </View>

                        </View>


                        {/* University Card */}

                        <View
                            style={
                                styles.cardContainer
                            }
                        >

                            <Text
                                style={
                                    styles.cardHeader
                                }
                            >
                                University
                            </Text>


                            <View style={styles.row}>

                                <Ionicons
                                    name="school-outline"
                                    size={18}
                                    color="#4B5563"
                                />

                                <Text style={styles.label}>
                                    University
                                </Text>

                                <Text style={styles.value}>
                                    {universityName}
                                </Text>

                            </View>


                            <View style={styles.row}>

                                <MaterialCommunityIcons
                                    name="bank-outline"
                                    size={18}
                                    color="#4B5563"
                                />

                                <Text style={styles.label}>
                                    Faculty
                                </Text>

                                <Text style={styles.value}>
                                    {facultyName}
                                </Text>

                            </View>


                            <View
                                style={[
                                    styles.row,
                                    {
                                        borderBottomWidth: 0
                                    }
                                ]}
                            >

                                <Ionicons
                                    name="calendar-outline"
                                    size={18}
                                    color="#4B5563"
                                />

                                <Text style={styles.label}>
                                    Year of study
                                </Text>

                                <Text style={styles.value}>

                                    {yearOfStudy
                                        ? `Year ${yearOfStudy}`
                                        : 'Not added'}

                                </Text>

                            </View>

                        </View>


                        {/* Location Card */}

                        <View
                            style={
                                styles.cardContainer
                            }
                        >

                            <Text
                                style={
                                    styles.cardHeader
                                }
                            >
                                Location
                            </Text>


                            <View
                                style={
                                    styles.addressSection
                                }
                            >

                                <View
                                    style={styles.rowTop}
                                >

                                    <Ionicons
                                        name="location-outline"
                                        size={18}
                                        color="#4B5563"
                                    />

                                    <Text
                                        style={
                                            styles.label
                                        }
                                    >
                                        Current address
                                    </Text>

                                </View>


                                <Text
                                    style={
                                        styles.addressText
                                    }
                                >

                                    {
                                        currentAddress ||
                                        'Not added'
                                    }

                                </Text>

                            </View>

                        </View>


                    </ScrollView>

                </View>

            </View>

        </Modal>

    );
}


const styles = StyleSheet.create({

    overlayContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end'
    },

    topDimmedOverlay: {
        flex: 1
    },

    modalContentContainer: {
        height: '75%',
        backgroundColor: '#F3F4F6',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        overflow: 'hidden'
    },

    dragHandleBar: {
        width: 40,
        height: 4,
        backgroundColor: '#D1D5DB',
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: 8,
        marginBottom: 4
    },

    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB'
    },

    modalTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827'
    },

    scrollContent: {
        paddingBottom: 40
    },

    profileHeaderBox: {
        alignItems: 'center',
        paddingVertical: 16,
        backgroundColor: '#F9FAFB',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB'
    },

    avatar: {
        width: 70,
        height: 70,
        borderRadius: 35,
        marginBottom: 8
    },

    nameText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 2
    },

    badgePill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#CCFBF1',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12,
        gap: 4,
        marginBottom: 10
    },

    badgeText: {
        fontSize: 10,
        color: '#0F766E',
        fontWeight: '600'
    },

    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E6F4F1',
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 16,
        gap: 6,
        borderWidth: 1,
        borderColor: '#0F766E'
    },

    editButtonText: {
        fontSize: 12,
        color: '#0F766E',
        fontWeight: 'bold'
    },

    cardContainer: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 16,
        marginTop: 12,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB'
    },

    cardHeader: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#9CA3AF',
        marginBottom: 8,
        textTransform: 'uppercase'
    },

    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        gap: 12
    },

    label: {
        flex: 1,
        fontSize: 13,
        color: '#374151'
    },

    value: {
        fontSize: 13,
        color: '#111827',
        fontWeight: '500',
        maxWidth: '50%'
    },

    addressSection: {
        paddingVertical: 8
    },

    rowTop: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 4
    },

    addressText: {
        fontSize: 13,
        color: '#6B7280',
        marginLeft: 30
    }

});