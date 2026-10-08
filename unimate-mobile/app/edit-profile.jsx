import React, { useEffect, useState } from 'react';

import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';

import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';


export default function EditProfileScreen() {

    const router = useRouter();

    const [userId, setUserId] = useState('');
    const [email, setEmail] = useState('');

    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');

    const [universityId, setUniversityId] = useState('');
    const [facultyId, setFacultyId] = useState('');

    const [universities, setUniversities] = useState([]);
    const [faculties, setFaculties] = useState([]);

    const [yearOfStudy, setYearOfStudy] = useState('');
    const [currentAddress, setCurrentAddress] = useState('');
    const [city, setCity] = useState('');
    const [district, setDistrict] = useState('');

    const [latitude, setLatitude] = useState(null);
    const [longitude, setLongitude] = useState(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [locationLoading, setLocationLoading] = useState(false);


    // Load logged-in user
    useEffect(() => {

        const loadUser = async () => {

            try {

                const storedUser =
                    await AsyncStorage.getItem('userData');

                if (!storedUser) {

                    Alert.alert(
                        'Error',
                        'User data not found'
                    );

                    return;
                }

                const parsedUser =
                    JSON.parse(storedUser);

                const profile =
                    parsedUser?.profile;


                setUserId(
                    parsedUser?.id || ''
                );

                setEmail(
                    parsedUser?.email || ''
                );

                setFullName(
                    profile?.full_name || ''
                );

                setPhone(
                    profile?.phone || ''
                );

                setUniversityId(
                    profile?.university_id
                        ? String(profile.university_id)
                        : ''
                );

                setFacultyId(
                    profile?.faculty_id
                        ? String(profile.faculty_id)
                        : ''
                );

                setYearOfStudy(
                    profile?.year_of_study
                        ? String(profile.year_of_study)
                        : ''
                );

                setCurrentAddress(
                    profile?.current_address || ''
                );

                setCity(
                    profile?.city || ''
                );

                setDistrict(
                    profile?.district || ''
                );

                if (profile?.latitude) {
                    setLatitude(
                        Number(profile.latitude)
                    );
                }

                if (profile?.longitude) {
                    setLongitude(
                        Number(profile.longitude)
                    );
                }

            } catch (error) {

                console.error(
                    'Load profile error:',
                    error
                );

                Alert.alert(
                    'Error',
                    'Could not load profile data'
                );

            } finally {

                setLoading(false);

            }

        };

        loadUser();

    }, []);


    // Load universities
    useEffect(() => {

        const loadUniversities = async () => {

            try {

                const response = await fetch(
                    'http://10.0.2.2:5000/api/universities'
                );

                const data =
                    await response.json();

                if (response.ok) {

                    setUniversities(data);

                }

            } catch (error) {

                console.error(
                    'University load error:',
                    error
                );

            }

        };

        loadUniversities();

    }, []);


    // Load faculties for selected university
    useEffect(() => {

        const loadFaculties = async () => {

            if (!universityId) {

                setFaculties([]);

                return;
            }

            try {

                const response = await fetch(
                    `http://10.0.2.2:5000/api/universities/${universityId}/faculties`
                );

                const data =
                    await response.json();

                if (response.ok) {

                    setFaculties(data);

                }

            } catch (error) {

                console.error(
                    'Faculty load error:',
                    error
                );

            }

        };

        loadFaculties();

    }, [universityId]);


    // University change
    const handleUniversityChange = (value) => {

        const selectedValue =
            String(value);

        if (selectedValue === universityId) {
            return;
        }

        setUniversityId(selectedValue);
        setFacultyId('');

    };


    // =========================================================
    // GET CURRENT GPS LOCATION
    // =========================================================

    const handleUseCurrentLocation = async () => {

        try {

            setLocationLoading(true);

            const { status } =
                await Location.requestForegroundPermissionsAsync();

            if (status !== 'granted') {

                Alert.alert(
                    'Permission Required',
                    'Please allow location permission to use your current location.'
                );

                return;
            }


            const currentLocation =
                await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.High,
                });


            const lat =
                currentLocation.coords.latitude;

            const lng =
                currentLocation.coords.longitude;


            setLatitude(lat);
            setLongitude(lng);


            console.log(
                'CURRENT LATITUDE:',
                lat
            );

            console.log(
                'CURRENT LONGITUDE:',
                lng
            );


            const addressResult =
                await Location.reverseGeocodeAsync({
                    latitude: lat,
                    longitude: lng,
                });


            if (addressResult.length > 0) {

                const address =
                    addressResult[0];


                console.log(
                    'REVERSE GEO ADDRESS:',
                    address
                );


                const addressText = [

                    address.name,
                    address.street,
                    address.city,
                    address.subregion,
                    address.region,

                ]
                    .filter(Boolean)
                    .filter(
                        (value, index, array) =>
                            array.indexOf(value) === index
                    )
                    .join(', ');


                if (addressText) {

                    setCurrentAddress(
                        addressText
                    );

                }


                setCity(
                    address.city ||
                    address.subregion ||
                    ''
                );


                setDistrict(
                    address.subregion ||
                    address.region ||
                    ''
                );

            }


            Alert.alert(
                'Location Found',
                'Your current location has been added. Press Save Changes to update your profile.'
            );


        } catch (error) {

            console.error(
                'Location error:',
                error
            );

            Alert.alert(
                'Location Error',
                'Could not get your current location.'
            );

        } finally {

            setLocationLoading(false);

        }

    };


    // =========================================================
    // SAVE PROFILE
    // =========================================================

    const handleSave = async () => {

        if (!fullName.trim()) {

            Alert.alert(
                'Error',
                'Full name is required'
            );

            return;
        }


        if (!userId) {

            Alert.alert(
                'Error',
                'User ID not found'
            );

            return;
        }


        if (!universityId) {

            Alert.alert(
                'Error',
                'Please select a university'
            );

            return;
        }


        if (!facultyId) {

            Alert.alert(
                'Error',
                'Please select a faculty'
            );

            return;
        }


        const updatedData = {

            full_name:
                fullName.trim(),

            phone:
                phone.trim() || null,

            university_id:
                universityId
                    ? parseInt(universityId)
                    : null,

            faculty_id:
                facultyId
                    ? parseInt(facultyId)
                    : null,

            year_of_study:
                yearOfStudy
                    ? parseInt(yearOfStudy)
                    : null,

            current_address:
                currentAddress.trim() || null,

            city:
                city.trim() || null,

            district:
                district.trim() || null,

            latitude:
                latitude,

            longitude:
                longitude,

        };


        try {

            setSaving(true);


            const response = await fetch(
                `http://10.0.2.2:5000/api/profile/${userId}`,
                {
                    method: 'PUT',

                    headers: {
                        'Content-Type':
                            'application/json',
                    },

                    body:
                        JSON.stringify(
                            updatedData
                        ),
                }
            );


            const responseText =
                await response.text();


            let data;


            try {

                data =
                    JSON.parse(responseText);

            } catch (error) {

                console.error(
                    'NON JSON RESPONSE:',
                    responseText
                );

                Alert.alert(
                    'Server Error',
                    `Server returned status ${response.status}`
                );

                return;

            }


            if (!response.ok) {

                Alert.alert(
                    'Error',
                    data.error ||
                    'Profile update failed'
                );

                return;
            }


            // Update AsyncStorage
            const storedUser =
                await AsyncStorage.getItem(
                    'userData'
                );


            if (storedUser) {

                const parsedUser =
                    JSON.parse(storedUser);


                const updatedStoredUser = {

                    ...parsedUser,

                    profile:
                        data.profile,

                };


                await AsyncStorage.setItem(
                    'userData',
                    JSON.stringify(
                        updatedStoredUser
                    )
                );

            }


            Alert.alert(
                'Success',
                'Profile updated successfully',
                [
                    {
                        text: 'OK',

                        onPress: () =>
                            router.back(),
                    }
                ]
            );


        } catch (error) {

            console.error(
                'Update profile error:',
                error
            );


            Alert.alert(
                'Error',
                'Could not connect to server'
            );


        } finally {

            setSaving(false);

        }

    };


    if (loading) {

        return (

            <View style={styles.loadingContainer}>

                <ActivityIndicator
                    size="large"
                    color="#ff7f00"
                />

                <Text style={styles.loadingText}>
                    Loading profile...
                </Text>

            </View>

        );

    }


    return (

        <KeyboardAvoidingView

            style={styles.container}

            behavior={
                Platform.OS === 'ios'
                    ? 'padding'
                    : 'height'
            }

        >


            <View style={styles.header}>

                <TouchableOpacity

                    onPress={() =>
                        router.back()
                    }

                    style={styles.backButton}

                >

                    <Ionicons
                        name="arrow-back"
                        size={24}
                        color="#111827"
                    />

                </TouchableOpacity>


                <Text style={styles.title}>
                    Edit Profile
                </Text>


                <View
                    style={{
                        width: 40
                    }}
                />

            </View>


            <ScrollView

                contentContainerStyle={
                    styles.scrollContent
                }

                showsVerticalScrollIndicator={
                    false
                }

                keyboardShouldPersistTaps="handled"

            >


                <Text style={styles.sectionTitle}>
                    Personal Details
                </Text>


                <Text style={styles.label}>
                    Full Name
                </Text>

                <View style={styles.inputContainer}>

                    <Ionicons
                        name="person-outline"
                        size={20}
                        color="#ff7f00"
                        style={styles.inputIcon}
                    />

                    <TextInput

                        style={styles.input}

                        value={fullName}

                        onChangeText={
                            setFullName
                        }

                        placeholder="Full Name"

                        placeholderTextColor="#9CA3AF"

                    />

                </View>


                <Text style={styles.label}>
                    Email
                </Text>

                <View
                    style={[
                        styles.inputContainer,
                        styles.disabledInput
                    ]}
                >

                    <Ionicons
                        name="mail-outline"
                        size={20}
                        color="#9CA3AF"
                        style={styles.inputIcon}
                    />

                    <TextInput

                        style={[
                            styles.input,
                            styles.disabledText
                        ]}

                        value={email}

                        editable={false}

                    />

                </View>


                <Text style={styles.label}>
                    Phone
                </Text>

                <View style={styles.inputContainer}>

                    <Ionicons
                        name="call-outline"
                        size={20}
                        color="#ff7f00"
                        style={styles.inputIcon}
                    />

                    <TextInput

                        style={styles.input}

                        value={phone}

                        onChangeText={
                            setPhone
                        }

                        placeholder="Phone Number"

                        placeholderTextColor="#9CA3AF"

                        keyboardType="phone-pad"

                    />

                </View>



                <Text style={styles.sectionTitle}>
                    University Details
                </Text>


                <Text style={styles.label}>
                    University
                </Text>

                <View style={styles.pickerContainer}>

                    <Ionicons
                        name="school-outline"
                        size={20}
                        color="#ff7f00"
                        style={styles.pickerIcon}
                    />


                    <Picker

                        selectedValue={
                            universityId
                        }

                        onValueChange={
                            handleUniversityChange
                        }

                        style={styles.picker}

                    >

                        <Picker.Item

                            label="Select University"

                            value=""

                            enabled={false}

                        />


                        {
                            universities.map(
                                (university) => (

                                    <Picker.Item

                                        key={
                                            university.id
                                        }

                                        label={
                                            university.name
                                        }

                                        value={
                                            String(
                                                university.id
                                            )
                                        }

                                    />

                                )
                            )
                        }

                    </Picker>

                </View>


                <Text style={styles.label}>
                    Faculty
                </Text>

                <View style={styles.pickerContainer}>

                    <Ionicons
                        name="business-outline"
                        size={20}
                        color="#ff7f00"
                        style={styles.pickerIcon}
                    />


                    <Picker

                        selectedValue={
                            facultyId
                        }

                        onValueChange={
                            (value) =>
                                setFacultyId(
                                    String(value)
                                )
                        }

                        enabled={
                            !!universityId
                        }

                        style={styles.picker}

                    >

                        <Picker.Item

                            label={
                                universityId
                                    ? 'Select Faculty'
                                    : 'Select University First'
                            }

                            value=""

                            enabled={false}

                        />


                        {
                            faculties.map(
                                (faculty) => (

                                    <Picker.Item

                                        key={
                                            faculty.id
                                        }

                                        label={
                                            faculty.name
                                        }

                                        value={
                                            String(
                                                faculty.id
                                            )
                                        }

                                    />

                                )
                            )
                        }

                    </Picker>

                </View>


                <Text style={styles.label}>
                    Year of Study
                </Text>

                <View style={styles.inputContainer}>

                    <Ionicons
                        name="calendar-outline"
                        size={20}
                        color="#ff7f00"
                        style={styles.inputIcon}
                    />

                    <TextInput

                        style={styles.input}

                        value={yearOfStudy}

                        onChangeText={
                            setYearOfStudy
                        }

                        placeholder="Example: 2"

                        placeholderTextColor="#9CA3AF"

                        keyboardType="numeric"

                        maxLength={1}

                    />

                </View>



                <Text style={styles.sectionTitle}>
                    Location Details
                </Text>


                {/* Current GPS button */}

                <TouchableOpacity

                    style={styles.locationButton}

                    onPress={
                        handleUseCurrentLocation
                    }

                    disabled={
                        locationLoading
                    }

                >

                    {
                        locationLoading ? (

                            <ActivityIndicator
                                size="small"
                                color="#FFFFFF"
                            />

                        ) : (

                            <Ionicons
                                name="location"
                                size={20}
                                color="#FFFFFF"
                            />

                        )
                    }


                    <Text
                        style={
                            styles.locationButtonText
                        }
                    >

                        {
                            locationLoading
                                ? 'Getting Location...'
                                : 'Use Current Location'
                        }

                    </Text>

                </TouchableOpacity>


                {
                    latitude !== null &&
                    longitude !== null && (

                        <View style={styles.coordinatesBox}>

                            <Text style={styles.coordinatesText}>
                                Latitude: {latitude}
                            </Text>

                            <Text style={styles.coordinatesText}>
                                Longitude: {longitude}
                            </Text>

                        </View>

                    )
                }


                <Text style={styles.label}>
                    Current Address
                </Text>

                <View
                    style={[
                        styles.inputContainer,
                        styles.addressInputContainer
                    ]}
                >

                    <Ionicons
                        name="location-outline"
                        size={20}
                        color="#ff7f00"
                        style={[
                            styles.inputIcon,
                            {
                                marginTop: 2
                            }
                        ]}
                    />

                    <TextInput

                        style={[
                            styles.input,
                            styles.addressInput
                        ]}

                        value={
                            currentAddress
                        }

                        onChangeText={
                            setCurrentAddress
                        }

                        placeholder="Current Address"

                        placeholderTextColor="#9CA3AF"

                        multiline

                    />

                </View>


                <Text style={styles.label}>
                    City
                </Text>

                <View style={styles.inputContainer}>

                    <Ionicons
                        name="location-outline"
                        size={20}
                        color="#ff7f00"
                        style={styles.inputIcon}
                    />

                    <TextInput

                        style={styles.input}

                        value={city}

                        onChangeText={
                            setCity
                        }

                        placeholder="City"

                        placeholderTextColor="#9CA3AF"

                    />

                </View>


                <Text style={styles.label}>
                    District
                </Text>

                <View style={styles.inputContainer}>

                    <Ionicons
                        name="map-outline"
                        size={20}
                        color="#ff7f00"
                        style={styles.inputIcon}
                    />

                    <TextInput

                        style={styles.input}

                        value={district}

                        onChangeText={
                            setDistrict
                        }

                        placeholder="District"

                        placeholderTextColor="#9CA3AF"

                    />

                </View>



                <TouchableOpacity

                    style={[
                        styles.saveButton,
                        saving &&
                        styles.saveButtonDisabled
                    ]}

                    onPress={
                        handleSave
                    }

                    disabled={
                        saving
                    }

                >

                    {
                        saving ? (

                            <ActivityIndicator
                                size="small"
                                color="#FFFFFF"
                            />

                        ) : (

                            <>

                                <Ionicons
                                    name="save-outline"
                                    size={20}
                                    color="#FFFFFF"
                                />

                                <Text style={styles.saveButtonText}>
                                    Save Changes
                                </Text>

                            </>

                        )
                    }

                </TouchableOpacity>


                <TouchableOpacity

                    style={styles.cancelButton}

                    onPress={() =>
                        router.back()
                    }

                    disabled={
                        saving
                    }

                >

                    <Text style={styles.cancelButtonText}>
                        Cancel
                    </Text>

                </TouchableOpacity>


            </ScrollView>

        </KeyboardAvoidingView>

    );
}



