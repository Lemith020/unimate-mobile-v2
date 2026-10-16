import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

export default function MenuHeader({
  fullName,
  onPressProfile,
}) {
  return (
    <TouchableOpacity
      style={styles.headerContainer}
      onPress={onPressProfile}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel="Open profile"
    >
      <View style={styles.avatarContainer}>
        <Image
          source={require('../../../assets/about_us_page_developers_photos/lemith.png')}
          style={styles.avatar}
          resizeMode="cover"
        />
      </View>

      <Text style={styles.name}>
        {fullName || 'Student'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    padding: 20,
    backgroundColor: '#E6F4F1',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    elevation: 2,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
});