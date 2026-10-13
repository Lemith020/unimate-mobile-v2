import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const emergencyServices = [
  {
    title: 'Police Emergency',
    subtitle: 'Police assistance',
    icon: 'shield-checkmark-outline',
    numbers: ['119'],
  },
  {
    title: 'National Help Desk',
    subtitle: 'Public security assistance',
    icon: 'headset-outline',
    numbers: ['118'],
  },
  {
    title: 'Suwa Seriya Ambulance',
    subtitle: 'Toll-free emergency ambulance',
    icon: 'medkit-outline',
    numbers: ['1990'],
  },
  {
    title: 'Fire & Rescue',
    subtitle: 'Fire and rescue assistance',
    icon: 'flame-outline',
    numbers: ['110', '111'],
  },
  {
    title: 'Disaster Management',
    subtitle: 'Disaster emergency assistance',
    icon: 'warning-outline',
    numbers: ['117'],
  },
];

export default function EmergencyStrip() {
  const openDialer = async (number) => {
    try {
      await Linking.openURL(`tel:${number}`);
    } catch {
      Alert.alert(
        'Unable to open dialer',
        `Please call ${number} using your phone app.`
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons
            name="alert-circle-outline"
            size={25}
            color="#DC2626"
          />
        </View>

        <View style={styles.headerContent}>
          <Text style={styles.heading}>Emergency contacts</Text>
          <Text style={styles.description}>
            Tap a number to open your phone dialer.
          </Text>
        </View>
      </View>

      {emergencyServices.map((service, index) => (
        <View
          key={service.title}
          style={[
            styles.row,
            index === emergencyServices.length - 1 && styles.lastRow,
          ]}
        >
          <View style={styles.serviceIcon}>
            <Ionicons
              name={service.icon}
              size={22}
              color="#EA580C"
            />
          </View>

          <View style={styles.serviceContent}>
            <Text style={styles.serviceTitle}>
              {service.title}
            </Text>

            <Text style={styles.serviceSubtitle}>
              {service.subtitle}
            </Text>
          </View>

          <View style={styles.numberButtons}>
            {service.numbers.map((number) => (
              <TouchableOpacity
                key={number}
                style={styles.callButton}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel={`Open dialer for ${service.title}, ${number}`}
                onPress={() => openDialer(number)}
              >
                <Ionicons
                  name="call"
                  size={13}
                  color="#FFFFFF"
                />

                <Text style={styles.callButtonText}>
                  {number}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginVertical: 12,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  heading: {
    fontSize: 17,
    fontWeight: '700',
    color: '#431407',
  },
  description: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    color: '#78716C',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#FFF1E6',
  },
  lastRow: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  serviceIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  serviceContent: {
    flex: 1,
    minWidth: 130,
  },
  serviceTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#292524',
  },
  serviceSubtitle: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 16,
    color: '#78716C',
  },
  numberButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginLeft: 8,
  },
  callButton: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: '#EA580C',
    borderRadius: 10,
  },
  callButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});