const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },

    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
    },

    loadingText: {
        marginTop: 10,
        fontSize: 14,
        color: '#6B7280',
    },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 14,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },

    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },

    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },

    scrollContent: {
        padding: 20,
        paddingBottom: 50,
    },

    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
        marginTop: 10,
        marginBottom: 16,
    },

    label: {
        fontSize: 13,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 7,
    },

    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 14,
        minHeight: 54,
        marginBottom: 16,
    },

    inputIcon: {
        marginRight: 10,
    },

    input: {
        flex: 1,
        fontSize: 15,
        color: '#111827',
        paddingVertical: 12,
    },

    disabledInput: {
        backgroundColor: '#F3F4F6',
    },

    disabledText: {
        color: '#9CA3AF',
    },

    pickerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        minHeight: 54,
        marginBottom: 16,
        overflow: 'hidden',
    },

    pickerIcon: {
        marginLeft: 14,
        marginRight: 4,
    },

    picker: {
        flex: 1,
        color: '#111827',
    },

    locationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0F766E',
        paddingVertical: 14,
        borderRadius: 12,
        marginBottom: 12,
        gap: 8,
    },

    locationButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '600',
    },

    coordinatesBox: {
        backgroundColor: '#ECFDF5',
        borderWidth: 1,
        borderColor: '#A7F3D0',
        borderRadius: 10,
        padding: 10,
        marginBottom: 16,
    },

    coordinatesText: {
        fontSize: 12,
        color: '#065F46',
        marginBottom: 2,
    },

    addressInputContainer: {
        alignItems: 'flex-start',
        paddingTop: 10,
    },

    addressInput: {
        minHeight: 70,
        textAlignVertical: 'top',
    },

    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ff7f00',
        borderRadius: 12,
        paddingVertical: 16,
        marginTop: 15,
        gap: 8,
    },

    saveButtonDisabled: {
        opacity: 0.6,
    },

    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },

    cancelButton: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        marginTop: 8,
    },

    cancelButtonText: {
        color: '#6B7280',
        fontSize: 15,
        fontWeight: '600',
    },

});