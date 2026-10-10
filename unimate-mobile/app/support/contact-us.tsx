import React from 'react';
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

const ORANGE = '#EA580C';
const EMAIL = 'lemithnanditha41@gmail.com';
const WHATSAPP_NUMBER = '94768092970';
const CALL_NUMBER = '+94750575923';
const FACEBOOK_URL = 'https://www.facebook.com/share/1DZQzZEMcB/';
// Add your Instagram profile URL here when it is available.
const INSTAGRAM_URL: string = '';

type ContactItem = {
  title: string;
  detail: string;
  caption: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  color: string;
  tint: string;
  url: string;
};

const CONTACTS: ContactItem[] = [
  {
    title: 'Email us',
    detail: EMAIL,
    caption: 'For questions, ideas & a little help',
    icon: 'gmail',
    color: '#EA4335',
    tint: '#FEF2F2',
    url: `mailto:${EMAIL}?subject=${encodeURIComponent('Unimate support')}`,
  },
  {
    title: 'WhatsApp',
    detail: '+94 76 809 2970',
    caption: 'Start a friendly conversation',
    icon: 'whatsapp',
    color: '#16A34A',
    tint: '#DCFCE7',
    url: `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hi Unimate! I need some help.')}`,
  },
  {
    title: 'Call us',
    detail: '+94 75 057 5923',
    caption: 'Prefer to talk? Give us a call',
    icon: 'phone',
    color: '#2563EB',
    tint: '#DBEAFE',
    url: `tel:${CALL_NUMBER}`,
  },
];

