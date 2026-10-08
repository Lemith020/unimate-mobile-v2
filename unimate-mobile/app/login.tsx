import AsyncStorage from '@react-native-async-storage/async-storage'; // උඩින්ම මේක දාන්න
import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    StatusBar,
    Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
    const router = useRouter();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter both email and password');
            return;
        }

        try {
            
            const response = await fetch('http://10.0.2.2:5000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

if (response.ok) {
               // බෑක්එන්ඩ් එකෙන් එන සම්පූර්ණ user සහ profile ඩේටා ටික AsyncStorage එකේ save කරනවා
               await AsyncStorage.setItem('userData', JSON.stringify(data.user));

                Alert.alert('Success', 'Login Successful!', [
                    { text: 'OK', onPress: () => router.replace('/home_page') }
                ]);
            } else {
                
                Alert.alert('Error', data.error || 'Invalid email or password');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Could not connect to backend server.');
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.title}>Welcome Back!</Text>
                <Text style={styles.subtitle}>Log in to continue to Unimate</Text>
            </View>

            {/* Form Container */}
            <View style={styles.formContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor="#888"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                />

                <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#888"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                />

                <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
                    <Text style={styles.loginButtonText}>Login</Text>
                </TouchableOpacity>
            </View>

            {/* Register Link Footer */}
            <View style={styles.footer}>
                <Text style={styles.footerText}>Don't have an account? </Text>
                <TouchableOpacity onPress={() => router.push('/register')}>
                    <Text style={styles.registerLink}>Register</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff8f0',
        padding: 30,
        justifyContent: 'center',
    },
    header: {
        marginBottom: 30,
    },
    backButton: {
        marginBottom: 15,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        marginTop: 5,
    },
    formContainer: {
        gap: 15,
    },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 12,
        fontSize: 15,
        color: '#333',
    },
    loginButton: {
        backgroundColor: '#ff7f00',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
        shadowColor: '#ff7f00',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 4,
    },
    loginButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 30,
    },
    footerText: {
        color: '#666',
        fontSize: 14,
    },
    registerLink: {
        color: '#ff7f00',
        fontSize: 14,
        fontWeight: 'bold',
    },
});