import React, { useState, useEffect } from 'react';
import { Picker } from '@react-native-picker/picker';

import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';

import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterScreen() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  const [universityId, setUniversityId] = useState('');
  const [facultyId, setFacultyId] = useState('');

  const [universities, setUniversities] = useState<any[]>([]);
  const [faculties, setFaculties] = useState<any[]>([]);

  const [yearOfStudy, setYearOfStudy] = useState('');
  const [currentAddress, setCurrentAddress] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [secureText, setSecureText] = useState(true);

  // Load all universities when register page opens
  useEffect(() => {
    const loadUniversities = async () => {
      try {
        const response = await fetch(
          'http://10.0.2.2:5000/api/universities'
        );

        const data = await response.json();

        if (response.ok) {
          setUniversities(data);
        } else {
          console.error('Failed to load universities:', data);
        }
      } catch (error) {
        console.error('University load error:', error);
      }
    };

    loadUniversities();
  }, []);

  // Load faculties when a university is selected
  useEffect(() => {
    const loadFaculties = async () => {
      if (!universityId) {
        setFaculties([]);
        setFacultyId('');
        return;
      }

      try {
        const response = await fetch(
          `http://10.0.2.2:5000/api/universities/${universityId}/faculties`
        );

        const data = await response.json();

        if (response.ok) {
          setFaculties(data);
          setFacultyId('');
        } else {
          console.error('Failed to load faculties:', data);
        }
      } catch (error) {
        console.error('Faculty load error:', error);
      }
    };

    loadFaculties();
  }, [universityId]);

  const handleRegister = async () => {
    if (
      !email ||
      !password ||
      !fullName ||
      !phone ||
      !universityId ||
      !facultyId
    ) {
      Alert.alert(
        'Error',
        'Please fill all required fields including University and Faculty'
      );
      return;
    }

    const registrationData = {
      email,
      password,
      full_name: fullName,
      phone,
      university_id: parseInt(universityId),
      faculty_id: parseInt(facultyId),
      year_of_study: yearOfStudy ? parseInt(yearOfStudy) : null,
      current_address: currentAddress || null,
      city: city || null,
      district: district || null,
    };

    try {
      const response = await fetch(
        'http://10.0.2.2:5000/api/auth/register',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(registrationData),
        }
      );

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success', 'Registration Successful!', [
          {
            text: 'OK',
            onPress: () => router.push('/login'),
          },
        ]);
      } else {
        Alert.alert(
          'Error',
          data.error || 'Registration failed'
        );
      }
    } catch (error) {
      console.error(error);

      Alert.alert(
        'Error',
        'Could not connect to backend server.'
      );
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerContainer}>
          <View style={styles.iconCircle}>
            <Ionicons
              name="school"
              size={40}
              color="#eb920b"
            />
          </View>

          <Text style={styles.title}>
            Create Account
          </Text>

          <Text style={styles.subtitle}>
            Join Unimate Student Portal
          </Text>
        </View>

        <View style={styles.formContainer}>

          {/* Full Name */}
          <View style={styles.inputBox}>
            <Ionicons
              name="person-outline"
              size={20}
              color="#ff7f00"
              style={styles.inputIcon}
            />

            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor="#999"
              value={fullName}
              onChangeText={setFullName}
            />
          </View>

          {/* Email */}
          <View style={styles.inputBox}>
            <Ionicons
              name="mail-outline"
              size={20}
              color="#ff7f00"
              style={styles.inputIcon}
            />

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          {/* Password */}
          <View style={styles.inputBox}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color="#ff7f00"
              style={styles.inputIcon}
            />

            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#999"
              secureTextEntry={secureText}
              value={password}
              onChangeText={setPassword}
            />

            <TouchableOpacity
              onPress={() =>
                setSecureText(!secureText)
              }
            >
              <Ionicons
                name={
                  secureText
                    ? 'eye-off-outline'
                    : 'eye-outline'
                }
                size={20}
                color="#777"
              />
            </TouchableOpacity>
          </View>

          {/* Phone */}
          <View style={styles.inputBox}>
            <Ionicons
              name="call-outline"
              size={20}
              color="#ff7f00"
              style={styles.inputIcon}
            />

            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              placeholderTextColor="#999"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
          </View>

          {/* University Dropdown */}
          <View style={styles.inputBox}>
            <Ionicons
              name="school-outline"
              size={20}
              color="#e17911"
              style={styles.inputIcon}
            />

            <Picker
              selectedValue={universityId}
              onValueChange={(value) => {
                setUniversityId(String(value));
              }}
              style={styles.picker}
            >
              <Picker.Item
                label="Select University"
                value=""
                enabled={false}
              />

              {universities.map((university) => (
                <Picker.Item
                  key={university.id}
                  label={university.name}
                  value={String(university.id)}
                />
              ))}
            </Picker>
          </View>

          {/* Faculty Dropdown */}
          <View style={styles.inputBox}>
            <Ionicons
              name="book-outline"
              size={20}
              color="#ff7f00"
              style={styles.inputIcon}
            />

            <Picker
              selectedValue={facultyId}
              onValueChange={(value) => {
                setFacultyId(String(value));
              }}
              enabled={!!universityId}
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

              {faculties.map((faculty) => (
                <Picker.Item
                  key={faculty.id}
                  label={faculty.name}
                  value={String(faculty.id)}
                />
              ))}
            </Picker>
          </View>

          {/* Year of Study */}
          <View style={styles.inputBox}>
            <Ionicons
              name="calendar-outline"
              size={20}
              color="#ff7f00"
              style={styles.inputIcon}
            />

            <TextInput
              style={styles.input}
              placeholder="Year of Study (e.g., 2)"
              placeholderTextColor="#999"
              keyboardType="numeric"
              value={yearOfStudy}
              onChangeText={setYearOfStudy}
            />
          </View>

          {/* Current Address */}
          <View style={styles.inputBox}>
            <Ionicons
              name="home-outline"
              size={20}
              color="#ff7f00"
              style={styles.inputIcon}
            />

            <TextInput
              style={styles.input}
              placeholder="Current Address"
              placeholderTextColor="#8c8c8c"
              value={currentAddress}
              onChangeText={setCurrentAddress}
            />
          </View>

          {/* City & District */}
          <View style={styles.rowContainer}>
            <View
              style={[
                styles.inputBox,
                {
                  flex: 1,
                  marginRight: 8,
                },
              ]}
            >
              <TextInput
                style={styles.input}
                placeholder="City"
                placeholderTextColor="#999"
                value={city}
                onChangeText={setCity}
              />
            </View>

            <View
              style={[
                styles.inputBox,
                {
                  flex: 1,
                  marginLeft: 8,
                },
              ]}
            >
              <TextInput
                style={styles.input}
                placeholder="District"
                placeholderTextColor="#999"
                value={district}
                onChangeText={setDistrict}
              />
            </View>
          </View>

          {/* Register Button */}
          <TouchableOpacity
            style={styles.registerButton}
            onPress={handleRegister}
          >
            <Text style={styles.registerButtonText}>
              Register
            </Text>
          </TouchableOpacity>

          {/* Login Link */}
          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>
              Already have an account?{' '}
            </Text>

            <TouchableOpacity
              onPress={() => router.push('/login')}
            >
              <Text style={styles.loginLink}>
                Login
              </Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#d6ac9b',
  },

  scrollContainer: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },

  headerContainer: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },

  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ffe5cc',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },

  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },

  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },

  formContainer: {
    width: '100%',
  },

  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ffd1a4',
    borderRadius: 12,
    paddingHorizontal: 15,
    minHeight: 55,
    marginBottom: 15,
    shadowColor: '#ff7f00',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  inputIcon: {
    marginRight: 10,
  },

  input: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },

  picker: {
    flex: 1,
    color: '#333',
  },

  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  registerButton: {
    backgroundColor: '#ff7f00',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#ff7f00',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },

  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 25,
    marginBottom: 20,
  },

  footerText: {
    color: '#666',
    fontSize: 14,
  },

  loginLink: {
    color: '#ff7f00',
    fontSize: 14,
    fontWeight: 'bold',
  },
});