export default function ContactUsScreen() {
  const router = useRouter();

  const openContact = async (url: string, title: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert(
        `Unable to open ${title}`,
        'Please check that a suitable app is installed on your phone and try again.',
      );
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom', 'left', 'right']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => router.canGoBack() ? router.back() : router.replace('/')}
        >
          <Ionicons name="arrow-back" size={22} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contact us</Text>
        <View style={styles.headerIcon}>
          <MaterialCommunityIcons name="headset" size={24} color={ORANGE} />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.intro}>
          <View style={styles.introIcon}>
            <MaterialCommunityIcons name="chat-processing-outline" size={34} color={ORANGE} />
          </View>
          <Text style={styles.introBadge}>LET'S TALK</Text>
          <Text style={styles.introTitle}>We're here to help</Text>
          <Text style={styles.introDescription}>
            Reach out to us any time. We usually reply within a day or two.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Get in touch</Text>

        {CONTACTS.map((item) => (
          <TouchableOpacity
            key={item.title}
            style={styles.contactCard}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel={`${item.title}, ${item.detail}`}
            onPress={() => openContact(item.url, item.title)}
          >
            <View style={styles.contactTop}>
              <View style={[styles.contactIcon, { backgroundColor: item.tint }]}>
                <MaterialCommunityIcons name={item.icon} size={27} color={item.color} />
              </View>
              <View style={styles.contactHeading}>
                <Text style={styles.contactTitle}>{item.title}</Text>
                <Text style={styles.contactCaption}>{item.caption}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
            </View>
            <Text selectable style={styles.contactDetail}>{item.detail}</Text>
          </TouchableOpacity>
        ))}

        <View style={styles.hoursCard}>
          <View style={styles.hoursIcon}>
            <Ionicons name="time-outline" size={23} color={ORANGE} />
          </View>
          <View style={styles.hoursText}>
            <Text style={styles.hoursTitle}>Support hours</Text>
            <Text style={styles.hoursDays}>Monday to Friday</Text>
            <Text style={styles.hoursTime}>9:00 AM – 5:00 PM</Text>
            <Text style={styles.hoursTimezone}>Sri Lanka time</Text>
          </View>
        </View>

        <View style={styles.socialSection}>
          <Text style={styles.socialTitle}>Follow us</Text>
          <Text style={styles.socialDescription}>Stay connected with your campus companion.</Text>
          <View style={styles.socialButtons}>
            <TouchableOpacity
              style={styles.socialButton}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Open Facebook profile"
              onPress={() => openContact(FACEBOOK_URL, 'Facebook')}
            >
              <View style={[styles.socialIcon, { backgroundColor: '#EFF6FF' }]}>
                <MaterialCommunityIcons name="facebook" size={30} color="#1877F2" />
              </View>
              <Text style={styles.socialLabel}>Facebook</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.socialButton, !INSTAGRAM_URL && styles.socialUnavailable]}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={INSTAGRAM_URL ? 'Open Instagram profile' : 'Instagram coming soon'}
              disabled={!INSTAGRAM_URL}
              accessibilityState={{ disabled: !INSTAGRAM_URL }}
              onPress={() => openContact(INSTAGRAM_URL, 'Instagram')}
            >
              <View style={[styles.socialIcon, { backgroundColor: '#FDF2F8' }]}>
                <MaterialCommunityIcons name="instagram" size={30} color="#E1306C" />
              </View>
              <Text style={styles.socialLabel}>Instagram</Text>
              {!INSTAGRAM_URL && <Text style={styles.comingSoon}>Coming soon</Text>}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <Ionicons name="heart" size={14} color={ORANGE} />
          <Text style={styles.footerText}>A little support for your campus journey</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFAF5' },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20,
    paddingVertical: 14, backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: '#F3EAE1',
  },
  backButton: {
    width: 44, height: 44, borderRadius: 14, backgroundColor: '#F9FAFB',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: '700', color: '#111827', marginHorizontal: 12 },
  headerIcon: {
    width: 44, height: 44, borderRadius: 14, backgroundColor: '#FFF7ED',
    alignItems: 'center', justifyContent: 'center',
  },
  content: { padding: 20, paddingBottom: 32, width: '100%', maxWidth: 600, alignSelf: 'center' },
  intro: { alignItems: 'center', padding: 22, backgroundColor: '#FFEDD5', borderWidth: 1, borderColor: '#FED7AA', borderRadius: 24, marginBottom: 26 },
  introIcon: { width: 70, height: 70, borderRadius: 23, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  introBadge: { color: ORANGE, fontSize: 10, fontWeight: '800', letterSpacing: 1.6 },
  introTitle: { fontSize: 26, fontWeight: '800', color: '#7C2D12', textAlign: 'center', marginTop: 10 },
  introDescription: { fontSize: 14, lineHeight: 22, color: '#9A3412', textAlign: 'center', marginTop: 12, maxWidth: 280 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#1F2937', marginBottom: 14 },
  contactCard: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#F0E7DE', borderRadius: 18, padding: 16, marginBottom: 14 },
  contactTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  contactIcon: { width: 48, height: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  contactHeading: { flex: 1 },
  contactTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  contactCaption: { fontSize: 12, lineHeight: 18, color: '#9CA3AF', marginTop: 4 },
  contactDetail: { fontSize: 14, lineHeight: 22, fontWeight: '500', color: '#57534E', marginTop: 14 },
  hoursCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, borderRadius: 18, backgroundColor: '#FFF1E4', padding: 20, marginTop: 10 },
  hoursIcon: { width: 44, height: 44, borderRadius: 13, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  hoursText: { flex: 1 },
  hoursTitle: { fontSize: 16, fontWeight: '700', color: '#7C2D12', marginBottom: 8 },
  hoursDays: { fontSize: 14, color: '#9A3412', lineHeight: 22 },
  hoursTime: { fontSize: 14, color: '#9A3412', lineHeight: 22, fontWeight: '600' },
  hoursTimezone: { fontSize: 11, color: '#B45309', marginTop: 6 },
  socialSection: { marginTop: 30, alignItems: 'center' },
  socialTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  socialDescription: { fontSize: 13, lineHeight: 20, color: '#9CA3AF', textAlign: 'center', marginTop: 8 },
  socialButtons: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 18, marginTop: 20 },
  socialButton: { alignItems: 'center', padding: 8, minWidth: 92 },
  socialIcon: { width: 58, height: 58, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  socialLabel: { fontSize: 13, fontWeight: '600', color: '#57534E', marginTop: 9 },
  socialUnavailable: { opacity: 0.55 },
  comingSoon: { fontSize: 10, color: '#78716C', marginTop: 4 },
  footer: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 28 },
  footerText: { fontSize: 12, color: '#9CA3AF', textAlign: 'center' },
});
