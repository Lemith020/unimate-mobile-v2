import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Image, 
  StatusBar 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* උඩ කොටස: ඇප් අයිකන් එක සහ වෙල්කම් ටෙක්ස්ට් එක */}
      <View style={styles.headerContainer}>
        <Image 
          source={require('../assets/unimate_app_icon.jpg')} 
          style={styles.appIcon}
          resizeMode="cover"
        />
        <Text style={styles.title}>Welcome to Unimate App</Text>
        <Text style={styles.subtitle}>Your Ultimate University Companion</Text>
      </View>

      {/* යට කොටස: ලොගින් සහ රෙජිස්ටර් බටන්ස් */}
      <View style={styles.buttonContainer}>
        
        {/* Login Button */}
        <TouchableOpacity 
          style={styles.loginButton} 
          onPress={() => router.push('/login')}
        >
          <Ionicons name="log-in-outline" size={20} color="#fff" style={styles.btnIcon} />
          <Text style={styles.loginButtonText}>Login</Text>
        </TouchableOpacity>

        {/* Register Button */}
        <TouchableOpacity 
          style={styles.registerButton} 
          onPress={() => router.push('/register')}
        >
          <Ionicons name="person-add-outline" size={20} color="#ff7f00" style={styles.btnIcon} />
          <Text style={styles.registerButtonText}>Create Account (Register)</Text>
        </TouchableOpacity>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff8f0', // ලා ඔරේන්ජ් පාට Soft Theme Background එකක්
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 30,
    paddingVertical: 60,
  },
  headerContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  appIcon: {
    width: 110,
    height: 110,
    borderRadius: 25,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#ff7f00',
    shadowColor: '#ff7f00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    gap: 15,
  },
  loginButton: {
    flexDirection: 'row',
    backgroundColor: '#ff7f00', // ඔරේන්ජ් පාට ප්‍රධාන බටන් එක
    paddingVertical: 16,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ff7f00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  btnIcon: {
    marginRight: 10,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  registerButton: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#ff7f00',
    paddingVertical: 16,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerButtonText: {
    color: '#ff7f00',
    fontSize: 16,
    fontWeight: 'bold',
  },
});