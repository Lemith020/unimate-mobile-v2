import React from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

const ORANGE = '#EA580C';
const APP_ICON = require('../../assets/unimate_app_icon.jpg');
// Put your photo here as lemith.jpg, or change this exact filename.
// Keep the real image extension: use lemith.png here if your photo is PNG.
const DEVELOPER_PHOTO = require('../../assets/about_us_page_developers_photos/lemith.jpg');

type Feature = {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  tint: string;
  color: string;
};

const FEATURES: Feature[] = [
  { label: 'Boardings', icon: 'home-outline', tint: '#DBEAFE', color: '#2563EB' },
  { label: 'Food', icon: 'restaurant-outline', tint: '#FFEDD5', color: ORANGE },
  { label: 'Health', icon: 'medkit-outline', tint: '#DCFCE7', color: '#15803D' },
  { label: 'Transport', icon: 'bus-outline', tint: '#EDE9FE', color: '#7C3AED' },
  { label: 'Marketplace', icon: 'cart-outline', tint: '#FEF3C7', color: '#B45309' },
  { label: 'Services', icon: 'location-outline', tint: '#CCFBF1', color: '#0F766E' },
];

export default function AboutScreen() {
  const router = useRouter();

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
        <Text style={styles.headerTitle}>About Unimate</Text>
        <View style={styles.headerIcon}>
          <Ionicons name="information-circle-outline" size={24} color={ORANGE} />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.appIconFrame}>
            <Image source={APP_ICON} style={styles.appIcon} resizeMode="contain" accessibilityLabel="Unimate app icon" />
          </View>
          <Text style={styles.appName}>Unimate</Text>
          <Text style={styles.tagline}>Your campus companion.</Text>
          <View style={styles.heroBadge}>
            <Ionicons name="school-outline" size={15} color={ORANGE} />
            <Text style={styles.heroBadgeText}>Built by a student, for students</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Campus life, in one place</Text>
          <Text style={styles.paragraph}>
            Unimate brings everyday university needs together in one place. Discover boardings, food shops, pharmacies, health centers, transport options and a marketplace—all around your campus.
          </Text>
          <View style={styles.featureGrid}>
            {FEATURES.map((feature) => (
              <View key={feature.label} style={styles.feature}>
                <View style={[styles.featureIcon, { backgroundColor: feature.tint }]}>
                  <Ionicons name={feature.icon} size={23} color={feature.color} />
                </View>
                <Text style={styles.featureLabel}>{feature.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.purposeCard}>
          <View style={styles.purposeHeading}>
            <View style={styles.purposeIcon}>
              <Ionicons name="bulb-outline" size={23} color={ORANGE} />
            </View>
            <Text style={styles.purposeTitle}>Our purpose</Text>
          </View>
          <Text style={styles.purposeText}>
            University life should be easier to navigate. Unimate helps students find useful places, explore nearby services and stay connected with their campus community.
          </Text>
          <Text style={styles.purposeClosing}>
            One simple idea. A more convenient campus life.
          </Text>
        </View>

        <View style={styles.developerHeading}>
          <Text style={styles.sectionTitle}>Meet the developer</Text>
          <Text style={styles.sectionSubtitle}>The person behind your campus companion</Text>
        </View>

        <View style={styles.developerCard}>
          <View style={styles.developerBanner} />
          <View style={styles.photoFrame}>
            <Image source={DEVELOPER_PHOTO} style={styles.developerPhoto} resizeMode="cover" accessibilityLabel="Lemith, creator and developer of Unimate" />
          </View>
          <Text style={styles.developerName}>Lemith</Text>
          <View style={styles.roleBadge}>
            <Ionicons name="code-slash-outline" size={15} color={ORANGE} />
            <Text style={styles.roleText}>Creator & Developer</Text>
          </View>
          <Text style={styles.degree}>BSc (Hons) in Software Engineering Undergraduate</Text>
          <View style={styles.universityRow}>
            <Ionicons name="school-outline" size={16} color="#78716C" />
            <Text style={styles.university}>University of Kelaniya</Text>
          </View>
          <View style={styles.divider} />
          <Text style={styles.developerBio}>
            Hi, I'm Lemith, the developer behind Unimate. As a university student, I understand how useful it is to have everyday campus information in one place. I'm building Unimate to help students explore their surroundings and manage daily needs more easily.
          </Text>
        </View>

        <View style={styles.helpCard}>
          <Ionicons name="chatbubbles-outline" size={28} color={ORANGE} />
          <Text style={styles.helpTitle}>Help shape Unimate</Text>
          <Text style={styles.helpDescription}>
            Your experience matters. Share your ideas, suggest a feature or report a problem to help make Unimate better for everyone.
          </Text>
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
              activeOpacity={0.8}
              accessibilityRole="button"
              onPress={() => router.push('/support/feedback')}
            >
              <Ionicons name="paper-plane-outline" size={17} color="#FFFFFF" />
              <Text style={styles.primaryText}>Send feedback</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              activeOpacity={0.8}
              accessibilityRole="button"
              onPress={() => router.push('/support/contact-us')}
            >
              <Ionicons name="call-outline" size={17} color={ORANGE} />
              <Text style={styles.secondaryText}>Contact us</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <Ionicons name="heart" size={14} color={ORANGE} />
          <Text style={styles.footerText}>Made with care for the campus community</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFAF5' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F3EAE1' },
  backButton: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: '700', color: '#111827', marginHorizontal: 12 },
  headerIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#FFF7ED', alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, paddingBottom: 32, width: '100%', maxWidth: 650, alignSelf: 'center' },
  hero: { alignItems: 'center', paddingVertical: 26 },
  appIconFrame: { width: 106, height: 106, borderRadius: 28, padding: 6, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#FED7AA' },
  appIcon: { width: '100%', height: '100%', borderRadius: 22 },
  appName: { fontSize: 34, fontWeight: '800', color: '#7C2D12', marginTop: 16 },
  tagline: { fontSize: 15, color: '#78716C', marginTop: 6 },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#FFEDD5', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 9, marginTop: 18, maxWidth: '100%' },
  heroBadgeText: { flexShrink: 1, fontSize: 12, fontWeight: '600', color: ORANGE },
  card: { borderRadius: 22, padding: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#F0E7DE', marginBottom: 18 },
  sectionTitle: { fontSize: 19, fontWeight: '700', color: '#1F2937' },
  paragraph: { fontSize: 14, lineHeight: 23, color: '#78716C', marginTop: 12 },
  featureGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 22 },
  feature: { width: '33.333%', alignItems: 'center', paddingHorizontal: 3, marginBottom: 18 },
  featureIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  featureLabel: { fontSize: 12, color: '#57534E', fontWeight: '500', textAlign: 'center', marginTop: 8 },
  purposeCard: { backgroundColor: '#FFEDD5', borderRadius: 22, padding: 20, borderWidth: 1, borderColor: '#FED7AA' },
  purposeHeading: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  purposeIcon: { width: 42, height: 42, borderRadius: 13, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  purposeTitle: { flex: 1, fontSize: 19, fontWeight: '700', color: '#7C2D12' },
  purposeText: { fontSize: 14, lineHeight: 23, color: '#9A3412', marginTop: 14 },
  purposeClosing: { fontSize: 13, lineHeight: 21, fontWeight: '600', color: '#9A3412', marginTop: 14 },
  developerHeading: { marginTop: 30, marginBottom: 16 },
  sectionSubtitle: { fontSize: 12, lineHeight: 19, color: '#9CA3AF', marginTop: 6 },
  developerCard: { backgroundColor: '#FFFFFF', borderRadius: 24, borderWidth: 1, borderColor: '#F0E7DE', overflow: 'hidden', alignItems: 'center', paddingBottom: 24 },
  developerBanner: { height: 90, width: '100%', backgroundColor: '#FED7AA' },
  photoFrame: { width: 116, height: 116, borderRadius: 58, backgroundColor: '#FFFFFF', padding: 5, marginTop: -54 },
  developerPhoto: { width: '100%', height: '100%', borderRadius: 53 },
  developerName: { fontSize: 25, fontWeight: '800', color: '#1F2937', marginTop: 12 },
  roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFF7ED', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, marginTop: 10 },
  roleText: { fontSize: 12, fontWeight: '600', color: ORANGE },
  degree: { fontSize: 13, lineHeight: 21, color: '#78716C', textAlign: 'center', marginTop: 16, paddingHorizontal: 28 },
  universityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 8, paddingHorizontal: 20 },
  university: { flexShrink: 1, fontSize: 13, color: '#57534E', fontWeight: '500', textAlign: 'center' },
  divider: { height: 1, backgroundColor: '#F3F4F6', alignSelf: 'stretch', marginHorizontal: 24, marginVertical: 20 },
  developerBio: { fontSize: 14, lineHeight: 23, color: '#78716C', paddingHorizontal: 24 },
  helpCard: { alignItems: 'center', backgroundColor: '#FFF1E4', borderRadius: 22, padding: 22, marginTop: 24, borderWidth: 1, borderColor: '#FED7AA' },
  helpTitle: { fontSize: 21, fontWeight: '700', color: '#7C2D12', textAlign: 'center', marginTop: 12 },
  helpDescription: { fontSize: 14, lineHeight: 22, color: '#9A3412', textAlign: 'center', marginTop: 10 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 20, width: '100%' },
  actionButton: { flexGrow: 1, flexBasis: 130, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 14, borderRadius: 12, minHeight: 48 },
  primaryButton: { backgroundColor: ORANGE },
  secondaryButton: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#FDBA74' },
  primaryText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  secondaryText: { fontSize: 13, fontWeight: '700', color: ORANGE },
  footer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 26 },
  footerText: { fontSize: 12, color: '#9CA3AF', textAlign: 'center' },
});
