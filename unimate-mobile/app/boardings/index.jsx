import React, {
    useCallback,
    useState
} from 'react';

import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    RefreshControl,
    Alert
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import AsyncStorage from '@react-native-async-storage/async-storage';

import {
    useFocusEffect,
    useRouter
} from 'expo-router';

import BoardingListCard
    from '../../component/home_page/boardings/BoardingListCard';


export default function BoardingsScreen() {

    const router = useRouter();

    const [boardings, setBoardings] = useState([]);

    const [loading, setLoading] = useState(true);

    const [refreshing, setRefreshing] = useState(false);

    const [universityName, setUniversityName] =
        useState('Your University');


    const loadBoardings = async (isRefresh = false) => {

        try {

            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }


            const storedUser =
                await AsyncStorage.getItem('userData');


            if (!storedUser) {

                Alert.alert(
                    'Error',
                    'Logged user data not found'
                );

                setBoardings([]);

                return;
            }


            const parsedUser =
                JSON.parse(storedUser);


            const profile =
                parsedUser?.profile;


            const universityId =
                profile?.university_id;


            if (!universityId) {

                Alert.alert(
                    'University Required',
                    'Please select your university from your profile first.'
                );

                setBoardings([]);

                return;
            }


            setUniversityName(
                profile?.university_name ||
                'Your University'
            );


            const response = await fetch(
                `http://10.0.2.2:5000/api/boardings/university/${universityId}`
            );


            const responseText =
                await response.text();


            let data;


            try {

                data =
                    JSON.parse(responseText);

            } catch (error) {

                console.error(
                    'Boarding API returned non JSON:',
                    responseText
                );


                Alert.alert(
                    'Server Error',
                    'Invalid response from server'
                );

                return;
            }


            if (!response.ok) {

                Alert.alert(
                    'Error',
                    data.error ||
                    'Failed to load boardings'
                );

                return;
            }


            setBoardings(
                data.boardings || []
            );


        } catch (error) {

            console.error(
                'Load boardings error:',
                error
            );


            Alert.alert(
                'Connection Error',
                'Could not connect to the server'
            );


        } finally {

            setLoading(false);

            setRefreshing(false);

        }

    };


    useFocusEffect(

        useCallback(() => {

            loadBoardings();

        }, [])

    );


    const handleBoardingPress = (boarding) => {

        router.push(
            `/boardings/${boarding.id}`
        );

    };


    if (loading) {

        return (

            <View style={styles.loadingContainer}>

                <ActivityIndicator
                    size="large"
                    color="#F97316"
                />

                <Text style={styles.loadingText}>
                    Loading boardings...
                </Text>

            </View>

        );

    }


    return (

        <View style={styles.container}>


            <View style={styles.header}>

                <TouchableOpacity

                    style={styles.backButton}

                    onPress={() =>
                        router.back()
                    }

                >

                    <Ionicons
                        name="arrow-back"
                        size={24}
                        color="#111827"
                    />

                </TouchableOpacity>


                <View style={styles.headerTextContainer}>

                    <Text style={styles.headerTitle}>
                        Boardings
                    </Text>

                    <Text
                        style={styles.headerSubtitle}
                        numberOfLines={1}
                    >
                        Near {universityName}
                    </Text>

                </View>


                <View style={{ width: 40 }} />

            </View>


            <ScrollView

                style={styles.scrollView}

                contentContainerStyle={
                    styles.scrollContent
                }

                showsVerticalScrollIndicator={false}

                refreshControl={

                    <RefreshControl

                        refreshing={refreshing}

                        onRefresh={() =>
                            loadBoardings(true)
                        }

                    />

                }

            >


                <Text style={styles.resultText}>

                    {boardings.length} boardings found

                </Text>


                {
                    boardings.length === 0
                        ? (

                            <View style={styles.emptyContainer}>

                                <Ionicons
                                    name="home-outline"
                                    size={60}
                                    color="#D1D5DB"
                                />

                                <Text style={styles.emptyTitle}>
                                    No Boardings Found
                                </Text>

                                <Text style={styles.emptyText}>
                                    No boardings are currently available for your university.
                                </Text>

                            </View>

                        )
                        : (

                            boardings.map(
                                (boarding) => (

                                    <BoardingListCard

                                        key={boarding.id}

                                        boarding={boarding}

                                        onPress={() =>
                                            handleBoardingPress(
                                                boarding
                                            )
                                        }

                                    />

                                )
                            )

                        )
                }

            </ScrollView>

        </View>

    );

}


const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },

    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
    },

    loadingText: {
        marginTop: 10,
        color: '#6B7280',
        fontSize: 14,
    },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingTop: 45,
        paddingBottom: 15,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },

    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },

    headerTextContainer: {
        flex: 1,
        alignItems: 'center',
    },

    headerTitle: {
        fontSize: 19,
        fontWeight: 'bold',
        color: '#111827',
    },

    headerSubtitle: {
        marginTop: 2,
        fontSize: 11,
        color: '#6B7280',
        maxWidth: 240,
    },

    scrollView: {
        flex: 1,
    },

    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },

    resultText: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '500',
        marginBottom: 14,
    },

    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 90,
        paddingHorizontal: 30,
    },

    emptyTitle: {
        marginTop: 15,
        fontSize: 18,
        fontWeight: 'bold',
        color: '#374151',
    },

    emptyText: {
        marginTop: 7,
        fontSize: 13,
        color: '#9CA3AF',
        textAlign: 'center',
        lineHeight: 19,
    },

});