import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  ActivityIndicator,
  Image,
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
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';

const ORANGE = '#EA580C';
const MAX_LENGTH = 500;
// Replace this with your authentication state when connecting login.
const IS_GUEST = true;
// Reports are saved on this device. Connect a backend to send them to your team.
const PROBLEM_TYPES = [
  'App crashes', 'Not working', 'Login or account',
  'Wrong information', 'Notifications', 'Other',
];

export default function ReportProblemScreen() {
  const router = useRouter();
  const [problemType, setProblemType] = useState('');
  const [screenshot, setScreenshot] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [saving, setSaving] = useState(false);
  const [picking, setPicking] = useState(false);
  const pickingRef = useRef(false);
  const [feedback, setFeedback] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [showThankYou, setShowThankYou] = useState(false);
  const popupOpacity = useRef(new Animated.Value(0)).current;
  const popupScale = useRef(new Animated.Value(0.8)).current;
  const checkScale = useRef(new Animated.Value(0)).current;
  const submitting = useRef(false);

  const clearForm = useCallback(() => {
    setProblemType('');
    setScreenshot(null);
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

  const chooseScreenshot = async () => {
    if (pickingRef.current || submitting.current) return;
    pickingRef.current = true;
    setPicking(true);
    setError('');
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,
      });
      if (!result.canceled && result.assets[0]) {
        setScreenshot(result.assets[0]);
      }
    } catch {
      setError('Unable to open your photos. Please try again.');
    } finally {
      pickingRef.current = false;
      setPicking(false);
    }
  };

  const handleSendReport = async () => {
    if (submitting.current || pickingRef.current) return;
    if (!problemType) {
      setError('Please choose a problem type.');
      return;
    }
    if (!feedback.trim()) {
      setError('Please describe what went wrong.');
      return;
    }
    if (IS_GUEST && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (Platform.OS === 'web' || !FileSystem.documentDirectory) {
      setError('Local report saving is available in the Android or iOS app.');
      return;
    }

    submitting.current = true;
    setSaving(true);
    setError('');
    Keyboard.dismiss();
    let imagePath: string | null = null;
    let reportPath: string | null = null;
    try {
      const imageDirectory = `${FileSystem.documentDirectory}report-images/`;
      const reportDirectory = `${FileSystem.documentDirectory}reports/`;
      await FileSystem.makeDirectoryAsync(imageDirectory, { intermediates: true });
      await FileSystem.makeDirectoryAsync(reportDirectory, { intermediates: true });
      const id = `report-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      if (screenshot) {
        // Preserve the original format instead of labelling every image as PNG.
        const extension = screenshot.fileName?.split('.').pop()?.toLowerCase()
          || screenshot.uri.split('?')[0].split('.').pop()?.toLowerCase();
        const safeExtension = extension && /^[a-z0-9]{1,6}$/.test(extension)
          ? extension : 'image';
        imagePath = `${imageDirectory}${id}.${safeExtension}`;
        await FileSystem.copyAsync({ from: screenshot.uri, to: imagePath });
      }

      reportPath = `${reportDirectory}${id}.json`;
      await FileSystem.writeAsStringAsync(reportPath, JSON.stringify({
        id,
        problemType,
        description: feedback.trim(),
        email: IS_GUEST ? email.trim() : null,
        screenshot: imagePath,
        createdAt: new Date().toISOString(),
        status: 'saved-locally',
      }, null, 2));
      setShowThankYou(true);
    } catch {
      // Remove partial files if saving failed. Keep the form so users can retry.
      if (imagePath) await FileSystem.deleteAsync(imagePath, { idempotent: true }).catch(() => {});
      if (reportPath) await FileSystem.deleteAsync(reportPath, { idempotent: true }).catch(() => {});
      submitting.current = false;
      setError('Could not save your report. Please try again.');
    } finally {
      setSaving(false);
    }
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
        <Text style={styles.headerTitle}>Report a problem</Text>
        <View style={styles.headerIcon}>
          <Ionicons name="flag-outline" size={22} color={ORANGE} />
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
              <Ionicons name="construct-outline" size={30} color={ORANGE} />
            </View>
            <Text style={styles.introTitle}>Something not working?</Text>
            <Text style={styles.introDescription}>
              Tell us what went wrong and help us make Unimate better.
            </Text>
          </View>

          <Text style={styles.label}>What kind of problem?</Text>
          <View style={styles.categories}>
            {PROBLEM_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.chip, problemType === type && styles.selectedChip]}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityState={{ selected: problemType === type }}
                disabled={saving}
                onPress={() => { setProblemType(type); setError(''); }}
              >
                <Text style={[styles.chipText, problemType === type && styles.selectedChipText]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Describe the problem</Text>
          <TextInput
            style={styles.feedbackInput}
            placeholder="What happened? What were you trying to do?"
            placeholderTextColor="#9CA3AF"
            accessibilityLabel="Describe the problem"
            editable={!saving}
            multiline
            textAlignVertical="top"
            maxLength={MAX_LENGTH}
            value={feedback}
            onChangeText={(value) => { setFeedback(value); setError(''); }}
          />
          <Text style={styles.counter}>{feedback.length} / {MAX_LENGTH}</Text>

          <View style={styles.screenshotSection}>
            <Text style={styles.label}>
              Add a screenshot <Text style={styles.optionalLabel}>(optional)</Text>
            </Text>
            {screenshot ? (
              <View style={styles.imageCard}>
                <Image source={{ uri: screenshot.uri }} style={styles.screenshot} resizeMode="contain" accessibilityLabel="Selected screenshot" />
                <View style={styles.imageActions}>
                  <TouchableOpacity style={styles.imageAction} disabled={saving || picking} onPress={chooseScreenshot} accessibilityRole="button">
                    <Ionicons name="images-outline" size={18} color={ORANGE} />
                    <Text style={styles.imageActionText}>Change</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.imageAction} disabled={saving || picking} onPress={() => setScreenshot(null)} accessibilityRole="button">
                    <Ionicons name="trash-outline" size={18} color="#DC2626" />
                    <Text style={styles.removeText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity style={styles.uploadButton} disabled={saving || picking} activeOpacity={0.7} onPress={chooseScreenshot} accessibilityRole="button">
                {picking ? <ActivityIndicator color={ORANGE} /> : <Ionicons name="camera-outline" size={24} color={ORANGE} />}
                <Text style={styles.imageActionText}>{picking ? 'Opening photos…' : 'Add screenshot'}</Text>
              </TouchableOpacity>
            )}
          </View>

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
                  editable={!saving}
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
            disabled={saving || picking || showThankYou}
            onPress={handleSendReport}
          >
            <Text style={styles.sendButtonText}>{saving ? 'Saving report…' : 'Send report'}</Text>
            <ActivityIndicator animating={saving} hidesWhenStopped color="#FFFFFF" />
            {!saving && <Ionicons name="paper-plane-outline" size={20} color="#FFFFFF" />}
          </TouchableOpacity>

          <Text style={styles.footer}>Thanks for helping make Unimate better 🧡</Text>
          <Text style={styles.previewNote}>Reports are saved on this device. They are not sent to the team yet.</Text>
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
            <Text style={styles.popupText}>Your report has been saved on this device.</Text>
            <Text style={styles.popupNote}>Not sent to the support team yet</Text>
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
  categories: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 26 },
  chip: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E7E5E4', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, minHeight: 44 },
  selectedChip: { backgroundColor: '#FFEDD5', borderColor: ORANGE },
  chipText: { fontSize: 13, fontWeight: '500', color: '#57534E' },
  selectedChipText: { color: ORANGE, fontWeight: '700' },
  screenshotSection: { marginTop: 22 },
  uploadButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderWidth: 1, borderStyle: 'dashed', borderColor: '#FDBA74', backgroundColor: '#FFF7ED', borderRadius: 16, padding: 24 },
  imageCard: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E7E5E4', borderRadius: 16, overflow: 'hidden' },
  screenshot: { width: '100%', height: 190, backgroundColor: '#F5F5F4' },
  imageActions: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16 },
  imageAction: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 48 },
  imageActionText: { fontSize: 14, color: ORANGE, fontWeight: '600' },
  removeText: { fontSize: 14, color: '#DC2626', fontWeight: '600' },
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
