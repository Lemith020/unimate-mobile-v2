import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

const ORANGE = '#EA580C';
const MAX_LENGTH = 500;
// Replace this with your authentication state when connecting login.
const IS_GUEST = true;
// This page previews the form and animation. It does not send/store feedback.
// Connect your backend before using this as a live submission form.
const RATING_LABELS = ['', 'Needs work', 'Could be better', 'Good', 'Great', 'Love it!'];

export default function FeedbackScreen() {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [showThankYou, setShowThankYou] = useState(false);
  const popupOpacity = useRef(new Animated.Value(0)).current;
  const popupScale = useRef(new Animated.Value(0.8)).current;
  const checkScale = useRef(new Animated.Value(0)).current;
  const submitting = useRef(false);

  const clearForm = useCallback(() => {
    setRating(0);
    setFeedback('');
    setEmail('');
    setError('');
    submitting.current = false;
  }, []);

  // Animate in, pause, then fade away. Clear only after the popup closes.
  useEffect(() => {
    if (!showThankYou) return;

    popupOpacity.setValue(0);
    popupScale.setValue(0.8);
    checkScale.setValue(0);

    const animation = Animated.sequence([
      Animated.parallel([
        Animated.timing(popupOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(popupScale, { toValue: 1, friction: 6, useNativeDriver: true }),
      ]),
      Animated.spring(checkScale, { toValue: 1, friction: 5, useNativeDriver: true }),
      Animated.delay(1800),
      Animated.parallel([
        Animated.timing(popupOpacity, { toValue: 0, duration: 220, useNativeDriver: true }),
        Animated.timing(popupScale, { toValue: 0.94, duration: 220, useNativeDriver: true }),
      ]),
    ]);

    animation.start(({ finished }) => {
      if (finished) {
        setShowThankYou(false);
        clearForm();
      }
    });

    return () => animation.stop();
  }, [showThankYou, popupOpacity, popupScale, checkScale, clearForm]);

  const handleSendFeedback = () => {
    if (submitting.current) return;

    if (!rating) {
      setError('Please choose a star rating.');
      return;
    }
    if (!feedback.trim()) {
      setError('Please write your feedback first.');
      return;
    }
    if (IS_GUEST && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    // Preview only. For a live app, await a successful backend response here
    // before showing the popup. Keep the form values if sending fails.
    submitting.current = true;
    setError('');
    Keyboard.dismiss();
    setShowThankYou(true);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom', 'left', 'right']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => router.canGoBack() ? router.back() : router.replace('/')}
        >
          <Ionicons name="arrow-back" size={22} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Send feedback</Text>
        <View style={styles.headerIcon}>
          <Ionicons name="chatbubble-ellipses-outline" size={22} color={ORANGE} />
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.body}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.intro}>
            <View style={styles.introIcon}>
              <Ionicons name="heart-outline" size={30} color={ORANGE} />
            </View>
            <Text style={styles.introTitle}>We'd love to hear from you</Text>
            <Text style={styles.introDescription}>
              Tell us what you like and what we can make better.
            </Text>
          </View>

          <View style={styles.ratingCard}>
            <Text style={styles.ratingTitle}>How would you rate Unimate?</Text>
            <View style={styles.stars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  style={styles.starButton}
                  activeOpacity={0.6}
                  accessibilityRole="button"
                  accessibilityLabel={`Rate ${star} out of 5 stars`}
                  accessibilityState={{ selected: rating === star }}
                  onPress={() => { setRating(star); setError(''); }}
                >
                  <Ionicons
                    name={star <= rating ? 'star' : 'star-outline'}
                    size={34}
                    color={star <= rating ? '#F59E0B' : '#D1D5DB'}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.ratingHint, rating > 0 && styles.selectedRating]}>
              {rating ? RATING_LABELS[rating] : 'Tap a star to share your experience'}
            </Text>
          </View>

          <Text style={styles.label}>Your feedback</Text>
          <TextInput
            style={styles.feedbackInput}
            placeholder="Write your feedback here…"
            placeholderTextColor="#9CA3AF"
            accessibilityLabel="Your feedback"
            multiline
            textAlignVertical="top"
            maxLength={MAX_LENGTH}
            value={feedback}
            onChangeText={(value) => { setFeedback(value); setError(''); }}
          />
          <Text style={styles.counter}>{feedback.length} / {MAX_LENGTH}</Text>

          {IS_GUEST && (
            <View style={styles.emailSection}>
              <Text style={styles.label}>
                Your email <Text style={styles.optionalLabel}>(guests only)</Text>
              </Text>
              <View style={styles.emailInputContainer}>
                <Ionicons name="mail-outline" size={20} color="#9CA3AF" />
                <TextInput
                  style={styles.emailInput}
                  placeholder="name@example.com"
                  placeholderTextColor="#9CA3AF"
                  accessibilityLabel="Your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  value={email}
                  onChangeText={(value) => { setEmail(value); setError(''); }}
                />
              </View>
            </View>
          )}

          {!!error && <Text style={styles.error} accessibilityLiveRegion="polite">{error}</Text>}

          <TouchableOpacity
            style={styles.sendButton}
            activeOpacity={0.8}
            accessibilityRole="button"
            disabled={showThankYou}
            onPress={handleSendFeedback}
          >
            <Text style={styles.sendButtonText}>Send feedback</Text>
            <Ionicons name="paper-plane-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <Text style={styles.footer}>Your ideas help shape a better Unimate 🧡</Text>
          <Text style={styles.previewNote}>Preview only — feedback is not sent yet.</Text>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={showThankYou}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={() => { setShowThankYou(false); clearForm(); }}
      >
        <Animated.View style={[styles.overlay, { opacity: popupOpacity }]}>
          <Animated.View
            accessibilityViewIsModal
            style={[styles.popup, { transform: [{ scale: popupScale }] }]}
          >
            <View style={styles.celebration}>
              <Ionicons name="sparkles" size={24} color="#FDBA74" />
              <Animated.View style={[styles.successIcon, { transform: [{ scale: checkScale }] }]}>
                <Ionicons name="checkmark" size={44} color="#FFFFFF" />
              </Animated.View>
              <Ionicons name="heart" size={24} color="#FB923C" />
            </View>
            <Text style={styles.popupTitle} accessibilityRole="header">Thank you!</Text>
            <Text style={styles.popupText}>Every little idea makes a difference.</Text>
            <Text style={styles.popupNote}>Preview complete • No feedback was sent</Text>
          </Animated.View>
        </Animated.View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFAF5' },
  body: { flex: 1 },
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
  intro: { alignItems: 'center', paddingVertical: 22 },
  introIcon: {
    width: 68, height: 68, borderRadius: 22, backgroundColor: '#FFEDD5',
    alignItems: 'center', justifyContent: 'center', marginBottom: 18,
  },
  introTitle: { fontSize: 24, fontWeight: '800', color: '#7C2D12', textAlign: 'center' },
  introDescription: { fontSize: 14, lineHeight: 22, color: '#78716C', textAlign: 'center', marginTop: 10, maxWidth: 290 },
  ratingCard: {
    backgroundColor: '#FFFFFF', padding: 18, borderRadius: 20,
    borderWidth: 1, borderColor: '#F0E7DE', alignItems: 'center', marginBottom: 26,
  },
  ratingTitle: { fontSize: 15, fontWeight: '600', color: '#374151', textAlign: 'center' },
  stars: { flexDirection: 'row', justifyContent: 'center', marginTop: 14, flexWrap: 'wrap' },
  starButton: { minWidth: 44, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  ratingHint: { fontSize: 12, color: '#9CA3AF', textAlign: 'center', marginTop: 10 },
  selectedRating: { color: ORANGE, fontWeight: '600' },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 10 },
  feedbackInput: {
    minHeight: 160, backgroundColor: '#FFFFFF', borderWidth: 1,
    borderColor: '#E7E5E4', borderRadius: 16, padding: 16,
    fontSize: 15, lineHeight: 23, color: '#1F2937',
  },
  counter: { fontSize: 12, color: '#9CA3AF', textAlign: 'right', marginTop: 8 },
  emailSection: { marginTop: 22 },
  optionalLabel: { fontSize: 12, fontWeight: '400', color: '#9CA3AF' },
  emailInputContainer: {
    flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFFFFF',
    borderWidth: 1, borderColor: '#E7E5E4', borderRadius: 14, paddingHorizontal: 16,
  },
  emailInput: { flex: 1, paddingVertical: 16, fontSize: 15, color: '#1F2937' },
  error: { color: '#DC2626', fontSize: 13, lineHeight: 19, marginTop: 14 },
  sendButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, backgroundColor: ORANGE, borderRadius: 16, padding: 17, marginTop: 26,
  },
  sendButtonText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  footer: { fontSize: 12, lineHeight: 19, color: '#9CA3AF', textAlign: 'center', marginTop: 20 },
  previewNote: { fontSize: 11, color: '#9A3412', textAlign: 'center', marginTop: 10 },
  overlay: { flex: 1, backgroundColor: 'rgba(28, 25, 23, 0.45)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  popup: {
    width: '100%', maxWidth: 340, backgroundColor: '#FFFFFF', borderRadius: 28,
    paddingHorizontal: 24, paddingVertical: 34, alignItems: 'center',
  },
  celebration: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 22 },
  successIcon: { width: 82, height: 82, borderRadius: 41, backgroundColor: ORANGE, alignItems: 'center', justifyContent: 'center' },
  popupTitle: { fontSize: 30, fontWeight: '800', color: '#7C2D12' },
  popupText: { fontSize: 14, lineHeight: 22, color: '#78716C', textAlign: 'center', marginTop: 10 },
  popupNote: { fontSize: 11, color: '#9CA3AF', textAlign: 'center', marginTop: 18 },
});
